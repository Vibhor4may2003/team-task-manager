import mongoose, { Schema } from "mongoose";

const TASK_STATUS_VALUES = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
] as const;

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: TASK_STATUS_VALUES,
      required: true,
      default: "TODO",
    },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true },
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1, dueDate: 1 });
taskSchema.index({ dueDate: 1, status: 1 });

export type TaskDocument = mongoose.InferSchemaType<typeof taskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TaskModel =
  (mongoose.models.Task as mongoose.Model<TaskDocument>) ??
  mongoose.model<TaskDocument>("Task", taskSchema);

export { TASK_STATUS_VALUES };
export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];
