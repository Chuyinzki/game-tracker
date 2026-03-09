import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { User } from "../types";

type ProtectedRouteProps = {
  user: User | null;
};

export function ProtectedRoute({ user }: ProtectedRouteProps) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
