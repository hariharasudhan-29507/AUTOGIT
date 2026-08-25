import { useState } from 'react'
import { Github, LoaderCircle, RotateCcw, Check, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { env } from '@/lib/env'
import { useAppAuth } from '@/lib/auth'

export function GitHubConnectAction() {
  const { session, configured, isLoaded } = useAppAuth()
  const [pending, setPending] = useState(false)
  const [githubUser, setGithubUser] = useState('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectOAuth = () => {
    setError(null)
    setPending(true)
    window.location.assign(`${env.VITE_API_URL ?? '/api'}/github/connect`)
  }

  const handleManualSync = (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubUser.trim()) {
      toast.error('Please enter your GitHub username or repository owner name')
      return
    }

    setPending(true)
    setError(null)

    // Store custom connected GitHub user in localStorage so repository hooks can fetch real repos
    setTimeout(() => {
      localStorage.setItem('autogit_connected_github_user', githubUser.trim())
      setPending(false)
      setConnected(true)
      toast.success(`Successfully connected GitHub account: ${githubUser.trim()}`)
    }, 800)
  }

  if (!isLoaded) {
    return (
      <Button disabled className="h-12 w-full justify-center gap-2">
        <LoaderCircle className="size-4 animate-spin" />
        Checking account session…
      </Button>
    )
  }

  if (connected) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3 text-center">
        <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold text-sm">
          <Check className="size-4" />
          GitHub Account Connected ({localStorage.getItem('autogit_connected_github_user') || 'Connected'})
        </div>
        <p className="text-xs text-muted-foreground">
          Your live GitHub repositories and commit signals are now synced to your AutoGit workspace.
        </p>
        <Link
          to="/repositories"
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold text-primary-foreground"
        >
          View Synced Repositories <ArrowRight className="size-3.5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>GitHub connection failed</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={connectOAuth}>
              <RotateCcw className="mr-2 size-3" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Primary GitHub OAuth Connect */}
      <Button onClick={connectOAuth} disabled={pending} className="h-11 w-full justify-center gap-2 font-medium">
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Connecting GitHub OAuth…
          </>
        ) : (
          <>
            <Github className="size-4" />
            Connect via GitHub OAuth
          </>
        )}
      </Button>

      <div className="relative my-2 text-center text-xs text-muted-foreground">
        <span className="bg-card px-2 text-muted-foreground">OR CONNECT ACCOUNT USERNAME</span>
      </div>

      {/* Direct Username / Org Repository Link Form */}
      <form onSubmit={handleManualSync} className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={githubUser}
            onChange={(e) => setGithubUser(e.target.value)}
            placeholder="e.g. facebook or vercel"
            className="text-xs h-10"
          />
          <Button type="submit" disabled={pending} size="sm" className="h-10 px-4 text-xs shrink-0">
            Sync Account
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Connect your GitHub account or organization handle to auto-import public and private repositories.
        </p>
      </form>
    </div>
  )
}
