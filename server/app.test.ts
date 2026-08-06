import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createApp } from './app'
import type { ServerEnv } from './config'

const env: ServerEnv = {
  CLERK_SECRET_KEY: 'clerk-secret-for-test',
  CLERK_PUBLISHABLE_KEY: 'pk_test_example',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
  CORS_ORIGIN: 'http://localhost:5173',
}

function repositoryClient(result: unknown, capture: { field?: string; value?: string; range?: [number, number]; query?: string }) {
  const builder = {
    from: () => builder,
    select: () => builder,
    eq: (field: string, value: string) => { capture.field = field; capture.value = value; return builder },
    or: (query: string) => { capture.query = query; return builder },
    order: () => builder,
    range: async (from: number, to: number) => { capture.range = [from, to]; return result },
    maybeSingle: async () => result,
  }
  return builder as unknown as SupabaseClient
}

describe('Hono API', () => {
  it('returns a public health response', async () => {
    const response = await createApp({ env }).request('http://localhost/api/health')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  it('rejects missing or invalid authentication', async () => {
    const app = createApp({ env, authenticate: async () => null })
    const response = await app.request('http://localhost/api/repositories')
    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ code: 'UNAUTHORIZED', recoverable: false })
  })

  it('forwards the Clerk token, applies ownership, and paginates', async () => {
    const auth = { userId: 'user_123', token: 'clerk-session-token' }
    const forwarded: { userId?: string; token?: string } = {}
    const filter: { field?: string; value?: string; range?: [number, number] } = {}
    const app = createApp({
      env,
      authenticate: async () => auth,
      supabase: (requestAuth) => {
        forwarded.userId = requestAuth.userId
        forwarded.token = requestAuth.token
        return repositoryClient({ data: [], error: null, count: 0 }, filter)
      },
    })

    const response = await app.request('http://localhost/api/repositories?page=2&pageSize=5')
    expect(response.status).toBe(200)
    expect(forwarded).toEqual(auth)
    expect(filter.field).toBe('user_id')
    expect(filter.value).toBe('user_123')
    expect(filter.range).toEqual([5, 9])
    expect(await response.json()).toMatchObject({ data: [], total: 0, page: 2, pageSize: 5 })
  })

  it('maps repository rows to the public contract', async () => {
    const app = createApp({
      env,
      authenticate: async () => ({ userId: 'user_123', token: 'token' }),
      supabase: () => repositoryClient({
        data: [{ id: 7, name: 'autogit', owner: 'hari', language: null, last_commit: null, stars: 1, forks: 2, open_issues: 3, health_score: null, synced: true, is_private: true }],
        error: null,
        count: 1,
      }, {}),
    })

    const response = await app.request('http://localhost/api/repositories')
    expect(await response.json()).toMatchObject({ data: [{ id: 7, language: 'Unknown', lastCommit: '', isPrivate: true }], total: 1 })
  })

  it('rejects invalid repository filters', async () => {
    const app = createApp({ env, authenticate: async () => ({ userId: 'user_123', token: 'token' }) })
    const response = await app.request('http://localhost/api/repositories?pageSize=1000')
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: 'VALIDATION_ERROR', recoverable: false })
  })

  it('returns an ownership-protected repository detail', async () => {
    const app = createApp({
      env,
      authenticate: async () => ({ userId: 'user_123', token: 'token' }),
      supabase: () => repositoryClient({ data: { id: 7, name: 'autogit', owner: 'hari', language: 'TypeScript', last_commit: null, stars: 1, forks: 2, open_issues: 3, health_score: 90, synced: true, is_private: false }, error: null }, {}),
    })
    const response = await app.request('http://localhost/api/repositories/7')
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ id: 7, name: 'autogit', healthScore: 90 })
  })

  it('returns a safe error when Supabase fails', async () => {
    const app = createApp({
      env,
      authenticate: async () => ({ userId: 'user_123', token: 'token' }),
      supabase: () => repositoryClient({ data: null, error: { code: 'DB_ERROR', message: 'secret database detail' }, count: null }, {}),
    })

    const response = await app.request('http://localhost/api/repositories')
    const body = await response.text()
    expect(response.status).toBe(500)
    expect(body).toContain('REPOSITORY_QUERY_FAILED')
    expect(body).not.toContain('secret database detail')
  })
})