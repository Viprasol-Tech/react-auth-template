"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

type Status = "idle" | "verifying" | "success" | "error";

function VerifyEmailInner() {
  const { verifyEmail, requestEmailVerification, user } = useAuth();
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resentToken, setResentToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setStatus("verifying");
    verifyEmail(token)
      .then(() => active && setStatus("success"))
      .catch((err: unknown) => {
        if (!active) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      });
    return () => {
      active = false;
    };
  }, [token, verifyEmail]);

  async function resend() {
    if (!user) return;
    const { token: issued } = await requestEmailVerification(user.email);
    setResentToken(issued);
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h1 className="mb-4 text-2xl font-bold">Verify your email</h1>

      {!token && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Check your inbox for a verification link.
        </p>
      )}
      {status === "verifying" && (
        <p role="status" className="text-sm text-gray-600 dark:text-gray-400">
          Verifying...
        </p>
      )}
      {status === "success" && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          Your email is verified. Thank you!
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}

      {user && (
        <button
          type="button"
          onClick={() => void resend()}
          className="mt-6 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Resend verification email
        </button>
      )}
      {resentToken && (
        <p className="mt-2 break-all text-xs text-gray-500 dark:text-gray-400">
          Demo token: <code>{resentToken}</code>
        </p>
      )}

      <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <Link href="/" className="font-medium text-brand hover:underline">
          Back home
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
