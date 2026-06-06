"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Authenticated user as exposed to the UI. */
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  name?: string;
}

/**
 * Pluggable backend contract. Swap the default in-memory client for a real
 * implementation (REST, Supabase, Firebase, NextAuth, etc.) by passing your
 * own `client` to {@link AuthProvider}.
 */
export interface AuthClient {
  login(credentials: Credentials): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  logout(): Promise<void>;
}

interface AuthContextValue {
  user: User | null;
  status: "idle" | "loading" | "error";
  error: string | null;
  login: (credentials: Credentials) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function deriveId(email: string): string {
  return `user_${email.trim().toLowerCase()}`;
}

/**
 * A default, dependency-free auth client backed by an in-memory map. It accepts
 * any well-formed credentials so the template runs out of the box; replace it
 * before shipping to production.
 */
export function createFakeAuthClient(): AuthClient {
  const accounts = new Map<string, { password: string; user: User }>();

  return {
    async login({ email, password }) {
      const key = email.trim().toLowerCase();
      const existing = accounts.get(key);
      if (existing) {
        if (existing.password !== password) {
          throw new Error("Invalid email or password.");
        }
        return existing.user;
      }
      // Unknown accounts are accepted by the demo client for convenience.
      if (!email || !password) {
        throw new Error("Invalid email or password.");
      }
      const user: User = { id: deriveId(email), email: key };
      accounts.set(key, { password, user });
      return user;
    },
    async register({ email, password, name }) {
      const key = email.trim().toLowerCase();
      if (accounts.has(key)) {
        throw new Error("An account with this email already exists.");
      }
      const user: User = { id: deriveId(email), email: key, name };
      accounts.set(key, { password, user });
      return user;
    },
    async logout() {
      // No server session to clear for the in-memory client.
    },
  };
}

export interface AuthProviderProps {
  children: ReactNode;
  /** Override the backend. Defaults to {@link createFakeAuthClient}. */
  client?: AuthClient;
  /** Seed an already-authenticated user (e.g. from SSR). */
  initialUser?: User | null;
}

/**
 * Provides auth state and actions to descendants via React context.
 */
export function AuthProvider({
  children,
  client,
  initialUser = null,
}: AuthProviderProps) {
  const authClient = useMemo(() => client ?? createFakeAuthClient(), [client]);
  const [user, setUser] = useState<User | null>(initialUser);
  const [status, setStatus] = useState<AuthContextValue["status"]>("idle");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      setStatus("loading");
      setError(null);
      try {
        const result = await action();
        setStatus("idle");
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setStatus("error");
        setError(message);
        throw err;
      }
    },
    [],
  );

  const login = useCallback(
    (credentials: Credentials) =>
      run(async () => {
        const next = await authClient.login(credentials);
        setUser(next);
        return next;
      }),
    [authClient, run],
  );

  const register = useCallback(
    (input: RegisterInput) =>
      run(async () => {
        const next = await authClient.register(input);
        setUser(next);
        return next;
      }),
    [authClient, run],
  );

  const logout = useCallback(
    () =>
      run(async () => {
        await authClient.logout();
        setUser(null);
      }),
    [authClient, run],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, error, login, register, logout }),
    [user, status, error, login, register, logout],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

/**
 * Access auth state and actions. Must be used inside an {@link AuthProvider}.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return ctx;
}
