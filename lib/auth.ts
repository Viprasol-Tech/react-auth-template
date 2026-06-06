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
import {
  consumeToken,
  createMemoryTokenStore,
  issueToken,
  TOKEN_ERROR_MESSAGES,
  type TokenStore,
} from "./tokens";

/** Authenticated user as exposed to the UI. */
export interface User {
  id: string;
  email: string;
  name?: string;
  /** Whether the user has confirmed their email address. */
  emailVerified?: boolean;
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
  /** Issue a password-reset token and return it (a real backend emails it). */
  requestPasswordReset(email: string): Promise<{ token: string }>;
  /** Complete a password reset using a previously-issued token. */
  resetPassword(token: string, newPassword: string): Promise<User>;
  /** Issue an email-verification token (a real backend emails the link). */
  requestEmailVerification(email: string): Promise<{ token: string }>;
  /** Mark an account verified using a token. */
  verifyEmail(token: string): Promise<User>;
}

interface AuthContextValue {
  user: User | null;
  status: "idle" | "loading" | "error";
  error: string | null;
  /** True while any auth action is in flight. */
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ token: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<User>;
  requestEmailVerification: (email: string) => Promise<{ token: string }>;
  verifyEmail: (token: string) => Promise<User>;
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
export function createFakeAuthClient(tokenStore?: TokenStore): AuthClient {
  const accounts = new Map<string, { password: string; user: User }>();
  const tokens = tokenStore ?? createMemoryTokenStore();

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
      const user: User = {
        id: deriveId(email),
        email: key,
        name,
        emailVerified: false,
      };
      accounts.set(key, { password, user });
      return user;
    },
    async logout() {
      // No server session to clear for the in-memory client.
    },
    async requestPasswordReset(email) {
      const key = email.trim().toLowerCase();
      // Always issue a token even for unknown accounts to avoid leaking which
      // emails are registered (enumeration protection). A real backend would
      // simply send no email for unknown addresses.
      const record = issueToken(tokens, key, "password-reset");
      return { token: record.token };
    },
    async resetPassword(token, newPassword) {
      const result = consumeToken(tokens, token, "password-reset");
      if (!result.ok) {
        throw new Error(TOKEN_ERROR_MESSAGES[result.reason]);
      }
      const key = result.record.subject;
      const existing = accounts.get(key);
      if (!existing) {
        throw new Error("No account is associated with this link.");
      }
      existing.password = newPassword;
      return existing.user;
    },
    async requestEmailVerification(email) {
      const key = email.trim().toLowerCase();
      const record = issueToken(tokens, key, "email-verification");
      return { token: record.token };
    },
    async verifyEmail(token) {
      const result = consumeToken(tokens, token, "email-verification");
      if (!result.ok) {
        throw new Error(TOKEN_ERROR_MESSAGES[result.reason]);
      }
      const key = result.record.subject;
      const existing = accounts.get(key);
      if (!existing) {
        throw new Error("No account is associated with this link.");
      }
      existing.user = { ...existing.user, emailVerified: true };
      return existing.user;
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

  const requestPasswordReset = useCallback(
    (email: string) => run(() => authClient.requestPasswordReset(email)),
    [authClient, run],
  );

  const resetPassword = useCallback(
    (token: string, newPassword: string) =>
      run(() => authClient.resetPassword(token, newPassword)),
    [authClient, run],
  );

  const requestEmailVerification = useCallback(
    (email: string) => run(() => authClient.requestEmailVerification(email)),
    [authClient, run],
  );

  const verifyEmail = useCallback(
    (token: string) =>
      run(async () => {
        const next = await authClient.verifyEmail(token);
        setUser((current) =>
          current && current.email === next.email ? next : current,
        );
        return next;
      }),
    [authClient, run],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      error,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      requestPasswordReset,
      resetPassword,
      requestEmailVerification,
      verifyEmail,
    }),
    [
      user,
      status,
      error,
      login,
      register,
      logout,
      requestPasswordReset,
      resetPassword,
      requestEmailVerification,
      verifyEmail,
    ],
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
