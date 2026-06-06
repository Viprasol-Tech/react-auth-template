<div align="center">
  <img src="docs/assets/logo.png" alt="Viprasol Tech" width="120" />

  <h1>React Auth Template</h1>

  <p>A production-ready React/Next.js authentication starter: login and register forms with validation, plus a pluggable session context.</p>

  <p><em>Built and maintained by Viprasol Tech</em></p>

  <p>
    <a href="https://github.com/Viprasol-Tech/react-auth-template/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
    <a href="https://github.com/Viprasol-Tech/react-auth-template"><img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js 14" /></a>
    <a href="https://github.com/Viprasol-Tech/react-auth-template"><img src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white" alt="TypeScript strict" /></a>
  </p>
</div>

---

## Features

- **Drop-in auth context** — `AuthProvider` + `useAuth()` expose `user`, `status`, `error`, and `login` / `register` / `logout` actions.
- **Pluggable backend** — implement the small `AuthClient` interface (REST, Supabase, Firebase, NextAuth, etc.). A dependency-free in-memory client is bundled so the template runs out of the box.
- **Battle-tested validation** — pure `lib/validation.ts` helpers for email, password policy, password confirmation, and a live strength meter. No React or DOM dependency, so they run anywhere.
- **Accessible forms** — `LoginForm` and `RegisterForm` ship with labeled inputs, `aria-invalid`, `role="alert"` errors, and inline validation.
- **App Router pages** — `/login`, `/register`, and a session-aware home page.
- **Tailwind CSS** — preconfigured with a small brand palette.
- **Fully typed & tested** — TypeScript strict mode, `tsc --noEmit` clean, and a Vitest suite (logic + component render tests).

## Quickstart

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Visit `/register` to create an account (the demo client accepts any valid input), then `/login`.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Run the Vitest suite |

## What's included

```
app/
  layout.tsx          # Wraps the tree in <AuthProvider>
  page.tsx            # Session-aware home page
  login/page.tsx      # /login route
  register/page.tsx   # /register route
components/
  LoginForm.tsx       # Validated, accessible login form
  RegisterForm.tsx    # Register form with password strength meter
lib/
  auth.ts             # AuthProvider, useAuth, AuthClient, fake client
  validation.ts       # Pure email/password validators (tested)
tests/
  validation.test.ts  # Validator rules
  auth.test.tsx       # useAuth login/logout/register via renderHook
  LoginForm.test.tsx  # Component render + validation + submit
```

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
};

// app/layout.tsx
<AuthProvider client={myClient}>{children}</AuthProvider>;
```

## Contributing

Contributions are welcome. Please open an issue to discuss substantial changes first, keep `npm run typecheck` and `npm run test` green, and follow the existing code style. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Contact — Viprasol Tech Private Limited

- Website: [viprasol.com](https://viprasol.com)
- Email: [support@viprasol.com](mailto:support@viprasol.com)
- Telegram: [t.me/viprasol_help](https://t.me/viprasol_help) | WhatsApp: +91 96336 52112
- GitHub: [@Viprasol-Tech](https://github.com/Viprasol-Tech) | [LinkedIn](https://www.linkedin.com/in/viprasol/) | X [@viprasol](https://twitter.com/viprasol)

## License

[MIT](LICENSE) (c) 2025 Viprasol Tech Private Limited
