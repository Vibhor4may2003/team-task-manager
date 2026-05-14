import type { UserRole } from "../models/User.js";
import type { ProjectDocument } from "../models/Project.js";

export function userHasProjectAccess(
  role: UserRole,
  userId: string,
  project: Pick<ProjectDocument, "owner" | "members">,
): boolean {
  if (role === "Admin") return true;
  const uid = userId;
  const ownerId =
    typeof project.owner === "string"
      ? project.owner
      : project.owner.toString();
  if (ownerId === uid) return true;
  const members = project.members ?? [];
  return members.some((m) =>
    typeof m === "string" ? m === uid : m.toString() === uid,
  );
}
