"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Create account</h1>
      <RegisterForm onSuccess={() => router.push("/")} />
      <p className="mt-6 text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
