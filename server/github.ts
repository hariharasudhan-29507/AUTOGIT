import { createHmac, createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto'
import type { ServerEnv } from './config'

const cookieName = 'autogit_github_state'

function redirectUri(env: ServerEnv): string { return env.GITHUB_REDIRECT_URI ?? 'http://localhost:8787/api/github/callback' }

function required(env: ServerEnv, keys: Array<keyof ServerEnv>): void {
  if (keys.some((key) => !env[key])) throw new Error(`Missing GitHub configuration: ${keys.filter((key) => !env[key]).join(', ')}`)
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

function encryptionKey(env: ServerEnv): Buffer {
  required(env, ['TOKEN_ENCRYPTION_KEY'])
  const value = env.TOKEN_ENCRYPTION_KEY!
  const key = /^[0-9a-fA-F]{64}$/.test(value) ? Buffer.from(value, 'hex') : Buffer.from(value, 'base64')
  if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must decode to 32 bytes')
  return key
}

function encodeState(userId: string, env: ServerEnv): string {
  required(env, ['GITHUB_STATE_SECRET'])
  const payload = Buffer.from(JSON.stringify({ userId, nonce: randomBytes(16).toString('hex'), issuedAt: Date.now() })).toString('base64url')
  return `${payload}.${sign(payload, env.GITHUB_STATE_SECRET!)}`
}

export function githubCookie(state: string): string {
  return `${cookieName}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
}

function readCookie(request: Request): string | null {
  const value = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))
  return value ? decodeURIComponent(value.slice(cookieName.length + 1)) : null
}

export function verifyGithubState(request: Request, expectedUserId: string, env: ServerEnv): boolean {
  const state = readCookie(request)
  if (!state || !env.GITHUB_STATE_SECRET) return false
  const [payload, signature] = state.split('.')
  if (!payload || !signature) return false
  const expectedSignature = sign(payload, env.GITHUB_STATE_SECRET)
  if (signature.length !== expectedSignature.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { userId?: string; issuedAt?: number }
    return parsed.userId === expectedUserId && typeof parsed.issuedAt === 'number' && Date.now() - parsed.issuedAt < 10 * 60 * 1000
  } catch {
    return false
  }
}

export function githubAuthorizeUrl(userId: string, env: ServerEnv): string {
  required(env, ['GITHUB_CLIENT_ID', 'GITHUB_STATE_SECRET'])
  const params = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID!, redirect_uri: redirectUri(env), scope: 'read:user user:email repo', state: encodeState(userId, env) })
  return `https://github.com/login/oauth/authorize?${params}`
}

export async function exchangeGithubCode(code: string, env: ServerEnv): Promise<{ token: string; account: { id: number; login: string; avatar_url?: string; email?: string | null } }> {
  required(env, ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'])
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: env.GITHUB_REDIRECT_URI }),
  })
  const tokenBody = await tokenResponse.json() as { access_token?: string; error?: string }
  if (!tokenResponse.ok || !tokenBody.access_token) throw new Error(tokenBody.error ?? 'GitHub token exchange failed')
  const accountResponse = await fetch('https://api.github.com/user', { headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${tokenBody.access_token}`, 'X-GitHub-Api-Version': '2022-11-28' } })
  if (!accountResponse.ok) throw new Error('GitHub account lookup failed')
  return { token: tokenBody.access_token, account: await accountResponse.json() as { id: number; login: string; avatar_url?: string; email?: string | null } }
}

export function encryptToken(token: string, env: ServerEnv): string {
  required(env, ['TOKEN_ENCRYPTION_KEY'])
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(env), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`
}

export function decryptToken(value: string, env: ServerEnv): string {
  required(env, ['TOKEN_ENCRYPTION_KEY'])
  const [ivValue, tagValue, encryptedValue] = value.split('.')
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Stored GitHub token is malformed')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(env), Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8')
}

type GithubRepository = { id: number; name: string; owner: { login: string }; language: string | null; pushed_at: string | null; stargazers_count: number; forks_count: number; open_issues_count: number; private: boolean }

export async function fetchGithubRepositories(token: string): Promise<GithubRepository[]> {
  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&direction=desc&affiliation=owner,collaborator,organization_member', { headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } })
  if (!response.ok) throw new Error(`GitHub repository lookup failed with ${response.status}`)
  return await response.json() as GithubRepository[]
}


