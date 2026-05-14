import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

export function ProtectedRoute() {
  const { token, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 text-sm text-slate-500"
        role="status"
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
        Loading session…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
