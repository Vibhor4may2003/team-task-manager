export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";

export type Task = {
  id: string;
  projectId: string;
  assigneeId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string | null;
  updatedAt: string | null;
};
