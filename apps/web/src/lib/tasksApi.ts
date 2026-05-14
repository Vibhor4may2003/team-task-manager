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
