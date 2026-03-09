import { Link, NavLink, Outlet } from "react-router-dom";
import type { User } from "../types";

type LayoutProps = {
  user: User | null;
  onLogout: () => void;
};

export function Layout({ user, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen px-4 py-6 text-ink sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link to="/search" className="font-display text-3xl font-semibold tracking-tight">
                Backlog Atlas
              </Link>
              <p className="mt-1 text-sm text-slate-600">
                Track what you want to play, what you finished, and how your taste evolves.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <NavLink to="/search" className="rounded-full bg-ink px-4 py-2 text-white">
                Search
              </NavLink>
              <NavLink to="/backlog" className="rounded-full border border-slate-300 px-4 py-2">
                Backlog
              </NavLink>
              <NavLink to="/stats" className="rounded-full border border-slate-300 px-4 py-2">
                Stats
              </NavLink>
              {user ? (
                <>
                  <span className="rounded-full bg-pine/10 px-4 py-2 text-pine">{user.email}</span>
                  <button onClick={onLogout} className="rounded-full border border-slate-300 px-4 py-2">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="rounded-full border border-slate-300 px-4 py-2">
                    Login
                  </NavLink>
                  <NavLink to="/register" className="rounded-full bg-accent px-4 py-2 text-white">
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
