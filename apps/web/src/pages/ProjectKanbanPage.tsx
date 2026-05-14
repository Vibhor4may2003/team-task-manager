import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { jsonFetch } from "../lib/api.js";
import type { Task } from "../types/domain.js";
import { KanbanBoard } from "../components/kanban/KanbanBoard.js";

export function ProjectKanbanPage() {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token || !projectId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await jsonFetch<{ tasks: Task[] }>(
          `/api/projects/${projectId}/tasks`,
          { token },
        );
        if (!cancelled) setTasks(data.tasks);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load tasks");
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

  if (loading || tasks === null) {
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
          <h1>Kanban</h1>
          <p className="muted small">Project {projectId}</p>
        </div>
        <Link className="btn ghost small" to="/projects">
          All projects
        </Link>
      </header>
      <KanbanBoard projectId={projectId} initialTasks={tasks} />
    </div>
  );
}
