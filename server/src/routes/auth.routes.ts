import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  getSessions,
  revokeSession,
  revokeOtherSessions,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authRateLimit } from '../middleware/rateLimit';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);
router.post('/refresh', authRateLimit, refreshToken);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, validate(updateProfileSchema), updateProfile);
router.patch('/change-password', requireAuth, validate(changePasswordSchema), changePassword);

// Session management
router.get('/sessions', requireAuth, getSessions);
router.delete('/sessions/:id', requireAuth, revokeSession);
router.delete('/sessions', requireAuth, revokeOtherSessions);

export default router;
