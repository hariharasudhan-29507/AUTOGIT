import type { ReactNode } from 'react'
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Database,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  Github,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserRound,
  Workflow,
  Sliders,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppAuth } from '@/lib/auth'
import { AuthAction } from '@/components/auth-action'
import { GitHubConnectAction } from '@/components/github-connect-action'
import { WorkflowScene } from '@/components/workflow-scene'
import { PremiumLanding } from '@/components/premium-landing'
import { GitSandbox } from '@/components/git-sandbox'
import { HealthCalculator } from '@/components/health-calculator'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 font-display text-base font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GitBranch className="size-4" />
      </span>
      <span>
        Auto<span className="text-primary font-bold">Git</span>
      </span>
    </Link>
  )
}

export function PublicShell({ children }: { children: ReactNode }) {
  const { session, isLoaded } = useAppAuth()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Navigation Header with Auth-Aware Action */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex" aria-label="Public navigation">
            <Link to="/features" className="transition-colors hover:text-foreground">
              Features
            </Link>
            <Link to="/security" className="transition-colors hover:text-foreground">
              Security
            </Link>
            <Link to="/how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </Link>
            <Link to="/help" className="transition-colors hover:text-foreground">
              Docs
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isLoaded && session ? (
              <Link
                to="/dashboard"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 shadow-2xs"
              >
                <LayoutDashboard className="size-4" /> Open Workspace
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 shadow-2xs"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content with Page-Enter Animation */}
      <main className="animate-page-enter flex-1">{children}</main>

      {/* Unified Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-muted-foreground">© 2026 AutoGit. Calm repository operations.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
            <Link to="/features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/security" className="hover:text-foreground transition-colors">
              Security
            </Link>
            <Link to="/how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/help" className="hover:text-foreground transition-colors">
              Help
            </Link>
            <a
              href="https://github.com/hariharasudhan-29507/AUTOGIT"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Github className="size-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function LandingPage() {
  return (
    <PublicShell>
      <PremiumLanding />
    </PublicShell>
  )
}

function FeatureCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <Card className="p-6 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </Card>
  )
}

export function FeaturesPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">Features & Architecture</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Complete control of your repository lifecycle.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          AutoGit brings repository telemetry, health signals, interactive visual workbenches, and execution pipelines together without dashboard clutter.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          <Card className="p-8 transition-all hover:border-primary/40">
            <span className="font-mono text-xs text-primary font-semibold">01 / SIGNAL</span>
            <h2 className="mt-4 font-display text-2xl font-semibold">Live Telemetry & Workbenches</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Visual commit trees, split & unified diff inspectors, branch selectors, and code viewers in one surface.
            </p>
          </Card>

          <Card className="p-8 transition-all hover:border-primary/40">
            <span className="font-mono text-xs text-primary font-semibold">02 / SCORE</span>
            <h2 className="mt-4 font-display text-2xl font-semibold">Health Score Engine</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Calculates algorithmic vitality scores to easily spot dormant codebases or active projects needing attention.
            </p>
          </Card>

          <Card className="p-8 transition-all hover:border-primary/40">
            <span className="font-mono text-xs text-primary font-semibold">03 / EXECUTE</span>
            <h2 className="mt-4 font-display text-2xl font-semibold">Streaming Automations</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Build drag-and-drop step sequences, execute pipelines with real-time log streaming, and track full duration history.
            </p>
          </Card>
        </div>

        {/* Embedded Interactive Git Sandbox */}
        <div className="mt-20">
          <div className="mb-6">
            <p className="font-mono text-xs uppercase tracking-wider text-primary">Live CLI Playground</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Try the Git CLI Sandbox</h2>
            <p className="mt-1 text-sm text-muted-foreground">Execute status checks, AST secret scans, diff inspections, and health calculations live.</p>
          </div>
          <GitSandbox />
        </div>

        {/* Embedded Interactive Health Calculator */}
        <div className="mt-20">
          <div className="mb-6">
            <p className="font-mono text-xs uppercase tracking-wider text-primary">Live Calculator</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Interactive Repository Health Calculator</h2>
            <p className="mt-1 text-sm text-muted-foreground">Test the multi-factor scoring algorithm across commit cadence, tests, issues, and docs.</p>
          </div>
          <HealthCalculator />
        </div>
      </section>
    </PublicShell>
  )
}

