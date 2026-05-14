import mongoose from "mongoose";
import { z } from "zod";

export const objectIdString = z
  .string()
  .trim()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), "Invalid ObjectId");
