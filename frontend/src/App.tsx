import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { BacklogPage } from "./pages/BacklogPage";
import { SearchPage } from "./pages/SearchPage";
import { StatsPage } from "./pages/StatsPage";

export function App() {
  const { auth, saveAuth, logout } = useAuth();

  return (
    <Routes>
      <Route element={<Layout user={auth?.user ?? null} onLogout={logout} />}>
        <Route path="/" element={<Navigate to={auth ? "/search" : "/login"} replace />} />
        <Route path="/login" element={<AuthPage mode="login" onAuthenticated={saveAuth} />} />
        <Route path="/register" element={<AuthPage mode="register" onAuthenticated={saveAuth} />} />
        <Route element={<ProtectedRoute user={auth?.user ?? null} />}>
          <Route path="/search" element={auth ? <SearchPage token={auth.token} /> : null} />
          <Route path="/backlog" element={auth ? <BacklogPage token={auth.token} /> : null} />
          <Route path="/stats" element={auth ? <StatsPage token={auth.token} /> : null} />
        </Route>
      </Route>
    </Routes>
  );
}
