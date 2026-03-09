import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { AuthResponse } from "../types";

type AuthPageProps = {
  mode: "login" | "register";
  onAuthenticated: (response: AuthResponse) => void;
};

export function AuthPage({ mode, onAuthenticated }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = mode === "login"
        ? await api.login(email, password)
        : await api.register(email, password);

      onAuthenticated(response);
      navigate(location.state?.from ?? "/search");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = mode === "login" ? "Welcome back" : "Create your account";

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[2rem] bg-ink p-8 text-white shadow-[0_24px_80px_rgba(16,24,40,0.18)]">
        <p className="text-sm uppercase tracking-[0.2em] text-white/60">Game backlog manager</p>
        <h1 className="mt-4 font-display text-5xl leading-tight">{title}</h1>
        <p className="mt-4 max-w-lg text-white/70">
          Search the RAWG catalog, build your personal queue, and keep lightweight stats on what you actually finish.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_24px_80px_rgba(16,24,40,0.08)] backdrop-blur">
        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-semibold">Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-semibold">Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
        </label>
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        <button disabled={isSubmitting} className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-white">
          {isSubmitting ? "Submitting..." : mode === "login" ? "Log in" : "Create account"}
        </button>
        <p className="mt-4 text-sm text-slate-600">
          {mode === "login" ? "Need an account?" : "Already registered?"}{" "}
          <Link to={mode === "login" ? "/register" : "/login"} className="font-semibold text-pine">
            {mode === "login" ? "Register" : "Log in"}
          </Link>
        </p>
      </form>
    </section>
  );
}
