import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/** Validates req.body against a Zod schema. Replaces req.body with parsed value on success. */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Validates req.query against a Zod schema. Replaces req.query with parsed value on success. */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      next(err);
    }
  };
}