"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export interface ProtectedRouteProps {
  children: ReactNode;
  /** Where to send unauthenticated users. Defaults to "/login". */
  redirectTo?: string;
  /** When true, also require a verified email. */
  requireVerified?: boolean;
  /** Rendered while redirecting / when access is denied. */
  fallback?: ReactNode;
}

/**
 * Client-side route guard. Renders children only for an authenticated user
 * (and, optionally, a verified one); otherwise it redirects and shows a
 * fallback. Pair with server-side checks for defense in depth.
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
  requireVerified = false,
  fallback = null,
}: ProtectedRouteProps) {
  const { user } = useAuth();
  const router = useRouter();

  const allowed = user !== null && (!requireVerified || user.emailVerified === true);

  useEffect(() => {
    if (user === null) {
      router.replace(redirectTo);
    } else if (requireVerified && user.emailVerified !== true) {
      router.replace("/verify-email");
    }
  }, [user, requireVerified, redirectTo, router]);

  if (!allowed) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

export default ProtectedRoute;
