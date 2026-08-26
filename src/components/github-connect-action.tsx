import { useState } from 'react'
import { Github, LoaderCircle, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { env } from '@/lib/env'
import { useAppAuth } from '@/lib/auth'

import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useGithubStatus, useSyncRepositories } from '@/lib/repositories'

export function GitHubConnectAction() {
  const { session, configured, isLoaded } = useAppAuth()
  const statusQuery = useGithubStatus()
  const syncMutation = useSyncRepositories()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = () => {
    setError(null)
    setPending(true)
    window.location.assign(`${env.VITE_API_URL}/github/connect`)
  }

  if (!isLoaded) return <Button disabled className="h-12 w-full justify-center gap-2"><LoaderCircle className="size-4 animate-spin" />Checking account session…</Button>
  if (!session) return <div className="space-y-3"><Link to="/login" className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"><Github className="mr-2 size-4" />Sign in to connect GitHub</Link><p className="text-center text-xs text-muted-foreground">Your account is created first, then GitHub is linked to it.</p></div>

  // Show connected state when session/status indicates connection or in preview mode
  const isConnected = session.github === 'connected' || statusQuery.data?.connected || !configured

  if (isConnected) {
    const handle = statusQuery.data?.login || session.name || 'GitHub Account'
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">GitHub Connected</p>
              <p className="text-xs text-muted-foreground">Linked as @{handle}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={syncMutation.isPending ? 'mr-1.5 size-3.5 animate-spin' : 'mr-1.5 size-3.5'} />
            {syncMutation.isPending ? 'Syncing…' : 'Sync Repos'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>GitHub connection failed</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={connect}>
              <RotateCcw className="mr-2 size-3" />Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Button onClick={connect} disabled={pending} className="h-12 w-full justify-center gap-2">
        {pending ? <><LoaderCircle className="size-4 animate-spin" />Connecting GitHub…</> : <><Github className="size-4" />Connect GitHub account</>}
      </Button>
    </div>
  )
}

