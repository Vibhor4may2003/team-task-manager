import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ members: 1 });

export type ProjectDocument = mongoose.InferSchemaType<typeof projectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProjectModel =
  (mongoose.models.Project as mongoose.Model<ProjectDocument>) ??
  mongoose.model<ProjectDocument>("Project", projectSchema);
