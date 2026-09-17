import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { setAuthCookies, clearAuthCookies } from '../middleware/auth';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

function getClientMeta(req: Request) {
  return {
    userAgent: (req.headers['user-agent'] as string) || 'Unknown Client',
    ipAddress: req.ip || (req.socket?.remoteAddress as string) || '127.0.0.1',
  };
}

/** POST /api/auth/register */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const meta = getClientMeta(req);
  const { user, token, accessToken, refreshToken, sessionId } = await authService.register(req.body, meta);
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(res, { user, token, accessToken, refreshToken, sessionId }, 201, 'Registration successful');
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const meta = getClientMeta(req);
  const { user, token, accessToken, refreshToken, sessionId } = await authService.login(req.body, meta);
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(res, { user, token, accessToken, refreshToken, sessionId }, 200, 'Login successful');
});

/** POST /api/auth/refresh */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token || req.body?.refreshToken;
  const meta = getClientMeta(req);
  const result = await authService.refreshTokens(token, meta);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  sendSuccess(res, {
    user: result.user,
    token: result.accessToken,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  }, 200, 'Token refreshed successfully');
});

/** GET /api/auth/sessions */
export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const sessions = await authService.getSessions(userId, req.sessionId);
  sendSuccess(res, { sessions });
});

/** DELETE /api/auth/sessions/:id */
export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  await authService.revokeSession(userId, req.params.id);
  sendSuccess(res, null, 200, 'Session revoked');
});

/** DELETE /api/auth/sessions */
export const revokeOtherSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  await authService.revokeOtherSessions(userId, req.sessionId);
  sendSuccess(res, null, 200, 'Other sessions revoked');
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshCookie = req.cookies?.refresh_token || req.body?.refreshToken;
  await authService.logout(refreshCookie, req.sessionId);
  clearAuthCookies(res);
  sendSuccess(res, null, 200, 'Logged out successfully');
});

/** GET /api/auth/me */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!._id.toString());
  sendSuccess(res, { user });
});

/** PATCH /api/auth/profile */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(req.user!._id.toString(), req.body);
  sendSuccess(res, { user }, 200, 'Profile updated');
});

/** PATCH /api/auth/change-password */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!._id.toString(), req.body);
  sendSuccess(res, null, 200, 'Password changed successfully');
});