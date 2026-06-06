import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "React Auth Template",
  description:
    "React/Next auth template - login/register, password reset, email verification, OAuth, protected routes, and session logic.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-sm font-semibold">
                React Auth Template
              </Link>
              <ThemeToggle />
            </header>
            <main className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center px-4 py-12">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
