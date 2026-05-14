import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { jsonFetch } from "../lib/api.js";
import type { Project } from "../types/domain.js";

export function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await jsonFetch<{ projects: Project[] }>("/api/projects", {
          token,
        });
        if (!cancelled) setProjects(data.projects);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load projects");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="page-loading" role="status">
        Loading projects…
      </div>
    );
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Projects</h1>
        <p className="muted">Open a board to manage tasks on the Kanban.</p>
      </header>
      {projects.length === 0 ? (
        <p className="muted">No projects yet.</p>
      ) : (
        <ul className="project-list">
          {projects.map((p) => (
            <li key={p.id} className="project-row">
              <div>
                <div className="project-name">{p.name}</div>
                {p.description ? (
                  <div className="muted small">{p.description}</div>
                ) : null}
              </div>
              <Link className="btn small" to={`/projects/${p.id}/kanban`}>
                Open board
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
