import { z } from "zod";
import { objectIdString } from "./common.js";

export const createProjectBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().default(""),
  members: z.array(objectIdString).max(500).optional().default([]),
});

export const updateProjectBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    members: z.array(objectIdString).max(500).optional(),
  })
  .strict()
  .refine(
    (v) => v.name !== undefined || v.description !== undefined || v.members !== undefined,
    { message: "At least one field is required" },
  );

export const projectIdParamsSchema = z.object({
  projectId: objectIdString,
});

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
