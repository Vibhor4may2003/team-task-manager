import mongoose from "mongoose";
import type { Request, Response } from "express";
import { ProjectModel } from "../models/Project.js";
import { TaskModel } from "../models/Task.js";
import { UserModel } from "../models/User.js";
import { asyncHandler } from "../utils/async-handler.js";
import { userHasProjectAccess } from "../utils/access.js";
import { HttpError } from "../utils/http-error.js";
import type {
  CreateProjectBody,
  UpdateProjectBody,
} from "../validators/project.validators.js";

function serializeProject(doc: {
  _id: { toString: () => string };
  name: string;
  description?: string;
  owner: unknown;
  members?: unknown[];
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? "",
    ownerId: String(doc.owner),
    memberIds: (doc.members ?? []).map((m) => String(m)),
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

async function assertUsersExist(userIds: string[]) {
  if (userIds.length === 0) return;
  const count = await UserModel.countDocuments({
    _id: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).exec();
  if (count !== userIds.length) {
    throw new HttpError(400, "One or more member user IDs do not exist");
  }
}

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const filter =
    auth.role === "Admin"
      ? {}
      : {
          $or: [
            { owner: new mongoose.Types.ObjectId(auth.userId) },
            { members: new mongoose.Types.ObjectId(auth.userId) },
          ],
        };

  const projects = await ProjectModel.find(filter).sort({ createdAt: -1 }).lean().exec();
  res.json({ projects: projects.map(serializeProject) });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const { name, description, members } = req.body as CreateProjectBody;

  const ownerId = auth.userId;
  const memberIds = [...new Set(members.filter((id) => id !== ownerId))];
  await assertUsersExist(memberIds);

  const project = await ProjectModel.create({
    name,
    description,
    owner: new mongoose.Types.ObjectId(ownerId),
    members: memberIds.map((id) => new mongoose.Types.ObjectId(id)),
  });

  res.status(201).json({ project: serializeProject(project) });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const { projectId } = req.params as { projectId: string };

  const project = await ProjectModel.findById(projectId).lean().exec();
  if (!project) {
    throw new HttpError(404, "Project not found");
  }
  if (!userHasProjectAccess(auth.role, auth.userId, project)) {
    throw new HttpError(403, "Forbidden");
  }

  res.json({ project: serializeProject(project) });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const { projectId } = req.params as { projectId: string };
  const body = req.body as UpdateProjectBody;

  const project = await ProjectModel.findById(projectId).exec();
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const isOwner = String(project.owner) === auth.userId;
  if (auth.role !== "Admin" && !isOwner) {
    throw new HttpError(403, "Forbidden");
  }

  if (body.name !== undefined) project.name = body.name;
  if (body.description !== undefined) project.description = body.description;
  if (body.members !== undefined) {
    const ownerId = String(project.owner);
    const memberIds = [...new Set(body.members.filter((id) => id !== ownerId))];
    await assertUsersExist(memberIds);
    project.members = memberIds.map((id) => new mongoose.Types.ObjectId(id));
  }

  await project.save();
  res.json({ project: serializeProject(project) });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const { projectId } = req.params as { projectId: string };

  const project = await ProjectModel.findById(projectId).exec();
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const isOwner = String(project.owner) === auth.userId;
  if (auth.role !== "Admin" && !isOwner) {
    throw new HttpError(403, "Forbidden");
  }

  await TaskModel.deleteMany({ project: project._id }).exec();
  await project.deleteOne();
  res.status(204).send();
});
