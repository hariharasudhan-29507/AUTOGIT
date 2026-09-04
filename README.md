# AutoGit

AutoGit is a calm, GitHub-inspired workspace for repositories, local changes, and project health. It brings repository summaries, local/remote sync state, commit history, and workspace health monitoring into a single unified dashboard interface.

## Tech Stack

- **Frontend Framework:** React, TypeScript, React Router (`react-router-dom`)
- **Styling & UI:** Tailwind CSS, Lucide Icons (`lucide-react`), Radix UI primitives (`src/components/ui`)
- **Authentication:** Clerk (`@clerk/clerk-react`) with local preview fallback mode
- **API & State:** Custom typed API client boundary (`src/lib/api.ts`), Zod schema validation
- **Backend Service:** Hono / Node server framework configuration (`server/config.ts`, `server/dev.ts`)
- **Testing:** Vitest (`bun test`)

## Local Setup

### 1. Prerequisites

Ensure Node.js (v18 or higher) or Bun is installed on your environment.

### 2. Environment Configuration

Create a local environment file `.env.local` or `.env` in the root directory:

```bash
# Client Configuration (must start with VITE_)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_... # Optional: Clerk Publishable Key for production auth
VITE_API_URL=http://localhost:8787     # Backend API service URL (defaults to http://localhost:8787)
```

Without `VITE_CLERK_PUBLISHABLE_KEY`, the application automatically runs in **local preview mode**. In preview mode, OAuth buttons navigate through the full UI flow so the shell can be inspected without requiring third-party credentials. Production auth requires Clerk configured with Google and GitHub identity providers.

### 3. Server Environment Configuration

Server-side environment variables defined in `server/config.ts` (validated via Zod schema):

- `CLERK_SECRET_KEY`: Clerk secret key for session verification
- `CLERK_WEBHOOK_SIGNING_SECRET`: Optional Clerk webhook signing secret
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY` & `SUPABASE_SERVICE_ROLE_KEY`: Supabase API keys
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`, `GITHUB_STATE_SECRET`: GitHub OAuth client configuration
- `TOKEN_ENCRYPTION_KEY`: Encryption key for secure token storage
- `CORS_ORIGIN`: Allowed CORS origin (defaults to `http://localhost:5173`)

### 4. Running the Project

Run tests:
```bash
bun test
```

Run the development server (when package manager scripts are configured):
```bash
npm run dev
```

## Architecture & Directory Structure

```
.
├── server/                   # Server API service configuration
│   ├── config.ts             # Zod environment schema for backend services
│   └── dev.ts                # Server entry point
├── src/                      # Client application source
│   ├── components/           # UI components
│   │   ├── app-shell.tsx     # Navigation header and main workspace layout wrapper
│   │   ├── hero-scene.tsx    # Landing page hero visual element
│   │   ├── ui.tsx            # Shared basic UI primitives (Card, Button, Badge, Skeleton, PageHeader)
│   │   └── ui/               # Radix UI and styled primitive components (dialog, drawer, dropdown, etc.)
│   ├── lib/                  # Application utilities and service boundaries
│   │   ├── api.ts            # Typed, credentialed API client boundary
│   │   ├── auth.tsx          # Clerk authentication provider and local preview fallback context
│   │   ├── env.ts            # Public client environment schema and configuration validator
│   │   ├── utils.ts          # Utility functions (cn class combiner, formatRelativeTime)
│   │   └── utils.test.ts     # Unit tests for utility functions
│   ├── types/                # TypeScript interfaces & service contracts
│   │   └── index.ts          # Core domain models (UserSession, RepositorySummary, Workflow, ActivityEvent)
│   ├── main.tsx              # React app entry point and client-side routing definitions
│   ├── pages.tsx             # View components for Landing, Auth, Onboarding, Dashboard, Repositories, etc.
│   └── styles.css            # Global CSS styles and Tailwind imports
├── index.html                # Vite HTML template
└── tsconfig.app.json         # TypeScript application config
```

## Security Model

- **No Stored Passwords:** GitHub passwords are never requested or stored.
- **OAuth Boundary:** OAuth authentication is handled exclusively via Clerk and server-side service boundaries.
- **Environment Isolation:** The client strictly accepts `VITE_*` public variables. Server secrets (Clerk secret keys, Supabase service keys, token encryption keys, and webhook secrets) must never be prefixed with `VITE_` or exposed to client builds.
- **Service Security:** Production API endpoints enforce authenticated-user checks, repository ownership checks, HttpOnly cookie sessions, CSRF protection, rate limiting, Content Security Policy (CSP) headers, Zod payload validation, and audit logging.

## Roadmap & Next Vertical Slice

- Implement Render API service & Clerk session/webhook verification.
- Add GitHub account-linking OAuth callback flow.
- Provision Supabase user and profile tables with Row Level Security (RLS).
- Implement real repository list endpoint and replace seeded repository summaries with React Query data hooks and partial-failure handling.
