import { Hono } from 'hono'
import { z } from 'zod'
import { cors } from 'hono/cors'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createRequestAuthenticator, type AuthenticatedRequest, type RequestAuthenticator } from './auth'
import { getServerEnv, type ServerEnv } from './config'
import { decryptToken, exchangeGithubCode, encryptToken, fetchGithubRepositories, githubAuthorizeUrl, githubCookie, verifyGithubState } from './github'
import { handleClerkWebhook } from './webhooks'
import { createAdminSupabaseClient, createUserSupabaseClient } from './supabase'
import type { ApiError, PaginatedResponse, RepositorySummary } from '../src/types'

type RepositoryRow = { id: number; name: string; owner: string; language: string | null; last_commit: string | null; stars: number; forks: number; open_issues: number; health_score: number | null; synced: boolean; is_private: boolean }
type SupabaseFactory = (auth: AuthenticatedRequest) => SupabaseClient

export interface AppDependencies { env?: ServerEnv; authenticate?: RequestAuthenticator; supabase?: SupabaseFactory; adminSupabase?: SupabaseClient }

function requestId() { return crypto.randomUUID() }
function errorBody(code: string, message: string, id: string, recoverable: boolean): ApiError { return { code, message, requestId: id, recoverable } }
function mapRepository(row: RepositoryRow): RepositorySummary { return { id: row.id, name: row.name, owner: row.owner, language: row.language ?? 'Unknown', lastCommit: row.last_commit ?? '', stars: row.stars, forks: row.forks, openIssues: row.open_issues, healthScore: row.health_score ?? 0, synced: row.synced, isPrivate: row.is_private } }
const repositoryQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(10), search: z.string().trim().max(100).default(''), visibility: z.enum(['all', 'public', 'private']).default('all'), language: z.string().trim().max(50).default(''), sort: z.enum(['updated', 'name', 'stars']).default('updated') })

  app.get('/api/github/connect', async (c) => {
    const auth = await authenticate(c.req.raw)
    if (!auth) return c.json({ code: 'UNAUTHORIZED', message: 'Authentication is required.' }, 401)
    try {
      const authorizationUrl = new URL(githubAuthorizeUrl(auth.userId, env))
      const state = authorizationUrl.searchParams.get('state')
      if (!state) throw new Error('GitHub state was not generated')
      c.header('Set-Cookie', githubCookie(state))
      return c.redirect(authorizationUrl.toString())
    } catch {
      return c.json({ code: 'GITHUB_NOT_CONFIGURED', message: 'GitHub account linking is not configured.' }, 503)
    }
  })

  app.get('/api/github/callback', async (c) => {
    const auth = await authenticate(c.req.raw)
    const code = c.req.query('code')
    if (!auth || !code || !verifyGithubState(c.req.raw, auth.userId, env)) return c.redirect(`${env.APP_ORIGIN ?? "http://localhost:5173"}/onboarding?github=invalid`)
    try {
      if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      const { token, account } = await exchangeGithubCode(code, env)
      const result = await adminSupabase.from('github_connections').upsert({ user_id: auth.userId, github_user_id: account.id, login: account.login, avatar_url: account.avatar_url ?? null, token_encrypted: encryptToken(token, env), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (result.error) throw result.error
      return c.redirect(`${env.APP_ORIGIN ?? "http://localhost:5173"}/onboarding?github=connected`)
    } catch {
      return c.redirect(`${env.APP_ORIGIN ?? "http://localhost:5173"}/onboarding?github=error`)
    }
  })

  app.post('/api/repositories/sync', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)
      if (!adminSupabase) return c.json(errorBody('SYNC_NOT_CONFIGURED', 'Repository sync is not configured.', id, false), 503)
      const connection = await adminSupabase.from('github_connections').select('token_encrypted').eq('user_id', auth.userId).maybeSingle()
      if (connection.error) return c.json(errorBody('CONNECTION_LOOKUP_FAILED', 'The GitHub connection could not be loaded.', id, true), 500)
      if (!connection.data) return c.json(errorBody('GITHUB_NOT_CONNECTED', 'Connect GitHub before syncing repositories.', id, false), 409)
      const repositories = await fetchGithubRepositories(decryptToken(connection.data.token_encrypted, env))
      const rows = repositories.map((repository) => ({ user_id: auth.userId, github_id: repository.id, name: repository.name, owner: repository.owner.login, language: repository.language, last_commit: repository.pushed_at, stars: repository.stargazers_count, forks: repository.forks_count, open_issues: repository.open_issues_count, health_score: null, synced: true, is_private: repository.private, updated_at: new Date().toISOString() }))
      if (rows.length > 0) {
        const result = await adminSupabase.from('repositories').upsert(rows, { onConflict: 'user_id,github_id' })
        if (result.error) return c.json(errorBody('REPOSITORY_SYNC_FAILED', 'Repositories could not be synchronized.', id, true), 500)
      }
      return c.json({ synced: rows.length })
    } catch (error) {
      console.error('repository sync failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('REPOSITORY_SYNC_FAILED', 'Repositories could not be synchronized.', id, true), 502)
    }
  })
  app.get('/api/repositories', async (c) => {
    const id = requestId()
    const parsed = repositoryQuerySchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams.entries()))
    if (!parsed.success) return c.json(errorBody('VALIDATION_ERROR', 'Repository filters are invalid.', id, false), 400)
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)
      const { page, pageSize, search, visibility, language, sort } = parsed.data
      let query = supabase(auth).from('repositories').select('id,name,owner,language,last_commit,stars,forks,open_issues,health_score,synced,is_private', { count: 'exact' }).eq('user_id', auth.userId)
      if (search) query = query.or(`name.ilike.%${search}%,owner.ilike.%${search}%`)
      if (visibility === 'private') query = query.eq('is_private', true)
      if (visibility === 'public') query = query.eq('is_private', false)
      if (language) query = query.eq('language', language)
      const orderColumn = sort === 'name' ? 'name' : sort === 'stars' ? 'stars' : 'updated_at'
      const { data, error, count } = await query.order(orderColumn, { ascending: sort === 'name' }).range((page - 1) * pageSize, page * pageSize - 1)
      if (error) {
        console.error('repository query failed', { requestId: id, code: error.code })
        return c.json(errorBody('REPOSITORY_QUERY_FAILED', 'Repositories are temporarily unavailable.', id, true), 500)
      }
      const response: PaginatedResponse<RepositorySummary> = { data: (data as RepositoryRow[]).map(mapRepository), page, pageSize, total: count ?? data?.length ?? 0 }
      return c.json(response)
    } catch (error) {
      console.error('repository request failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.get('/api/repositories/:repositoryId', async (c) => {
    const id = requestId()
    const repositoryId = Number(c.req.param('repositoryId'))
    if (!Number.isSafeInteger(repositoryId) || repositoryId < 1) return c.json(errorBody('REPOSITORY_NOT_FOUND', 'Repository not found.', id, false), 404)
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)
      const { data, error } = await supabase(auth).from('repositories').select('id,name,owner,language,last_commit,stars,forks,open_issues,health_score,synced,is_private').eq('user_id', auth.userId).eq('id', repositoryId).maybeSingle()
      if (error) {
        console.error('repository detail query failed', { requestId: id, code: error.code })
        return c.json(errorBody('REPOSITORY_QUERY_FAILED', 'The repository could not be loaded.', id, true), 500)
      }
      if (!data) return c.json(errorBody('REPOSITORY_NOT_FOUND', 'Repository not found.', id, false), 404)
      return c.json(mapRepository(data as RepositoryRow))
    } catch (error) {
      console.error('repository detail request failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })
  return app
}



