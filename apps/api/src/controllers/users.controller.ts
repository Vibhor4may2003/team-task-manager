import type { Request, Response } from "express";
import { UserModel } from "../models/User.js";
import { asyncHandler } from "../utils/async-handler.js";

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await UserModel.find({}, { email: 1, fullName: 1, role: 1, createdAt: 1 })
    .sort({ createdAt: 1 })
    .limit(500)
    .lean()
    .exec();

  res.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      fullName: u.fullName ?? null,
      role: u.role,
    })),
  });
});
