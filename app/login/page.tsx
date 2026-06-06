"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
      <LoginForm onSuccess={() => router.push("/")} />
      <p className="mt-6 text-sm text-gray-600">
        Need an account?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
