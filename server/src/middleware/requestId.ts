import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.id = requestId;
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = req.startTime ? Date.now() - req.startTime : 0;
    const isHealthCheck = req.path === '/health' || req.path === '/api/health' || req.path === '/readiness';

    if (!isHealthCheck && process.env.NODE_ENV !== 'test') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO',
        requestId,
        method: req.method,
        path: req.originalUrl || req.path,
        status: res.statusCode,
        durationMs: `${durationMs}ms`,
        ip: req.ip || req.socket?.remoteAddress,
        userId: req.user?._id?.toString() || 'anonymous',
      };
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
}
