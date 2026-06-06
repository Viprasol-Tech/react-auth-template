<div align="center">
  <img src="docs/assets/logo.png" alt="Viprasol Tech" width="120" />

  <h1>React Auth Template</h1>

  <p>A production-ready React/Next.js authentication starter — login, registration, password reset, email verification, an OAuth provider abstraction, protected routes, and session-refresh logic. Strict-typed, fully tested, and dark-mode ready.</p>

  <p><em>Built and maintained by Viprasol Tech</em></p>

  <p>
    <a href="https://github.com/Viprasol-Tech/react-auth-template/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
    <a href="https://github.com/Viprasol-Tech/react-auth-template"><img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js 14" /></a>
    <a href="https://github.com/Viprasol-Tech/react-auth-template"><img src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white" alt="TypeScript strict" /></a>
    <a href="https://github.com/Viprasol-Tech/react-auth-template"><img src="https://img.shields.io/badge/tests-104%20passing-brightgreen?logo=vitest" alt="104 tests passing" /></a>
    <a href="https://github.com/Viprasol-Tech/react-auth-template"><img src="https://img.shields.io/badge/version-0.2.0-blue.svg" alt="Version 0.2.0" /></a>
  </p>
</div>

---

## ✨ Features

- 🔐 **Drop-in auth context** — `AuthProvider` + `useAuth()` expose `user`, `status`, `error`, `isAuthenticated`, and `login` / `register` / `logout` actions.
- 🔌 **Pluggable backend** — implement the small `AuthClient` interface (REST, Supabase, Firebase, NextAuth, etc.). A dependency-free in-memory client is bundled so the template runs out of the box.
- 🔁 **Password-reset flow** — single-use, time-limited reset tokens (`lib/tokens.ts`) with `ForgotPasswordForm` / `ResetPasswordForm` and ready-made pages.
- 📧 **Email verification** — verification tokens, an `emailVerified` flag, a `/verify-email` page, and resend support.
- 🌐 **OAuth provider abstraction** — `OAuthRegistry`, presets for Google & GitHub, an authorization-URL builder with anti-CSRF `state`, and callback verification — all transport-free.
- 🛡️ **Protected routes** — `<ProtectedRoute>` guard with optional email-verification requirement, plus a guarded `/dashboard`.
- ⏱️ **Session lifecycle** — sliding-window refresh, access-token expiry, and absolute-lifetime enforcement in `lib/session.ts`.
- 💪 **Strong password meter** — entropy estimate, common-password blocklist, repeated/sequential pattern detection, and actionable suggestions.
- 🌗 **Dark mode** — `ThemeProvider` / `useTheme` / `ThemeToggle` with class-based Tailwind dark mode and OS-preference detection.
- ♿ **Accessible forms** — labeled inputs, `aria-invalid`, `role="alert"` errors, and inline validation throughout.
- ✅ **Fully typed & tested** — TypeScript strict mode, `tsc --noEmit` clean, and a 104-test Vitest suite (logic + jsdom component render tests).

## 🚀 Quickstart

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Visit `/register` to create an account (the demo client accepts any valid input), then explore `/login`, `/forgot-password`, `/verify-email`, and the protected `/dashboard`.

> The bundled demo client returns reset/verification tokens directly (a real backend would email them), so every flow is testable end-to-end with no mail server.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Run the Vitest suite |

## 📦 What's included

```
app/
  layout.tsx               # AuthProvider + ThemeProvider + header/toggle
  page.tsx                 # Session-aware home page
  login/page.tsx           # /login
  register/page.tsx        # /register
  forgot-password/page.tsx # request a reset link
  reset-password/page.tsx  # set a new password from a token
  verify-email/page.tsx    # consume an email-verification token
  dashboard/page.tsx       # ProtectedRoute-guarded page
components/
  LoginForm.tsx            # Validated, accessible login form
  RegisterForm.tsx         # Register form with strength meter
  ForgotPasswordForm.tsx   # Request a password-reset token
  ResetPasswordForm.tsx    # Set a new password
  PasswordStrengthMeter.tsx# Entropy-aware strength bar + suggestions
  ProtectedRoute.tsx       # Client-side auth/verification guard
  OAuthButtons.tsx         # Renders provider sign-in buttons
  ThemeToggle.tsx          # Light/dark toggle
lib/
  auth.ts                  # AuthProvider, useAuth, AuthClient, fake client
  validation.ts            # Pure validators + detailed strength meter
  tokens.ts                # Single-use, expiring reset/verification tokens
  oauth.ts                 # Provider-agnostic OAuth 2.0 helpers
  session.ts               # Session expiry / refresh decisions
  theme.tsx                # ThemeProvider + useTheme
tests/                     # 104 tests across logic + components
```

