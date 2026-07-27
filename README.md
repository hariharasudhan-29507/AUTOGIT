# AutoGit

AutoGit is a calm, GitHub-inspired workspace for repositories, local changes, and project health.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Without `VITE_CLERK_PUBLISHABLE_KEY`, the app runs in local preview mode. OAuth buttons take you through the UI flow so the shell can be validated without credentials. Production requires Clerk configuration for Google and GitHub providers.

## Architecture

- `src/components` contains the application shell and shared UI primitives.
- `src/pages.tsx` contains the milestone-one route views and explicit interaction states.
- `src/lib/auth.tsx` contains the Clerk boundary and local preview fallback.
- `src/lib/api.ts` contains the typed, credentialed API client boundary for a Render service.
- `src/types` contains service contracts shared by future GitHub, repository, analytics, notification, and settings modules.

The client only accepts `VITE_*` public configuration. Server-only OAuth secrets, Supabase service keys, token encryption keys, and webhook secrets belong in the API service environment and must never be prefixed with `VITE_`.

## Security assumptions

GitHub passwords are never stored. OAuth access is handled through Clerk and server-side service boundaries. The future API must enforce authenticated-user checks, repository ownership checks, HttpOnly cookies, CSRF protection, rate limiting, CSP headers, Zod validation, Supabase RLS, and audit logging before adding repository mutations.

## Next vertical slice

Implement the Render API service, Clerk webhook/session verification, GitHub account-linking callback, Supabase user/profile tables, and the real repository list endpoint. Then replace the seeded repository summaries in `src/pages.tsx` with React Query data and isolated partial-failure states.
