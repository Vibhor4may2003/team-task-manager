import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { z, ZodTypeAny } from "zod";

type RequestPart = "body" | "query" | "params";

function validatePart<T extends ZodTypeAny>(
  part: RequestPart,
  schema: T,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[part]);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
      return;
    }
    if (part === "body") {
      req.body = parsed.data;
    } else if (part === "params") {
      Object.assign(req.params, parsed.data as Record<string, string>);
    } else {
      Object.assign(req.query as Record<string, unknown>, parsed.data as object);
    }
    next();
  };
}

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return validatePart("body", schema);
}

export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return validatePart("query", schema);
}

export function validateParams<T extends ZodTypeAny>(schema: T) {
  return validatePart("params", schema);
}

export type InferBody<T extends ZodTypeAny> = z.infer<T>;
export type InferParams<T extends ZodTypeAny> = z.infer<T>;
export type InferQuery<T extends ZodTypeAny> = z.infer<T>;
