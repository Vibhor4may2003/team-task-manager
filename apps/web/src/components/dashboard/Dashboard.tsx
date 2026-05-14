import { Link } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { fetchAccessibleTasks } from "../../lib/dashboardData.js";
import type { Task } from "../../types/domain.js";
import {
  STATUS_ORDER,
  computeDashboardMetrics,
  type StatusCounts,
} from "./dashboardMetrics.js";

const STATUS_LABEL: Record<keyof StatusCounts, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
};

const STATUS_BAR_CLASS: Record<keyof StatusCounts, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-amber-500",
  COMPLETED: "bg-emerald-500",
};

function StatusBreakdownBar({
  total,
  byStatus,
}: {
  total: number;
  byStatus: StatusCounts;
}) {
  if (total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
        No tasks yet. Create tasks on a project board to see distribution here.
      </div>
    );
  }

  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
      {STATUS_ORDER.map((status) => {
        const count = byStatus[status];
        const pct = (count / total) * 100;
        if (pct <= 0) return null;
        return (
          <div
            key={status}
            className={`${STATUS_BAR_CLASS[status]} h-full shrink-0`}
            style={{ width: `${pct}%` }}
            title={`${STATUS_LABEL[status]}: ${count}`}
          />
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  children,
  footnote,
}: {
  label: string;
  children: ReactNode;
  footnote?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-3">{children}</div>
      {footnote ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{footnote}</p>
      ) : null}
    </div>
  );
}

export function Dashboard() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const all = await fetchAccessibleTasks(token);
        if (!cancelled) setTasks(all);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard data",
          );
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

  const metrics = useMemo(() => computeDashboardMetrics(tasks), [tasks]);

  if (loading) {
    return (
      <div
        className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-slate-500"
        role="status"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
        <p className="mt-4 text-sm font-medium">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  const { total, byStatus, completionRate, overdueCount, overdueTasks } = metrics;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Overview
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Live metrics from every project you can access. Overdue items exclude
          completed work and compare due dates to today in your local timezone.
        </p>
      </header>

      <section
        className="mt-8 grid gap-4 sm:grid-cols-3"
        aria-label="Key metrics"
      >
        <MetricCard
          label="Total tasks"
          footnote="All non-archived tasks across visible projects."
        >
          <p className="text-4xl font-semibold tabular-nums tracking-tight text-slate-900">
            {total}
          </p>
        </MetricCard>

        <MetricCard
          label="Completion rate"
          footnote="Share of tasks marked completed."
        >
          <div className="flex items-end gap-3">
            <p className="text-4xl font-semibold tabular-nums tracking-tight text-slate-900">
              {completionRate}
              <span className="text-2xl font-medium text-slate-400">%</span>
            </p>
            <p className="pb-1 text-sm text-slate-500">
              {byStatus.COMPLETED} of {total} done
            </p>
          </div>
        </MetricCard>

        <MetricCard
          label="Overdue (active)"
          footnote="Due before today, excluding completed tasks."
        >
          <p
            className={`text-4xl font-semibold tabular-nums tracking-tight ${overdueCount > 0 ? "text-amber-700" : "text-slate-900"}`}
          >
            {overdueCount}
          </p>
        </MetricCard>
      </section>

      <section
        className="mt-10 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5"
        aria-labelledby="status-heading"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="status-heading"
              className="text-base font-semibold text-slate-900"
            >
              Tasks by status
            </h2>
            <p className="text-sm text-slate-600">
              Pipeline distribution and completion context.
            </p>
          </div>
          <p className="text-sm font-medium text-slate-700">
            Completion:{" "}
            <span className="tabular-nums text-slate-900">{completionRate}%</span>
          </p>
        </div>

        <div className="mt-6">
          <StatusBreakdownBar total={total} byStatus={byStatus} />
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <div
              key={status}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_BAR_CLASS[status]}`}
                />
                <dt className="text-sm font-medium text-slate-700">
                  {STATUS_LABEL[status]}
                </dt>
              </div>
              <dd className="text-sm font-semibold tabular-nums text-slate-900">
                {byStatus[status]}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        className="mt-10 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5"
        aria-labelledby="overdue-heading"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="overdue-heading"
              className="text-base font-semibold text-slate-900"
            >
              Overdue tasks
            </h2>
            <p className="text-sm text-slate-600">
              Active tasks with a due date strictly before today.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {overdueCount} open
          </span>
        </div>

        {overdueTasks.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
            No overdue tasks. Great job staying on schedule.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4">Task</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Due</th>
                  <th className="py-3">Board</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueTasks.map((task) => (
                  <tr key={task.id} className="text-slate-800">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {task.title}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {task.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-slate-600">
                      {new Date(task.dueDate).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3">
                      <Link
                        to={`/projects/${task.projectId}/kanban`}
                        className="font-medium text-blue-700 hover:text-blue-800"
                      >
                        Open board
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
