"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { validateEmail, validatePassword } from "@/lib/validation";

export interface LoginFormProps {
  /** Called after a successful login. */
  onSuccess?: () => void;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

/**
 * Controlled login form with inline validation. Submits through `useAuth`.
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, status, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const emailResult = validateEmail(email);
    if (!emailResult.valid) next.email = emailResult.error ?? undefined;
    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) next.password = passwordResult.error ?? undefined;
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await login({ email, password });
      onSuccess?.();
    } catch {
      // Surfaced via the `error` value from the auth context.
    }
  }

  const submitting = status === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Login form"
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        {errors.email && (
          <p id="login-email-error" role="alert" className="text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="login-password"
          className="text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "login-password-error" : undefined
          }
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        {errors.password && (
          <p
            id="login-password-error"
            role="alert"
            className="text-sm text-red-600"
          >
            {errors.password}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default LoginForm;