export function SecurityPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">Security Model</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Enterprise-grade security by default.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Authentication, OAuth token encryption, and database access are strictly isolated across verifiable boundaries.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Card className="p-7 transition-all hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <h2 className="mt-5 font-display text-xl font-semibold">Clerk Authentication</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              User authentication and session tokens are managed securely by Clerk with multi-factor support.
            </p>
          </Card>

          <Card className="p-7 transition-all hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LockKeyhole className="size-5" />
            </div>
            <h2 className="mt-5 font-display text-xl font-semibold">AES-256-GCM Encryption</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              GitHub OAuth access tokens are encrypted with authenticated cipher keys before being stored in the database.
            </p>
          </Card>

          <Card className="p-7 transition-all hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="size-5" />
            </div>
            <h2 className="mt-5 font-display text-xl font-semibold">PostgreSQL Row Level Security</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Every table enforces strict RLS policies mapped to the authenticated user's subject token.
            </p>
          </Card>
        </div>
      </section>
    </PublicShell>
  )
}

export function HowItWorksPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">Workflow Journey</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Three simple steps to momentum.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          AutoGit creates a clean bridge between your GitHub account and daily project management.
        </p>

        <div className="mt-14 space-y-6">
          <Card className="p-8 transition-all hover:border-primary/40">
            <div className="grid gap-6 sm:grid-cols-[60px_1fr] items-start">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-mono font-bold text-lg">
                01
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold">Authenticate your workspace</h2>
                <p className="mt-2 text-muted-foreground leading-7">
                  Sign in securely using Clerk. Your identity is verified and your private workspace is provisioned with zero setup overhead.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 transition-all hover:border-primary/40">
            <div className="grid gap-6 sm:grid-cols-[60px_1fr] items-start">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-mono font-bold text-lg">
                02
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold">Connect your GitHub account</h2>
                <p className="mt-2 text-muted-foreground leading-7">
                  Authorize read and repository scopes through GitHub OAuth. AutoGit securely encrypts and stores the access token.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 transition-all hover:border-primary/40">
            <div className="grid gap-6 sm:grid-cols-[60px_1fr] items-start">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-mono font-bold text-lg">
                03
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold">Inspect and automate</h2>
                <p className="mt-2 text-muted-foreground leading-7">
                  Sync repository telemetry, review calculated health scores, inspect visual commit graphs, and trigger custom workflows.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </PublicShell>
  )
}

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup'
  return (
    <PublicShell>
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md flex-col justify-center px-5 py-12">
        <Card className="p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">{isSignup ? 'Create Account' : 'Welcome Back'}</p>
              <h1 className="mt-2 font-display text-2xl font-semibold">{isSignup ? 'Start with AutoGit' : 'Sign in to AutoGit'}</h1>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Github className="size-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {isSignup ? 'Create your workspace and link GitHub to get started.' : 'Access your connected repositories and workflows.'}
          </p>

          <Separator className="my-6" />

          <AuthAction mode={mode} />

          <p className="mt-4 text-center text-xs text-muted-foreground">Secure authentication powered by Clerk.</p>

          <Separator className="my-6" />

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link to={isSignup ? '/login' : '/signup'} className="font-semibold text-primary underline underline-offset-4">
              {isSignup ? 'Sign in' : 'Create account'}
            </Link>
          </p>
        </Card>
      </div>
    </PublicShell>
  )
}

export function OnboardingPage() {
  const { session } = useAppAuth()

  return (
    <PublicShell>
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-lg flex-col justify-center px-5 py-12">
        <Card className="p-8 shadow-xl">
          <Badge variant="outline" className="mb-4 font-mono text-xs">
            Step 2 of 2
          </Badge>
          <h1 className="font-display text-2xl font-semibold">Connect your GitHub</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Link your GitHub account to sync repositories, branch updates, and health telemetry into your private AutoGit workspace.
          </p>

          <Separator className="my-6" />

          <div className="space-y-4">
            <GitHubConnectAction />

            <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Permissions requested:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Read access to public and private repositories</li>
                <li>Read access to branch status and commit history</li>
                <li>Write access for README updates (if explicitly enabled)</li>
              </ul>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between text-sm">
            <Link to="/dashboard" className="text-muted-foreground hover:underline">
              Skip for now
            </Link>
            <Link to="/dashboard" className="font-semibold text-primary underline underline-offset-4">
              Go to workspace →
            </Link>
          </div>
        </Card>
      </div>
    </PublicShell>
  )
}
