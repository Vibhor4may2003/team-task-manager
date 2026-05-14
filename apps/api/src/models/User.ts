import mongoose, { Schema } from "mongoose";

const ROLE_VALUES = ["Admin", "Member"] as const;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, trim: true },
    role: {
      type: String,
      enum: ROLE_VALUES,
      required: true,
      default: "Member",
    },
  },
  { timestamps: true },
);

export type UserDocument = mongoose.InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", userSchema);

export { ROLE_VALUES };
export type UserRole = (typeof ROLE_VALUES)[number];
