import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import {
  createProject,
  deleteProject,
  listProjects,
  listUsers,
  updateProject,
  type DirectoryUser,
} from "../lib/projectsApi.js";
import type { Project } from "../types/domain.js";

type EditingState =
  | { mode: "create" }
  | { mode: "edit"; project: Project }
  | null;

export function ProjectsPage() {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [ps, us] = await Promise.all([listProjects(token), listUsers(token)]);
      setProjects(ps);
      setUsers(us);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const usersById = useMemo(() => {
    const map = new Map<string, DirectoryUser>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const isAdmin = user?.role === "Admin";
  const canManage = (project: Project) =>
    isAdmin || (user != null && project.ownerId === user.id);

  async function handleDelete(project: Project) {
    if (!token) return;
    const ok = window.confirm(
      `Delete project "${project.name}"? All of its tasks will be deleted too.`,
    );
    if (!ok) return;
    setPendingDeleteId(project.id);
    try {
      await deleteProject(project.id, token);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setPendingDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="page-loading" role="status">
        Loading projects…
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="muted">
            {isAdmin
              ? "Create projects and assign team members."
              : "Open a board to manage tasks on the Kanban."}
          </p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            className="btn primary"
            onClick={() => setEditing({ mode: "create" })}
          >
            + New project
          </button>
        ) : null}
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      {projects.length === 0 ? (
        <p className="muted">
          {isAdmin
            ? "No projects yet. Click “New project” to create one."
            : "No projects yet. Ask an Admin to add you to a project."}
        </p>
      ) : (
        <ul className="project-list">
          {projects.map((p) => {
            const ownerEmail = usersById.get(p.ownerId)?.email ?? "(unknown)";
            const memberCount = p.memberIds.length;
            return (
              <li key={p.id} className="project-row">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="project-name">{p.name}</div>
                  {p.description ? (
                    <div className="muted small">{p.description}</div>
                  ) : null}
                  <div className="muted small" style={{ marginTop: 4 }}>
                    Owner: {ownerEmail} · Members: {memberCount}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Link className="btn small" to={`/projects/${p.id}/kanban`}>
                    Open board
                  </Link>
                  {canManage(p) ? (
                    <>
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => setEditing({ mode: "edit", project: p })}
                      >
                        Manage
                      </button>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => handleDelete(p)}
                        disabled={pendingDeleteId === p.id}
                        style={{ borderColor: "#fecaca", color: "#b91c1c" }}
                      >
                        {pendingDeleteId === p.id ? "Deleting…" : "Delete"}
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing != null ? (
        <ProjectFormModal
          state={editing}
          users={users}
          currentUserId={user?.id ?? null}
          token={token}
          onClose={() => setEditing(null)}
          onSaved={(saved, mode) => {
            setProjects((prev) =>
              mode === "create"
                ? [saved, ...prev]
                : prev.map((p) => (p.id === saved.id ? saved : p)),
            );
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

type FormProps = {
  state: Exclude<EditingState, null>;
  users: DirectoryUser[];
  currentUserId: string | null;
  token: string | null;
  onClose: () => void;
  onSaved: (project: Project, mode: "create" | "edit") => void;
};

function ProjectFormModal({ state, users, currentUserId, token, onClose, onSaved }: FormProps) {
  const initial = state.mode === "edit" ? state.project : null;
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [memberIds, setMemberIds] = useState<Set<string>>(
    () => new Set(initial?.memberIds ?? []),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerId = initial?.ownerId ?? currentUserId;
  const candidates = users.filter((u) => u.id !== ownerId);

  function toggleMember(id: string) {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setPending(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        members: Array.from(memberIds),
      };
      const saved =
        state.mode === "create"
          ? await createProject(body, token)
          : await updateProject(state.project.id, body, token);
      onSaved(saved, state.mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{state.mode === "create" ? "New project" : "Manage project"}</h2>
          <button type="button" className="btn small ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <form className="stack" onSubmit={onSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
              maxLength={200}
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={3}
            />
          </label>
          <fieldset className="field">
            <legend>Members</legend>
            {candidates.length === 0 ? (
              <p className="muted small">No other users in the directory yet.</p>
            ) : (
              <div className="member-list">
                {candidates.map((u) => (
                  <label key={u.id} className="member-row">
                    <input
                      type="checkbox"
                      checked={memberIds.has(u.id)}
                      onChange={() => toggleMember(u.id)}
                    />
                    <span>
                      {u.fullName ? `${u.fullName} (${u.email})` : u.email}
                      <span className="muted small"> · {u.role}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          {error ? <p className="error-text">{error}</p> : null}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn ghost" onClick={onClose} disabled={pending}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={pending}>
              {pending ? "Saving…" : state.mode === "create" ? "Create project" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
