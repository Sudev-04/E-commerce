"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@/types";
import { fetchSession, logoutUser, clearLegacyStorage } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Call after a successful login/register with the returned user. */
  setUser: (user: User | null) => void;
  /** Re-read the session from the server (httpOnly cookies). */
  reload: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
  reload: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const u = await fetchSession();
    setUserState(u);
    setIsLoading(false);
    return u;
  }, []);

  useEffect(() => {
    clearLegacyStorage();
    reload();
  }, [reload]);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUserState(null);
    // Full navigation resets every client cache tied to the old session
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: Boolean(user), setUser, reload, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
