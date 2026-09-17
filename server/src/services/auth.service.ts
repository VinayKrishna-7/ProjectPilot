import { User, IUserDocument } from '../models/User';
import { Session, ISessionDocument } from '../models/Session';
import { AppError } from '../utils/AppError';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../middleware/auth';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from '../validators/auth.validator';

export interface ClientMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthResult {
  user: IUserDocument;
  token: string;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export class AuthService {
  /** Creates a new user account. Throws 409 if the email is already registered. */
  async register(input: RegisterInput, meta?: ClientMeta): Promise<AuthResult> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new AppError('Email already in use', 409, 'EMAIL_IN_USE');
    }

    const user = new User({
      name: input.name,
      email: input.email,
      passwordHash: input.password,
    });
    await user.save();

    const { token: refreshToken, hash: refreshTokenHash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await Session.create({
      user: user._id,
      refreshTokenHash,
      userAgent: meta?.userAgent || 'Unknown',
      ipAddress: meta?.ipAddress || '127.0.0.1',
      lastActiveAt: new Date(),
      expiresAt,
    });

    const accessToken = generateAccessToken(user._id.toString(), user.email, session._id.toString());

    return {
      user,
      token: accessToken,
      accessToken,
      refreshToken,
      sessionId: session._id.toString(),
    };
  }

  /** Validates credentials and returns signed access and refresh tokens. */
  async login(input: LoginInput, meta?: ClientMeta): Promise<AuthResult> {
    const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new AppError(
        `No account found with email "${input.email}". Please check for typos or create an account.`,
        404,
        'USER_NOT_FOUND'
      );
    }

    const isValid = await user.comparePassword(input.password);
    if (!isValid) {
      throw new AppError(
        `Incorrect password entered for "${input.email}". Please check your password and try again.`,
        401,
        'WRONG_PASSWORD'
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    const { token: refreshToken, hash: refreshTokenHash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await Session.create({
      user: user._id,
      refreshTokenHash,
      userAgent: meta?.userAgent || 'Unknown',
      ipAddress: meta?.ipAddress || '127.0.0.1',
      lastActiveAt: new Date(),
      expiresAt,
    });

    const accessToken = generateAccessToken(user._id.toString(), user.email, session._id.toString());

    return {
      user,
      token: accessToken,
      accessToken,
      refreshToken,
      sessionId: session._id.toString(),
    };
  }

  /** Rotates an existing refresh token and returns a new access/refresh token pair. */
  async refreshTokens(
    oldRefreshToken: string,
    meta?: ClientMeta
  ): Promise<{ accessToken: string; refreshToken: string; user: IUserDocument }> {
    if (!oldRefreshToken) {
      throw new AppError('Refresh token required', 401, 'REFRESH_TOKEN_REQUIRED');
    }

    const hash = hashToken(oldRefreshToken);
    const session = await Session.findOne({ refreshTokenHash: hash }).select('+refreshTokenHash');

    if (!session) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Reuse detection: If session was already revoked, revoke ALL user sessions for breach containment
    if (session.isRevoked) {
      await Session.updateMany({ user: session.user }, { $set: { isRevoked: true } });
      throw new AppError('Compromised token reuse detected. All sessions revoked.', 401, 'TOKEN_REUSE_DETECTED');
    }

    if (new Date() > session.expiresAt) {
      session.isRevoked = true;
      await session.save();
      throw new AppError('Refresh token expired', 401, 'EXPIRED_REFRESH_TOKEN');
    }

    const user = await User.findById(session.user);
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    // Rotate token
    const { token: newRefreshToken, hash: newHash } = generateRefreshToken();
    session.refreshTokenHash = newHash;
    session.lastActiveAt = new Date();
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (meta?.userAgent) session.userAgent = meta.userAgent;
    if (meta?.ipAddress) session.ipAddress = meta.ipAddress;
    await session.save();

    const accessToken = generateAccessToken(user._id.toString(), user.email, session._id.toString());

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    };
  }

  /** Lists active unrevoked sessions for a user. */
  async getSessions(userId: string, currentSessionId?: string): Promise<any[]> {
    const sessions = await Session.find({
      user: userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActiveAt: -1 });

    return sessions.map((s) => ({
      _id: s._id.toString(),
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: currentSessionId ? s._id.toString() === currentSessionId : false,
    }));
  }

  /** Revokes a specific session. */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    session.isRevoked = true;
    await session.save();
  }

  /** Revokes all other sessions except current. */
  async revokeOtherSessions(userId: string, currentSessionId?: string): Promise<void> {
    const query: Record<string, unknown> = { user: userId, isRevoked: false };
    if (currentSessionId) {
      query._id = { $ne: currentSessionId };
    }
    await Session.updateMany(query, { $set: { isRevoked: true } });
  }

  /** Logs out and invalidates the session. */
  async logout(refreshToken?: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await Session.findByIdAndUpdate(sessionId, { $set: { isRevoked: true } });
    } else if (refreshToken) {
      const hash = hashToken(refreshToken);
      await Session.findOneAndUpdate({ refreshTokenHash: hash }, { $set: { isRevoked: true } });
    }
  }

  /** Fetches a user by ID without sensitive fields. */
  async getCurrentUser(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user;
  }

  /** Partially updates allowed profile fields. */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<IUserDocument> {
    const setOp = { $set: input };
    const user = await User.findByIdAndUpdate(userId, setOp, { new: true, runValidators: true });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user;
  }

  /** Changes the user's password after verifying the current one. Pre-save hook hashes the new password. */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const isValid = await user.comparePassword(input.currentPassword);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400, 'WRONG_PASSWORD');
    }

    user.passwordHash = input.newPassword;
    await user.save();
  }
}

export const authService = new AuthService();