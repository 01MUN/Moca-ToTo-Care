import type express from 'express';
import { z } from 'zod';

const VALIDATION_FAILED_MESSAGE = '입력값이 올바르지 않습니다.';

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface RequestSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

function toIssues(error: z.ZodError, prefix: string): ValidationIssue[] {
  return error.issues.map((issue) => {
    const path = issue.path.map(String).join('.');
    return { path: prefix && path ? `${prefix}.${path}` : path || prefix, message: issue.message };
  });
}

// Validates req.params / req.query / req.body against zod schemas. On success
// req.body is replaced with the parsed value (unknown keys stripped, defaults
// applied); params/query are validated only. On failure responds 400 with the
// app's { success:false, message } envelope plus field-level `errors`.
export function validate(schemas: RequestSchemas): express.RequestHandler {
  return (req, res, next) => {
    const issues: ValidationIssue[] = [];

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) issues.push(...toIssues(result.error, 'params'));
    }
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) issues.push(...toIssues(result.error, 'query'));
    }
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body ?? {});
      if (result.success) {
        req.body = result.data;
      } else {
        issues.push(...toIssues(result.error, ''));
      }
    }

    if (issues.length > 0) {
      res.status(400).json({ success: false, message: VALIDATION_FAILED_MESSAGE, errors: issues });
      return;
    }
    next();
  };
}

// Converts body-parser failures (malformed JSON, oversized payload) into the
// app's JSON envelope instead of Express's default HTML error page.
export const jsonBodyErrorHandler: express.ErrorRequestHandler = (err, _req, res, next) => {
  const type = (err as { type?: string } | null)?.type;
  if (type === 'entity.parse.failed') {
    res.status(400).json({ success: false, message: '요청 본문(JSON) 형식이 올바르지 않습니다.' });
    return;
  }
  if (type === 'entity.too.large') {
    res.status(413).json({ success: false, message: '요청 본문이 너무 큽니다.' });
    return;
  }
  next(err);
};
