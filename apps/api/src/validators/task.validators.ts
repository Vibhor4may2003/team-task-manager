import { z } from "zod";
import { TASK_STATUS_VALUES } from "../models/Task.js";
import { objectIdString } from "./common.js";

export const createTaskBodySchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(10000).optional().default(""),
  dueDate: z.coerce.date(),
  assignee: objectIdString.optional().nullable(),
  status: z.enum(TASK_STATUS_VALUES).optional(),
});

export const updateTaskBodySchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().max(10000).optional(),
    dueDate: z.coerce.date().optional(),
    assignee: objectIdString.nullable().optional(),
    status: z.enum(TASK_STATUS_VALUES).optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.dueDate !== undefined ||
      v.assignee !== undefined ||
      v.status !== undefined,
    { message: "At least one field is required" },
  );

export const updateTaskStatusBodySchema = z.object({
  status: z.enum(TASK_STATUS_VALUES),
});

export const taskIdParamsSchema = z.object({
  taskId: objectIdString,
});

export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
export type UpdateTaskStatusBody = z.infer<typeof updateTaskStatusBodySchema>;
