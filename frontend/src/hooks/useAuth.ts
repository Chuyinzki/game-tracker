import { useEffect, useState } from "react";
import type { AuthResponse, User } from "../types";

const STORAGE_KEY = "game-tracker-auth";

type StoredAuth = {
  token: string;
  user: User;
};

export function useAuth() {
  const [auth, setAuth] = useState<StoredAuth | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setAuth(JSON.parse(raw) as StoredAuth);
    }
  }, []);

  function saveAuth(response: AuthResponse) {
    const nextAuth = {
      token: response.token,
      user: response.user
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }

  return {
    auth,
    saveAuth,
    logout
  };
}
