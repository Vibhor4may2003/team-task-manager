import type { NextFunction, Request, Response } from "express";
import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { UserRole } from "../models/User.js";
import { ROLE_VALUES } from "../models/User.js";
import { HttpError } from "../utils/http-error.js";

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

function readBearerToken(req: Request): string | null {
  const raw = req.header("authorization");
  if (!raw || typeof raw !== "string") return null;
  const [scheme, token] = raw.split(/\s+/, 2);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim() || null;
}

/**
 * Verifies `Authorization: Bearer <jwt>` and attaches `req.auth`.
 * Missing/invalid tokens short-circuit with 401 before downstream handlers run.
 */
export function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    next(new HttpError(500, "JWT_SECRET is not configured"));
    return;
  }

  const token = readBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    const sub = decoded.sub;
    const email = decoded.email;
    const role = decoded.role;

    if (
      typeof sub !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string" ||
      !(ROLE_VALUES as readonly string[]).includes(role)
    ) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    req.auth = {
      userId: sub,
      email,
      role: role as UserRole,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Factory returning middleware that requires `req.auth.role` to be one of `allowedRoles`.
 * Must run after `verifyToken`. Unauthorized roles receive 403.
 */
export function checkRole(allowedRoles: UserRole[]) {
  const allowed = new Set<UserRole>(allowedRoles);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!allowed.has(req.auth.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function signAccessToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new HttpError(500, "JWT_SECRET is not configured");
  }
  const expiresSeconds = Number(process.env.JWT_EXPIRES_SECONDS);
  const signOptions: SignOptions = Number.isFinite(expiresSeconds) && expiresSeconds > 0
    ? { expiresIn: expiresSeconds }
    : { expiresIn: "7d" };

  return jwt.sign(
    { sub: payload.sub, email: payload.email, role: payload.role },
    secret,
    signOptions,
  );
}
