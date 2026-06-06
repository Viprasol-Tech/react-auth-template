import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "React Auth Template",
  description:
    "React/Next auth template - login/register forms, validation, session context.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-12">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
