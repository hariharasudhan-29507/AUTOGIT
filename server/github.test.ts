import { describe, expect, it } from 'vitest'
import { encryptToken, githubAuthorizeUrl, githubCookie, verifyGithubState } from './github'
import type { ServerEnv } from './config'

const env: ServerEnv = {
  CLERK_SECRET_KEY: 'secret',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'publishable',
  CORS_ORIGIN: 'http://localhost:5173',
  GITHUB_CLIENT_ID: 'client',
  GITHUB_CLIENT_SECRET: 'github-secret',
  GITHUB_REDIRECT_URI: 'http://localhost:8787/api/github/callback',
  GITHUB_STATE_SECRET: 'a'.repeat(32),
  TOKEN_ENCRYPTION_KEY: 'b'.repeat(64),
}

describe('GitHub OAuth helpers', () => {
  it('creates and verifies a user-bound state cookie', () => {
    const url = new URL(githubAuthorizeUrl('user_123', env))
    const request = new Request(url, { headers: { cookie: githubCookie(url.searchParams.get('state')!) } })
    expect(verifyGithubState(request, 'user_123', env)).toBe(true)
    expect(verifyGithubState(request, 'other_user', env)).toBe(false)
  })

  it('encrypts tokens into an iv, auth tag, and ciphertext', () => {
    const encrypted = encryptToken('github-access-token', env)
    expect(encrypted.split('.')).toHaveLength(3)
    expect(encrypted).not.toContain('github-access-token')
  })
})
