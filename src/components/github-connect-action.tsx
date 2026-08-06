import { useState } from 'react'
import { Github, LoaderCircle, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { env } from '@/lib/env'
import { useAppAuth } from '@/lib/auth'

export function GitHubConnectAction() {
  const { session, configured, isLoaded } = useAppAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const connect = () => { setError(null); setPending(true); window.location.assign(`${env.VITE_API_URL}/github/connect`) }
  if (!configured) return <Alert variant="destructive"><AlertTitle>Account authentication is not configured</AlertTitle><AlertDescription>Set VITE_CLERK_PUBLISHABLE_KEY before connecting GitHub.</AlertDescription></Alert>
  if (!isLoaded) return <Button disabled className="h-12 w-full justify-center gap-2"><LoaderCircle className="size-4 animate-spin" />Checking account session…</Button>
  if (!session) return <div className="space-y-3"><Link to="/login" className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"><Github className="mr-2 size-4" />Sign in to connect GitHub</Link><p className="text-center text-xs text-muted-foreground">Your account is created first, then GitHub is linked to it.</p></div>
  return <div className="space-y-3">{error && <Alert variant="destructive"><AlertTitle>GitHub connection failed</AlertTitle><AlertDescription className="flex items-center justify-between gap-3">{error}<Button size="sm" variant="outline" onClick={connect}><RotateCcw className="mr-2 size-3" />Retry</Button></AlertDescription></Alert>}<Button onClick={connect} disabled={pending} className="h-12 w-full justify-center gap-2">{pending ? <><LoaderCircle className="size-4 animate-spin" />Connecting GitHub…</> : <><Github className="size-4" />Connect GitHub account</>}</Button></div>
}

