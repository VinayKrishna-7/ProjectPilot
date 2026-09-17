import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export interface JwtPayload {
  userId: string;
  email: string;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: import('mongoose').Types.ObjectId;
        email: string;
        name: string;
      };
      sessionId?: string;
    }
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(40).toString('hex');
  const hash = hashToken(token);
  return { token, hash };
}

export function generateAccessToken(userId: string, email: string, sessionId?: string): string {
  return jwt.sign({ userId, email, sessionId } as JwtPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

// Backwards compatibility alias
export function generateToken(userId: string, email: string): string {
  return generateAccessToken(userId, email);
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken?: string): void {
  const isProd = env.isProduction;
  const sameSiteSetting = isProd ? 'strict' : 'lax';
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // Set access token cookie
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSiteSetting,
    maxAge: thirtyDaysMs, // 30 days
    path: '/',
  });

  // Also set legacy 'token' cookie for seamless backwards compatibility
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSiteSetting,
    maxAge: thirtyDaysMs, // 30 days
    path: '/',
  });

  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSiteSetting,
      maxAge: thirtyDaysMs, // 30 days
      path: '/',
    });
  }
}

// Backwards compatibility alias
export function setCookie(res: Response, token: string): void {
  setAuthCookies(res, token);
}

export function clearAuthCookies(res: Response): void {
  const isProd = env.isProduction;
  const sameSiteSetting = isProd ? 'strict' : 'lax';

  const clearOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSiteSetting as any,
    maxAge: 0,
    path: '/',
  };

  res.cookie('access_token', '', clearOpts);
  res.cookie('refresh_token', '', clearOpts);
  res.cookie('token', '', clearOpts);
}

// Backwards compatibility alias
export function clearCookie(res: Response): void {
  clearAuthCookies(res);
}

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    // Optional session revocation check if sessionId is present
    if (decoded.sessionId) {
      const session = await Session.findById(decoded.sessionId);
      if (session && session.isRevoked) {
        throw new AppError('Session has been revoked', 401, 'SESSION_REVOKED');
      }
    }

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
    };
    req.sessionId = decoded.sessionId;
    next();
  }
);
