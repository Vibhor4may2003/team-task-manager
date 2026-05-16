import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { jsonFetch } from "../lib/api.js";
import { getProject, listUsers, type DirectoryUser } from "../lib/projectsApi.js";
import type { Project, Task } from "../types/domain.js";
import { KanbanBoard } from "../components/kanban/KanbanBoard.js";

type LoadedState = {
  project: Project;
  users: DirectoryUser[];
  tasks: Task[];
};

export function ProjectKanbanPage() {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [state, setState] = useState<LoadedState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token || !projectId) return;
      setLoading(true);
      setError(null);
      try {
        const [project, users, tasksRes] = await Promise.all([
          getProject(projectId, token),
          listUsers(token),
          jsonFetch<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`, { token }),
        ]);
        if (!cancelled) {
          setState({ project, users, tasks: tasksRes.tasks });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load board");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token, projectId]);

  if (!projectId) {
    return <p className="error-text">Missing project id.</p>;
  }

  if (loading || state === null) {
    return (
      <div className="page-loading" role="status">
        Loading board…
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <p className="error-text">{error}</p>
        <Link to="/projects">Back to projects</Link>
      </div>
    );
  }

  return (
    <div className="page kanban-page">
      <header className="page-header kanban-page-header">
        <div>
          <h1>{state.project.name}</h1>
          {state.project.description ? (
            <p className="muted small" style={{ margin: 0 }}>
              {state.project.description}
            </p>
          ) : null}
        </div>
        <Link className="btn ghost small" to="/projects">
          All projects
        </Link>
      </header>
      <KanbanBoard
        project={state.project}
        users={state.users}
        initialTasks={state.tasks}
      />
    </div>
  );
}
