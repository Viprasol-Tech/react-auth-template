"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="w-full max-w-md text-center">
      <h1 className="text-3xl font-bold">React Auth Template</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Auth flows you actually need: login, registration, password reset, email
        verification, OAuth, protected routes, and session refresh logic.
      </p>

      {user ? (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
          <p className="text-lg font-semibold">{user.name ?? user.email}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Go to dashboard
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Create account
          </Link>
        </div>
      )}
    </div>
  );
}
