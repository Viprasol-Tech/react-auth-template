"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h1 className="mb-6 text-2xl font-bold">Set a new password</h1>
      {token ? (
        <ResetPasswordForm
          token={token}
          onSuccess={() => setTimeout(() => router.push("/login"), 1200)}
        />
      ) : (
        <p role="alert" className="text-sm text-red-600">
          This reset link is missing its token.
        </p>
      )}
      <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
