import { jsonFetch } from "./api.js";
import type { Project, Task } from "../types/domain.js";

/**
 * Loads all tasks the user can see by listing accessible projects and
 * merging each project's task list (no dedicated aggregate API).
 */
export async function fetchAccessibleTasks(token: string): Promise<Task[]> {
  const { projects } = await jsonFetch<{ projects: Project[] }>("/api/projects", {
    token,
  });

  const batches = await Promise.all(
    projects.map(async (p) => {
      try {
        const { tasks } = await jsonFetch<{ tasks: Task[] }>(
          `/api/projects/${p.id}/tasks`,
          { token },
        );
        return tasks;
      } catch {
        return [];
      }
    }),
  );

  return batches.flat();
}
