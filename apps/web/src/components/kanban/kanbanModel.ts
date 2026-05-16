import type { Task, TaskStatus } from "../../types/domain.js";

export const COLUMN_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
];

export const COLUMN_TITLES: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
};

export type ColumnsState = Record<TaskStatus, Task[]>;

export function emptyColumns(): ColumnsState {
  return {
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    COMPLETED: [],
  };
}

export function cloneColumns(cols: ColumnsState): ColumnsState {
  return {
    TODO: [...cols.TODO],
    IN_PROGRESS: [...cols.IN_PROGRESS],
    REVIEW: [...cols.REVIEW],
    COMPLETED: [...cols.COMPLETED],
  };
}

export function groupTasksByStatus(tasks: Task[]): ColumnsState {
  const next = emptyColumns();
  for (const task of tasks) {
    next[task.status].push(task);
  }
  return next;
}

export function findTaskLocation(
  cols: ColumnsState,
  taskId: string,
): { task: Task; status: TaskStatus; index: number } | null {
  for (const status of COLUMN_STATUSES) {
    const index = cols[status].findIndex((t) => t.id === taskId);
    if (index !== -1) {
      return { task: cols[status][index], status, index };
    }
  }
  return null;
}

export function isColumnId(id: string): id is TaskStatus {
  return (COLUMN_STATUSES as readonly string[]).includes(id);
}

export function moveTaskToStatus(
  cols: ColumnsState,
  taskId: string,
  from: TaskStatus,
  to: TaskStatus,
): ColumnsState {
  if (from === to) return cols;
  const next = cloneColumns(cols);
  const fromIndex = next[from].findIndex((t) => t.id === taskId);
  if (fromIndex === -1) return cols;
  const [moved] = next[from].splice(fromIndex, 1);
  next[to].push({ ...moved, status: to });
  return next;
}

export function replaceTask(cols: ColumnsState, updated: Task): ColumnsState {
  const next = cloneColumns(cols);
  for (const status of COLUMN_STATUSES) {
    const idx = next[status].findIndex((t) => t.id === updated.id);
    if (idx !== -1) {
      next[status].splice(idx, 1);
      break;
    }
  }
  next[updated.status].push(updated);
  return next;
}

export function removeTask(cols: ColumnsState, taskId: string): ColumnsState {
  const next = cloneColumns(cols);
  for (const status of COLUMN_STATUSES) {
    const idx = next[status].findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      next[status].splice(idx, 1);
      break;
    }
  }
  return next;
}

export function addTask(cols: ColumnsState, task: Task): ColumnsState {
  const next = cloneColumns(cols);
  next[task.status] = [task, ...next[task.status]];
  return next;
}
