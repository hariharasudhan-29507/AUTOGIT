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
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppAuth } from '@/lib/auth'
import { AuthAction } from '@/components/auth-action'
import { GitHubConnectAction } from '@/components/github-connect-action'
import { WorkflowScene } from '@/components/workflow-scene'
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
  const { session } = useAppAuth()

  return (
    <PublicShell>
      {/* Hero Section */}
      <section className="border-b border-border bg-radial from-muted/30 to-background px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <Badge variant="outline" className="mb-6 font-mono text-xs">
              <span className="mr-1.5 size-2 rounded-full bg-emerald-500" />
              Repository Operating System
            </Badge>

            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
              Keep your GitHub repositories <span className="text-muted-foreground">in focus.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              AutoGit unifies repository health telemetry, branch synchronization, and custom automation routines into one clear, reliable workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={session ? '/dashboard' : '/signup'}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-opacity hover:opacity-90 shadow-2xs"
              >
                {session ? 'Go to Workspace' : 'Connect GitHub'} <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/features"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-5 font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Explore features
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 border-t border-border pt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-500" /> Encrypted token storage
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" /> Strict Supabase RLS
              </span>
              <span className="flex items-center gap-1.5">
                <Workflow className="size-4 text-emerald-500" /> Real pipeline execution
              </span>
            </div>
          </div>

          <div className="relative min-h-[380px] overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-transform hover:scale-[1.01]">
            <WorkflowScene />
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">Key capabilities</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Built for clarity across your repositories.</h2>
          <p className="mt-3 text-muted-foreground">Everything you need to monitor project vitality and automate repetitive git chores.</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Activity}
            title="Repository Health Engine"
            text="Computes dynamic 0-100 vitality scores based on push recency, open issue ratios, language coverage, and activity."
          />
          <FeatureCard
            icon={Workflow}
            title="Interactive Automations"
            text="Build and reorder custom routine pipelines (sync, health checks, README audits) with real backend execution."
          />
          <FeatureCard
            icon={RefreshCw}
            title="Real-Time Synchronization"
            text="Fetch live metadata, stargazers, forks, and branch updates directly from the GitHub API in one click."
          />
          <FeatureCard
            icon={LockKeyhole}
            title="Row Level Security"
            text="Every query and mutation is isolated to your authenticated account using Supabase PostgreSQL RLS and Clerk tokens."
          />
          <FeatureCard
            icon={Search}
            title="Command Switcher (⌘ K)"
            text="Jump to any repository, trigger sync, or execute workflows instantly using the built-in command palette."
          />
          <FeatureCard
            icon={Terminal}
            title="Activity Audit Log"
            text="Keep a persistent, transparent record of all synchronization events, workflow runs, and workspace updates."
          />
        </div>
      </section>

      {/* Trust & Security Callout */}
      <section className="border-t border-border bg-card/60 px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">Security by Design</p>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Your GitHub credentials are never exposed.</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tokens are AES-256-GCM encrypted before storage and accessed solely by authenticated service calls.</p>
          </div>
          <Link
            to="/security"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold hover:bg-muted transition-colors"
          >
            Review Security Architecture <ChevronRight className="ml-1 size-4" />
          </Link>
        </div>
      </section>
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
        <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">Features</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Complete control of your repository lifecycle.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          AutoGit brings repository telemetry, health signals, and execution pipelines together without dashboard clutter.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          <Card className="p-8 transition-all hover:border-primary/40">
            <span className="font-mono text-xs text-primary font-semibold">01 / SIGNAL</span>
            <h2 className="mt-4 font-display text-2xl font-semibold">Live Telemetry</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Monitor repository languages, stars, forks, and commit recency without switching context.
            </p>
          </Card>

          <Card className="p-8 transition-all hover:border-primary/40">
            <span className="font-mono text-xs text-primary font-semibold">02 / SCORE</span>
            <h2 className="mt-4 font-display text-2xl font-semibold">Health Engine</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Calculates algorithmic vitality scores to easily spot dormant codebases or active projects needing attention.
            </p>
          </Card>

          <Card className="p-8 transition-all hover:border-primary/40">
            <span className="font-mono text-xs text-primary font-semibold">03 / EXECUTE</span>
            <h2 className="mt-4 font-display text-2xl font-semibold">Automations</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Build drag-and-drop step sequences, execute pipelines, and track full duration and status history.
            </p>
          </Card>
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
                  Sync repository telemetry, review calculated health scores, configure preferences, and trigger custom workflows.
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
            {isSignup ? 'Already have an account? ' : 'Need an account? '}
            <Link to={isSignup ? '/login' : '/signup'} className="font-semibold text-primary underline-offset-4 hover:underline">
              {isSignup ? 'Sign in' : 'Create one'}
            </Link>
          </p>
        </Card>
      </div>
    </PublicShell>
  )
}

export function OnboardingPage() {
  const status = new URLSearchParams(window.location.search).get('github')
  const connected = status === 'connected'

  return (
    <PublicShell>
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-lg flex-col justify-center px-5 py-12">
        <Card className="p-8 shadow-xl">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Github className="size-6" />
          </div>

          <p className="mt-6 font-mono text-xs uppercase tracking-[.18em] text-primary">Onboarding Step 2</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            {connected ? 'GitHub is Connected' : 'Connect Your GitHub'}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {connected
              ? 'Your GitHub account is linked. Open the workspace to synchronize repositories.'
              : 'Authorize GitHub access so AutoGit can read repository signals and synchronize your workspace.'}
          </p>

          {status === 'error' && (
            <Alert className="mt-6" variant="destructive">
              <AlertTitle>Connection failed</AlertTitle>
              <AlertDescription>GitHub OAuth exchange could not be completed. Please try again.</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-primary" /> Tokens are AES-256 encrypted before storage
            </div>
            <div className="flex items-center gap-2">
              <Check className="size-4 text-primary" /> Workspace data remains strictly private
            </div>
          </div>

          <div className="mt-8">
            <GitHubConnectAction />
          </div>

          <Link
            to="/dashboard"
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
          >
            Go to Workspace <ChevronRight className="ml-1 size-4" />
          </Link>
        </Card>
      </div>
    </PublicShell>
  )
}

export function HelpPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">Help & Documentation</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Everything you need to know.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Clear guides for setting up GitHub authentication, synchronizing repositories, and configuring automated routines.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Card className="p-7 transition-all hover:border-primary/40">
            <h2 className="font-display text-xl font-semibold">1. Connecting GitHub</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Authenticate via Clerk, then visit the onboarding page to authorize OAuth scopes with GitHub.
            </p>
          </Card>

          <Card className="p-7 transition-all hover:border-primary/40">
            <h2 className="font-display text-xl font-semibold">2. Automating Workflows</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Create routines on the Automation page, drag execution steps into your preferred order, and trigger runs on demand.
            </p>
          </Card>

          <Card className="p-7 transition-all hover:border-primary/40">
            <h2 className="font-display text-xl font-semibold">3. Quick Switcher (⌘ K)</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use the global ⌘ K shortcut anywhere in the workspace to switch between views, run syncs, or search repositories.
            </p>
          </Card>
        </div>
      </section>
    </PublicShell>
  )
}

export function AboutPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">About AutoGit</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Calm, focused repository control.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          AutoGit was built to replace cluttered dashboards with actionable repository signals, verified automation, and seamless Git workflows.
        </p>
      </section>
    </PublicShell>
  )
}
