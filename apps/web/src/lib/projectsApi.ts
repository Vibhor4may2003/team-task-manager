import { jsonFetch } from "./api.js";
import type { Project } from "../types/domain.js";

export type DirectoryUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
};

export async function listProjects(token: string): Promise<Project[]> {
  const data = await jsonFetch<{ projects: Project[] }>("/api/projects", { token });
  return data.projects;
}

export async function getProject(projectId: string, token: string): Promise<Project> {
  const data = await jsonFetch<{ project: Project }>(`/api/projects/${projectId}`, { token });
  return data.project;
}

export async function createProject(
  input: { name: string; description?: string; members?: string[] },
  token: string,
): Promise<Project> {
  const data = await jsonFetch<{ project: Project }>("/api/projects", {
    method: "POST",
    body: input,
    token,
  });
  return data.project;
}

export async function updateProject(
  projectId: string,
  input: { name?: string; description?: string; members?: string[] },
  token: string,
): Promise<Project> {
  const data = await jsonFetch<{ project: Project }>(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: input,
    token,
  });
  return data.project;
}

export async function deleteProject(projectId: string, token: string): Promise<void> {
  await jsonFetch<void>(`/api/projects/${projectId}`, {
    method: "DELETE",
    token,
  });
}

export async function listUsers(token: string): Promise<DirectoryUser[]> {
  const data = await jsonFetch<{ users: DirectoryUser[] }>("/api/users", { token });
  return data.users;
}
