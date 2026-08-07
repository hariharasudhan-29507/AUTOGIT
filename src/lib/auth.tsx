import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'
import { createContext, useContext, type ReactNode } from 'react'
import { env, isClerkConfigured } from './env'
import type { UserSession } from '@/types'

type AppAuthValue = { session: UserSession | null; configured: boolean; isLoaded: boolean; getToken: () => Promise<string | null> }
const AuthContext = createContext<AppAuthValue>({ session: null, configured: isClerkConfigured, isLoaded: !isClerkConfigured, getToken: async () => null })

function ClerkSessionBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const { user } = useUser()
  const session = isSignedIn && user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress ?? '', name: user.fullName ?? user.username ?? 'User', avatarUrl: user.imageUrl, github: 'not_connected' as const } : null
  return <AuthContext.Provider value={{ session, configured: true, isLoaded, getToken }}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) return <AuthContext.Provider value={{ session: null, configured: false, isLoaded: true, getToken: async () => null }}>{children}</AuthContext.Provider>
  return <ClerkProvider publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY!} signInUrl="/login" signUpUrl="/signup" afterSignInUrl="/onboarding" afterSignUpUrl="/onboarding" signInFallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding"><ClerkSessionBridge>{children}</ClerkSessionBridge></ClerkProvider>
}

export function useAppAuth() { return useContext(AuthContext) }
export { SignedIn, SignedOut, SignInButton, SignUpButton }
