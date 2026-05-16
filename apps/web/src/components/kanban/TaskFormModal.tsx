import { type FormEvent, useMemo, useState } from "react";
import type { DirectoryUser } from "../../lib/projectsApi.js";
import { createTask, deleteTask, updateTask } from "../../lib/tasksApi.js";
import type { Project, Task, TaskStatus } from "../../types/domain.js";
import { COLUMN_STATUSES, COLUMN_TITLES } from "./kanbanModel.js";

type Props = {
  mode: "create" | "edit";
  project: Project;
  task: Task | null;
  users: DirectoryUser[];
  token: string | null;
  currentUserId: string | null;
  currentUserRole: string | null;
  onClose: () => void;
  onCreated: (task: Task) => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
};

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export function TaskFormModal({
  mode,
  project,
  task,
  users,
  token,
  currentUserId,
  currentUserRole,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(task?.dueDate));
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamUsers = useMemo(() => {
    const allowed = new Set<string>([project.ownerId, ...project.memberIds]);
    return users.filter((u) => allowed.has(u.id));
  }, [project.memberIds, project.ownerId, users]);

  const canDelete =
    mode === "edit" &&
    (currentUserRole === "Admin" ||
      (currentUserId != null && project.ownerId === currentUserId));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Not authenticated.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      if (mode === "create") {
        const created = await createTask(
          project.id,
          {
            title: title.trim(),
            description: description.trim(),
            dueDate: new Date(dueDate).toISOString(),
            status,
            assignee: assigneeId ? assigneeId : null,
          },
          token,
        );
        onCreated(created);
      } else if (task) {
        const updated = await updateTask(
          task.id,
          {
            title: title.trim(),
            description: description.trim(),
            dueDate: new Date(dueDate).toISOString(),
            status,
            assignee: assigneeId ? assigneeId : null,
          },
          token,
        );
        onUpdated(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!task || !token) return;
    const ok = window.confirm(`Delete task "${task.title}"?`);
    if (!ok) return;
    setError(null);
    setPending(true);
    try {
      await deleteTask(task.id, token);
      onDeleted(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
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
          <h2>{mode === "create" ? "New task" : "Edit task"}</h2>
          <button type="button" className="btn small ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <form className="stack" onSubmit={onSubmit}>
          <label className="field">
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={1}
              maxLength={300}
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={10000}
              rows={3}
            />
          </label>
          <label className="field">
            <span>Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {COLUMN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {COLUMN_TITLES[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Assignee</span>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {teamUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName ? `${u.fullName} (${u.email})` : u.email}
                  {u.id === project.ownerId ? " — owner" : ""}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <div>
              {canDelete ? (
                <button
                  type="button"
                  className="btn"
                  onClick={onDelete}
                  disabled={pending}
                  style={{ borderColor: "#fecaca", color: "#b91c1c" }}
                >
                  Delete
                </button>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn ghost"
                onClick={onClose}
                disabled={pending}
              >
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={pending}>
                {pending ? "Saving…" : mode === "create" ? "Create task" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
