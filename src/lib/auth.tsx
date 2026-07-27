import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'
import { createContext, useContext, type ReactNode } from 'react'
import { env, isClerkConfigured } from './env'
import type { UserSession } from '@/types'

const AuthContext = createContext<{ session: UserSession | null; configured: boolean }>({ session: null, configured: isClerkConfigured })

function ClerkSessionBridge({ children }: { children: ReactNode }) {
  const { isSignedIn } = useClerkAuth()
  const { user } = useUser()
  const session = isSignedIn && user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress ?? '', name: user.fullName ?? user.username ?? 'User', avatarUrl: user.imageUrl, github: 'not_connected' as const } : null
  return <AuthContext.Provider value={{ session, configured: true }}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) return <AuthContext.Provider value={{ session: null, configured: false }}>{children}</AuthContext.Provider>
  return <ClerkProvider publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY!}><ClerkSessionBridge>{children}</ClerkSessionBridge></ClerkProvider>
}

export function useAppAuth() { return useContext(AuthContext) }
export { SignedIn, SignedOut, SignInButton, SignUpButton }
