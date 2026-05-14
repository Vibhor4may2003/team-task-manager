import type { Task, TaskStatus } from "../../types/domain.js";

export const STATUS_ORDER: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
];

export type StatusCounts = Record<TaskStatus, number>;

export type DashboardMetrics = {
  total: number;
  byStatus: StatusCounts;
  completionRate: number;
  overdueCount: number;
  overdueTasks: Task[];
};

/** Start of "today" in local time (midnight). */
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parses ISO due date and returns local calendar date (midnight). */
export function dueDateLocalDay(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Overdue: local calendar due date is strictly before today, and status is not COMPLETED.
 */
export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.status === "COMPLETED") return false;
  const dueDay = dueDateLocalDay(task.dueDate);
  const today = startOfLocalDay(now);
  return dueDay.getTime() < today.getTime();
}

export function computeDashboardMetrics(tasks: Task[]): DashboardMetrics {
  const byStatus: StatusCounts = {
    TODO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    COMPLETED: 0,
  };

  for (const t of tasks) {
    byStatus[t.status] += 1;
  }

  const total = tasks.length;
  const completed = byStatus.COMPLETED;
  const completionRate =
    total === 0 ? 0 : Math.round((completed / total) * 1000) / 10;

  const overdueTasks = tasks.filter((t) => isTaskOverdue(t));

  return {
    total,
    byStatus,
    completionRate,
    overdueCount: overdueTasks.length,
    overdueTasks: overdueTasks.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    ),
  };
}
