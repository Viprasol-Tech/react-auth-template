"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
      <LoginForm onSuccess={() => router.push("/dashboard")} />
      <p className="mt-4 text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-brand hover:underline"
        >
          Forgot your password?
        </Link>
      </p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Need an account?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
