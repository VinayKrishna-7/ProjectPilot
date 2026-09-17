export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const Errors = {
  notFound: (entity: string) =>
    new AppError(`${entity} not found`, 404, `${entity.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`),
  unauthorized: () =>
    new AppError('Authentication required', 401, 'UNAUTHORIZED'),
  forbidden: () =>
    new AppError('Access denied', 403, 'FORBIDDEN'),
  badRequest: (message: string) =>
    new AppError(message, 400, 'BAD_REQUEST'),
  conflict: (message: string) =>
    new AppError(message, 409, 'CONFLICT'),
  validation: (message: string, details?: unknown) => {
    const err = new AppError(message, 422, 'VALIDATION_ERROR');
    (err as any).details = details;
    return err;
  },
};
