import mongoose from "mongoose";
import type { Request, Response } from "express";
import { ProjectModel } from "../models/Project.js";
import { TaskModel } from "../models/Task.js";
import { UserModel } from "../models/User.js";
import { asyncHandler } from "../utils/async-handler.js";
import { userHasProjectAccess } from "../utils/access.js";
import { HttpError } from "../utils/http-error.js";
import type { CreateTaskBody, UpdateTaskBody, UpdateTaskStatusBody } from "../validators/task.validators.js";

function serializeTask(doc: {
  _id: { toString: () => string };
  title: string;
  description?: string;
  project: unknown;
  assignee?: unknown;
  status: string;
  dueDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: doc._id.toString(),
    projectId: String(doc.project),
    assigneeId: doc.assignee == null ? null : String(doc.assignee),
    title: doc.title,
    description: doc.description ?? "",
    status: doc.status,
    dueDate: doc.dueDate.toISOString(),
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

async function loadProjectLean(projectId: string) {
  return ProjectModel.findById(projectId).lean().exec();
}

function teamUserIds(project: {
  owner: unknown;
  members?: unknown[] | null;
}): Set<string> {
  const ids = new Set<string>();
  ids.add(String(project.owner));
  for (const m of project.members ?? []) {
    ids.add(String(m));
  }
  return ids;
}

async function assertAssigneeInTeam(
  assigneeId: string,
  project: { owner: unknown; members?: unknown[] | null },
) {
  const exists = await UserModel.exists({ _id: assigneeId }).exec();
  if (!exists) {
    throw new HttpError(400, "Assignee user does not exist");
  }
  if (!teamUserIds(project).has(assigneeId)) {
    throw new HttpError(400, "Assignee must be the project owner or a project member");
  }
}

export const listTasksForProject = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = req.auth!;
    const { projectId } = req.params as { projectId: string };

    const project = await loadProjectLean(projectId);
    if (!project) {
      throw new HttpError(404, "Project not found");
    }
    if (!userHasProjectAccess(auth.role, auth.userId, project)) {
      throw new HttpError(403, "Forbidden");
    }

    const tasks = await TaskModel.find({ project: projectId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    res.json({ tasks: tasks.map(serializeTask) });
  },
);

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const { projectId } = req.params as { projectId: string };
  const body = req.body as CreateTaskBody;

  const project = await ProjectModel.findById(projectId).exec();
  if (!project) {
    throw new HttpError(404, "Project not found");
  }
  if (!userHasProjectAccess(auth.role, auth.userId, project)) {
    throw new HttpError(403, "Forbidden");
  }

  let assignee: mongoose.Types.ObjectId | null = null;
  if (body.assignee != null) {
    await assertAssigneeInTeam(body.assignee, project);
    assignee = new mongoose.Types.ObjectId(body.assignee);
  }

  const task = await TaskModel.create({
    title: body.title,
    description: body.description,
    project: new mongoose.Types.ObjectId(projectId),
    assignee,
    dueDate: body.dueDate,
    status: body.status ?? "TODO",
  });

  res.status(201).json({ task: serializeTask(task) });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const { taskId } = req.params as { taskId: string };

  const task = await TaskModel.findById(taskId).lean().exec();
  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  const project = await loadProjectLean(String(task.project));
  if (!project) {
    throw new HttpError(404, "Project not found");
  }
  if (!userHasProjectAccess(auth.role, auth.userId, project)) {
    throw new HttpError(403, "Forbidden");
  }

  res.json({ task: serializeTask(task) });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const { taskId } = req.params as { taskId: string };
  const body = req.body as UpdateTaskBody;

  const task = await TaskModel.findById(taskId).exec();
  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  const project = await ProjectModel.findById(task.project).exec();
  if (!project) {
    throw new HttpError(404, "Project not found");
  }
  if (!userHasProjectAccess(auth.role, auth.userId, project)) {
    throw new HttpError(403, "Forbidden");
  }

  if (body.title !== undefined) task.title = body.title;
  if (body.description !== undefined) task.description = body.description;
  if (body.dueDate !== undefined) task.dueDate = body.dueDate;
  if (body.status !== undefined) task.status = body.status;

  if (body.assignee !== undefined) {
    if (body.assignee === null) {
      task.assignee = null;
    } else {
      await assertAssigneeInTeam(body.assignee, project);
      task.assignee = new mongoose.Types.ObjectId(body.assignee);
    }
  }

  await task.save();
  res.json({ task: serializeTask(task) });
});

export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const { taskId } = req.params as { taskId: string };
  const { status } = req.body as UpdateTaskStatusBody;

  const task = await TaskModel.findById(taskId).exec();
  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  const project = await ProjectModel.findById(task.project).exec();
  if (!project) {
    throw new HttpError(404, "Project not found");
  }
  if (!userHasProjectAccess(auth.role, auth.userId, project)) {
    throw new HttpError(403, "Forbidden");
  }

  task.status = status;
  await task.save();
  res.json({ task: serializeTask(task) });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const auth = req.auth!;
  const { taskId } = req.params as { taskId: string };

  const task = await TaskModel.findById(taskId).exec();
  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  const project = await ProjectModel.findById(task.project).exec();
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const isOwner = String(project.owner) === auth.userId;
  if (auth.role !== "Admin" && !isOwner) {
    throw new HttpError(403, "Forbidden");
  }

  await task.deleteOne();
  res.status(204).send();
});
