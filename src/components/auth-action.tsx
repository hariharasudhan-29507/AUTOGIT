import { useState } from 'react'
import { SignInButton, SignUpButton, useAppAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Github, LoaderCircle, Mail } from 'lucide-react'

function GoogleIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

function LinkedInIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.64a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z" />
    </svg>
  )
}

function VercelIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L24 22H0L12 1Z" />
    </svg>
  )
}

export function AuthAction({ mode, pending = false }: { mode: 'login' | 'signup'; pending?: boolean }) {
  const { configured, isLoaded } = useAppAuth()
  const [activeProvider, setActiveProvider] = useState<string | null>(null)
  const busy = pending || activeProvider !== null || (configured && !isLoaded)

  const handleProviderSelect = (provider: string) => {
    setActiveProvider(provider)
    if (!configured) {
      // Direct local workspace redirect when Clerk is unconfigured
      setTimeout(() => {
        window.location.assign('/onboarding')
      }, 600)
    }
  }

  const actionText = mode === 'signup' ? 'Create account with' : 'Continue with'

  if (!configured) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-center font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-lg">
          Direct OAuth Mode Active (Syncs your GitHub, Google, LinkedIn & Vercel)
        </p>
        <Button
          type="button"
          disabled={busy}
          onClick={() => handleProviderSelect('github')}
          className="h-11 w-full justify-center gap-3 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Github className="size-4" />
          {activeProvider === 'github' ? <LoaderCircle className="size-4 animate-spin" /> : `${actionText} GitHub`}
        </Button>

        <Button
          type="button"
          disabled={busy}
          onClick={() => handleProviderSelect('google')}
          className="h-11 w-full justify-center gap-3 border border-border bg-card text-foreground hover:bg-muted"
        >
          <GoogleIcon className="size-4" />
          {activeProvider === 'google' ? <LoaderCircle className="size-4 animate-spin" /> : `${actionText} Google / Gmail`}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            disabled={busy}
            onClick={() => handleProviderSelect('linkedin')}
            className="h-11 justify-center gap-2 border border-border bg-card text-foreground hover:bg-muted"
          >
            <LinkedInIcon className="size-4" />
            <span>LinkedIn</span>
          </Button>

          <Button
            type="button"
            disabled={busy}
            onClick={() => handleProviderSelect('vercel')}
            className="h-11 justify-center gap-2 border border-border bg-card text-foreground hover:bg-muted"
          >
            <VercelIcon className="size-4" />
            <span>Vercel</span>
          </Button>
        </div>
      </div>
    )
  }

  const renderClerkButton = (
    provider: 'github' | 'google' | 'linkedin' | 'vercel',
    icon: React.ReactNode,
    label: string,
    variant: 'dark' | 'outline' = 'outline'
  ) => {
    const isThisBusy = activeProvider === provider
    const content = (
      <Button
        type="button"
        disabled={busy}
        onClick={() => setActiveProvider(provider)}
        className={
          variant === 'dark'
            ? 'h-11 w-full justify-center gap-3 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-medium'
            : 'h-11 w-full justify-center gap-3 border border-border bg-card text-foreground hover:bg-muted font-medium'
        }
      >
        {isThisBusy ? <LoaderCircle className="size-4 animate-spin" /> : icon}
        {isThisBusy ? 'Connecting...' : `${actionText} ${label}`}
      </Button>
    )

    return mode === 'signup' ? (
      <SignUpButton mode="modal" fallbackRedirectUrl="/onboarding" signInFallbackRedirectUrl="/login">
        {content}
      </SignUpButton>
    ) : (
      <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/signup">
        {content}
      </SignInButton>
    )
  }

  return (
    <div className="space-y-3">
      {renderClerkButton('github', <Github className="size-4" />, 'GitHub', 'dark')}
      {renderClerkButton('google', <GoogleIcon className="size-4" />, 'Google / Gmail', 'outline')}

      <div className="grid grid-cols-2 gap-3">
        {renderClerkButton('linkedin', <LinkedInIcon className="size-4" />, 'LinkedIn', 'outline')}
        {renderClerkButton('vercel', <VercelIcon className="size-4" />, 'Vercel', 'outline')}
      </div>
    </div>
  )
}
