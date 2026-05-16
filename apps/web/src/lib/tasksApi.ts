import { jsonFetch } from "./api.js";
import type { Task, TaskStatus } from "../types/domain.js";

export async function patchTaskStatus(
  taskId: string,
  status: TaskStatus,
  token: string,
): Promise<Task> {
  const data = await jsonFetch<{ task: Task }>(`/api/tasks/${taskId}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
  return data.task;
}

export type CreateTaskInput = {
  title: string;
  description?: string;
  dueDate: string;
  assignee?: string | null;
  status?: TaskStatus;
};

export async function createTask(
  projectId: string,
  input: CreateTaskInput,
  token: string,
): Promise<Task> {
  const data = await jsonFetch<{ task: Task }>(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    body: input,
    token,
  });
  return data.task;
}

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  dueDate?: string;
  assignee?: string | null;
  status?: TaskStatus;
};

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
  token: string,
): Promise<Task> {
  const data = await jsonFetch<{ task: Task }>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: input,
    token,
  });
  return data.task;
}

export async function deleteTask(taskId: string, token: string): Promise<void> {
  await jsonFetch<void>(`/api/tasks/${taskId}`, {
    method: "DELETE",
    token,
  });
}
