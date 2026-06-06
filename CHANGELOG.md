# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/); versioning
follows [SemVer](https://semver.org/).

## [0.2.0] - 2025

### Added
- **Password-reset flow** — single-use, time-limited reset tokens (`lib/tokens.ts`),
  `ForgotPasswordForm` / `ResetPasswordForm` components, and `/forgot-password`
  + `/reset-password` pages.
- **Email-verification flow** — verification tokens, `verifyEmail` /
  `requestEmailVerification` auth actions, a `/verify-email` page, and an
  `emailVerified` flag on `User`.
- **OAuth provider abstraction** (`lib/oauth.ts`) — `OAuthRegistry`, well-known
  presets (Google, GitHub), authorization-URL builder with anti-CSRF `state`,
  and callback parsing/verification, plus an `OAuthButtons` component.
- **Protected-route guard** — `<ProtectedRoute>` with optional
  `requireVerified`, and a guarded `/dashboard` page.
- **Session lifecycle logic** (`lib/session.ts`) — sliding-window refresh,
  access-token expiry, and absolute-lifetime enforcement.
- **Stronger password meter** — entropy estimate, common-password blocklist,
  repeated/sequential pattern detection, and actionable suggestions
  (`passwordStrengthDetailed`), surfaced by a new `PasswordStrengthMeter`.
- **Dark mode** — `ThemeProvider` / `useTheme` / `ThemeToggle` with class-based
  Tailwind dark mode and OS-preference detection.

### Changed
- `AuthClient` extended with reset/verification methods; `useAuth` now exposes
  `isAuthenticated` and the new flows.

### Tests
- More than doubled the suite (23 → 104) covering tokens, OAuth, session,
  detailed strength, the new flows, and component render tests.

## [0.1.0] - 2025

### Added
- Initial release of react-auth-template: React/Next auth template - login/register forms, validation, session context.
