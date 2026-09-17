import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.isProduction ? env.RATE_LIMIT_MAX : 10000,
  skip: () => !env.isProduction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.isProduction ? env.RATE_LIMIT_AUTH_MAX : 1000,
  skip: () => !env.isProduction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later.' },
  },
});

export const inviteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.isProduction ? env.RATE_LIMIT_INVITE_MAX : 1000,
  skip: () => !env.isProduction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Invitation rate limit exceeded. Please try again later.',
    },
  },
});

export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.isProduction ? 30 : 1000,
  skip: () => !env.isProduction,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'File upload rate limit reached. Please wait before uploading more files.',
    },
  },
});
