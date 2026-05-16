import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { UserModel } from "../models/User.js";
import { signAccessToken } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import type { LoginBody, SignupBody } from "../validators/auth.validators.js";

function publicUser(doc: {
  _id: { toString: () => string };
  email: string;
  fullName?: string | null;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    fullName: doc.fullName ?? null,
    role: doc.role,
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

async function resolveSignupRole(adminCode: string | undefined): Promise<"Admin" | "Member"> {
  const expectedCode = process.env.ADMIN_SIGNUP_CODE;
  if (expectedCode && adminCode && adminCode === expectedCode) {
    return "Admin";
  }
  const userCount = await UserModel.estimatedDocumentCount().exec();
  if (userCount === 0) {
    return "Admin";
  }
  return "Member";
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName, adminCode } = req.body as SignupBody;
  const role = await resolveSignupRole(adminCode);
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    email,
    passwordHash,
    fullName,
    role,
  });

  const token = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  res.status(201).json({ token, user: publicUser(user) });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginBody;
  const user = await UserModel.findOne({ email }).select("+passwordHash").exec();

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  res.json({
    token,
    user: publicUser(user),
  });
});
