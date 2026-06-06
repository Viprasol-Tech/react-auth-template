"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";

function DashboardContent() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        This page is wrapped in <code>&lt;ProtectedRoute&gt;</code> and is only
        reachable while signed in.
      </p>

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Name</dt>
          <dd className="font-medium">{user.name ?? "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Email</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Email verified</dt>
          <dd className="font-medium">
            {user.emailVerified ? "Yes" : "No"}
          </dd>
        </div>
      </dl>

      {!user.emailVerified && (
        <Link
          href="/verify-email"
          className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
        >
          Verify your email
        </Link>
      )}

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-6 w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Sign out
      </button>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute
      fallback={<p className="text-sm text-gray-500">Redirecting to sign in...</p>}
    >
      <DashboardContent />
    </ProtectedRoute>
  );
}
