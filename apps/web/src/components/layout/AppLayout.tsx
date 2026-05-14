import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-slate-900 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="text-base font-semibold tracking-tight text-slate-900 no-underline"
          >
            Team Task Manager
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            <NavLink to="/dashboard" className={navClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/projects" className={navClass}>
              Projects
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user?.email}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {user?.role}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
