import type { UserRole } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      /** Populated by `verifyToken` after a valid Bearer JWT. */
      auth?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};
