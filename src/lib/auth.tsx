import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'
import { createContext, useContext, type ReactNode } from 'react'
import { env, isClerkConfigured } from './env'
import type { UserSession } from '@/types'

type AppAuthValue = { session: UserSession | null; configured: boolean; isLoaded: boolean; getToken: () => Promise<string | null> }
const AuthContext = createContext<AppAuthValue>({ session: null, configured: isClerkConfigured, isLoaded: !isClerkConfigured, getToken: async () => null })

function ClerkSessionBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const { user } = useUser()
  const hasGithub = Boolean(user?.externalAccounts?.some((acc) => acc.provider === 'github' || acc.verification?.strategy === 'oauth_github'))
  const session = isSignedIn && user
    ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? '',
        name: user.fullName ?? user.username ?? 'User',
        avatarUrl: user.imageUrl,
        github: (hasGithub ? 'connected' : 'not_connected') as const,
      }
    : null
  return <AuthContext.Provider value={{ session, configured: true, isLoaded, getToken }}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) {
    // Local preview fallback session with mock token
    const mockSession: UserSession = {
      id: 'demo_user_123',
      email: 'alex@autogit.dev',
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      github: 'connected',
    }
    return (
      <AuthContext.Provider
        value={{
          session: mockSession,
          configured: false,
          isLoaded: true,
          getToken: async () => 'preview_mock_token',
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <ClerkProvider
      publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY!}
      signInUrl="/login"
      signUpUrl="/signup"
      afterSignInUrl="/onboarding"
      afterSignUpUrl="/onboarding"
      signInFallbackRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <ClerkSessionBridge>{children}</ClerkSessionBridge>
    </ClerkProvider>
  )
}

export function useAppAuth() { return useContext(AuthContext) }
export { SignedIn, SignedOut, SignInButton, SignUpButton }


