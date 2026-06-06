"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { validateEmail } from "@/lib/validation";

export interface ForgotPasswordFormProps {
  /** Called with the issued token after a successful request. */
  onSent?: (token: string) => void;
}

/**
 * Requests a password-reset link. The demo client returns the token directly
 * (a real backend would email it); the token is shown so the flow is testable
 * end-to-end without a mail server.
 */
export function ForgotPasswordForm({ onSent }: ForgotPasswordFormProps) {
  const { requestPasswordReset, status, error } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [token, setToken] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateEmail(email);
    if (!result.valid) {
      setEmailError(result.error ?? undefined);
      return;
    }
    setEmailError(undefined);
    try {
      const { token: issued } = await requestPasswordReset(email);
      setToken(issued);
      onSent?.(issued);
    } catch {
      // Surfaced via context error.
    }
  }

  const submitting = status === "loading";

  if (token) {
    return (
      <div role="status" className="text-sm text-gray-700 dark:text-gray-200">
        <p>
          If an account exists for <strong>{email}</strong>, a reset link has been
          sent.
        </p>
        <p className="mt-2 break-all text-xs text-gray-500 dark:text-gray-400">
          Demo token: <code data-testid="reset-token">{token}</code>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Forgot password form"
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="forgot-email"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "forgot-email-error" : undefined}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        {emailError && (
          <p id="forgot-email-error" role="alert" className="text-sm text-red-600">
            {emailError}
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
        {submitting ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}

export default ForgotPasswordForm;
