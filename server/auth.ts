import { createClerkClient } from '@clerk/backend'
import type { ServerEnv } from './config'

export interface AuthenticatedRequest {
  userId: string
  token: string
}

export type RequestAuthenticator = (request: Request) => Promise<AuthenticatedRequest | null>

export function createRequestAuthenticator(env: ServerEnv): RequestAuthenticator {
  const clerk = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
  })

  return async (request) => {
    const state = await clerk.authenticateRequest(request, { acceptsToken: 'session_token' })
    if (!state.isAuthenticated || !state.token) return null
    const userId = state.toAuth().userId
    return userId ? { userId, token: state.token } : null
  }
}
