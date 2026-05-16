import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { jsonFetch } from "../lib/api.js";
import type { AuthUser } from "../types/domain.js";

const TOKEN_KEY = "ttm_token";
const USER_KEY = "ttm_user";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    email: string;
    password: string;
    fullName?: string;
    adminCode?: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = readStoredUser();
    setToken(storedToken);
    setUser(storedUser);
    setIsReady(true);
  }, []);

  const persist = useCallback((nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await jsonFetch<{ token: string; user: AuthUser }>(
        "/api/auth/login",
        { method: "POST", body: { email, password } },
      );
      persist(data.token, data.user);
    },
    [persist],
  );

  const signup = useCallback(
    async (input: {
      email: string;
      password: string;
      fullName?: string;
      adminCode?: string;
    }) => {
      const data = await jsonFetch<{ token: string; user: AuthUser }>(
        "/api/auth/signup",
        { method: "POST", body: input },
      );
      persist(data.token, data.user);
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      token,
      user,
      isReady,
      login,
      signup,
      logout,
    }),
    [token, user, isReady, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