## 🧩 Usage

### Wiring your own backend

Implement the `AuthClient` interface and pass it to the provider:

```tsx
import { AuthProvider, type AuthClient } from "@/lib/auth";

const myClient: AuthClient = {
  async login({ email, password }) {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid email or password.");
    return res.json();
  },
  async register(input) {
    /* ... */
  },
  async logout() {
    /* ... */
  },
  async requestPasswordReset(email) {
    /* POST /api/auth/forgot → { token } */
  },
  async resetPassword(token, newPassword) {
    /* POST /api/auth/reset */
  },
  async requestEmailVerification(email) {
    /* POST /api/auth/verify/request → { token } */
  },
  async verifyEmail(token) {
    /* POST /api/auth/verify */
  },
};

// app/layout.tsx
<AuthProvider client={myClient}>{children}</AuthProvider>;
```

### OAuth in three lines

```ts
import { OAuthRegistry, presetProvider, buildAuthorizationRequest } from "@/lib/oauth";

const registry = new OAuthRegistry([
  presetProvider("google", process.env.GOOGLE_CLIENT_ID!),
  presetProvider("github", process.env.GITHUB_CLIENT_ID!),
]);

const { url, state } = buildAuthorizationRequest(registry.get("google"), {
  redirectUri: "https://app.example.com/auth/callback",
});
// persist `state`, redirect to `url`, then verifyCallback(callbackUrl, state)
```

### Guarding a page

```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute requireVerified fallback={<p>Redirecting…</p>}>
      <SecretContent />
    </ProtectedRoute>
  );
}
```

### Session refresh

```ts
import { shouldRefresh, refreshSession } from "@/lib/session";

if (shouldRefresh(session)) {
  const { accessToken } = await api.refresh(session.refreshToken);
  session = refreshSession(session, { accessToken }); // throws past absolute lifetime
}
```

## 🗺️ Roadmap

- [x] Password-reset & email-verification token flows
- [x] OAuth provider abstraction with anti-CSRF state
- [x] Protected-route guard + session refresh/expiry logic
- [x] Entropy-aware password-strength meter
- [x] Dark mode with OS-preference detection
- [ ] PKCE support for public OAuth clients
- [ ] WebAuthn / passkey example
- [ ] Server Actions + cookie-session reference adapter

## ❓ FAQ

**Is this production-ready as-is?**
The validation, token, OAuth, and session logic are production-grade and unit-tested. The bundled `createFakeAuthClient` is for local development — swap in your own `AuthClient` before shipping.

**Why does the reset/verify UI show the token on screen?**
Only the demo client does this, because there's no mail server in the template. A real backend returns nothing to the browser and emails the link instead.

**Does it support dark mode out of the box?**
Yes. `ThemeProvider` reads the saved preference (or the OS setting) and toggles a `dark` class that Tailwind's class-based dark mode keys off.

**Where are the tests?**
In `tests/` — 104 of them, covering the pure logic in `lib/` and component render behaviour under jsdom.

## 🤝 Contributing

Contributions are welcome. Please open an issue to discuss substantial changes first, keep `npm run typecheck` and `npm run test` green, and follow the existing code style. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Contact — Viprasol Tech Private Limited

- Website: [viprasol.com](https://viprasol.com)
- Email: [support@viprasol.com](mailto:support@viprasol.com)
- Telegram: [t.me/viprasol_help](https://t.me/viprasol_help) | WhatsApp: +91 96336 52112
- GitHub: [@Viprasol-Tech](https://github.com/Viprasol-Tech) | [LinkedIn](https://www.linkedin.com/in/viprasol/) | X [@viprasol](https://twitter.com/viprasol)

## License

[MIT](LICENSE) (c) 2025 Viprasol Tech Private Limited
