import { useState } from 'react'
import { SignInButton, SignUpButton, useAppAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Github, LoaderCircle } from 'lucide-react'

export function AuthAction({ mode, pending = false }: { mode: 'login' | 'signup'; pending?: boolean }) {
  const { configured, isLoaded } = useAppAuth()
  const [clicked, setClicked] = useState(false)
  const busy = pending || clicked || (configured && !isLoaded)
  if (!configured) return <Button disabled className="h-12 w-full justify-center">Clerk is not configured</Button>
  const child = <Button type="button" disabled={busy} onClick={() => setClicked(true)} className="h-12 w-full justify-center gap-3 bg-white text-black hover:bg-white/85"><Github className="size-4" />{busy ? <><LoaderCircle className="size-4 animate-spin" />Opening secure sign-in…</> : 'Continue with GitHub'}</Button>
  return mode === 'signup' ? <SignUpButton mode="modal" oauthFlow="redirect" fallbackRedirectUrl="/onboarding" signInFallbackRedirectUrl="/login">{child}</SignUpButton> : <SignInButton mode="modal" oauthFlow="redirect" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/signup">{child}</SignInButton>
}
