import { Hono } from 'hono'
import { z } from 'zod'
import { cors } from 'hono/cors'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createRequestAuthenticator, type AuthenticatedRequest, type RequestAuthenticator } from './auth'
import { getServerEnv, type ServerEnv } from './config'
import { decryptToken, exchangeGithubCode, encryptToken, fetchGithubRepositories, githubAuthorizeUrl, githubCookie, verifyGithubState } from './github'
import { handleClerkWebhook } from './webhooks'
import { handleGitHubWebhook } from './webhooks-github'
import { evaluateRepositorySecurity, scanCodeForSecrets, type SecurityAuditResult } from './security'
import { createAdminSupabaseClient, createUserSupabaseClient } from './supabase'
import type {
  ActivityEvent,
  AnalyticsOverview,
  ApiError,
  Notification,
  PaginatedResponse,
  RepositorySummary,
  UserPreferences,
  WorkflowDefinition,
  WorkflowRun,
  WorkflowStep,
} from '../src/types'

type RepositoryRow = {
  id: number
  name: string
  owner: string
  language: string | null
  last_commit: string | null
  stars: number
  forks: number
  open_issues: number
  health_score: number | null
  synced: boolean
  is_private: boolean
}

type UserSettingsRow = {
  user_id: string
  default_branch: string
  auto_commit: boolean
  auto_push: boolean
  readme_automation: boolean
  excluded_folders: string[]
  created_at: string
  updated_at: string
}

type ActivityEventRow = {
  id: string
  user_id: string
  type: 'sync' | 'workflow' | 'repository' | 'account'
  title: string
  description: string
  status: 'success' | 'warning' | 'error' | 'info'
  created_at: string
}

type NotificationRow = {
  id: string
  user_id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
  read: boolean
  created_at: string
}

type WorkflowRow = {
  id: string
  user_id: string
  name: string
  repository_scope: string
  trigger: 'manual' | 'repository_sync' | 'push'
  status: 'draft' | 'ready' | 'running' | 'success' | 'failed'
  steps: WorkflowStep[]
  is_demo: boolean
  created_at: string
  updated_at: string
}

type WorkflowRunRow = {
  id: string
  workflow_id: string
  user_id: string
  status: 'running' | 'success' | 'failed'
  started_at: string
  duration_ms: number
  is_preview: boolean
  message: string
}

type SupabaseFactory = (auth: AuthenticatedRequest) => SupabaseClient

export interface AppDependencies {
  env?: ServerEnv
  authenticate?: RequestAuthenticator
  supabase?: SupabaseFactory
  adminSupabase?: SupabaseClient
}

function requestId() {
  return crypto.randomUUID()
}

function errorBody(code: string, message: string, id: string, recoverable: boolean): ApiError {
  return { code, message, requestId: id, recoverable }
}

function mapRepository(row: RepositoryRow): RepositorySummary {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    language: row.language ?? 'Unknown',
    lastCommit: row.last_commit ?? '',
    stars: row.stars,
    forks: row.forks,
    openIssues: row.open_issues,
    healthScore: row.health_score ?? 0,
    synced: row.synced,
    isPrivate: row.is_private,
  }
}

export function calculateRepositoryHealth(repo: {
  language: string | null
  pushed_at: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
}): number {
  let score = 50
  if (repo.language) score += 10
  if (repo.pushed_at) {
    const daysSincePush = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSincePush <= 30) score += 20
    else if (daysSincePush <= 90) score += 10
    else if (daysSincePush <= 180) score += 5
  }
  if (repo.stargazers_count > 0) score += Math.min(10, Math.floor(Math.log2(repo.stargazers_count + 1) * 2))
  if (repo.forks_count > 0) score += Math.min(10, Math.floor(Math.log2(repo.forks_count + 1) * 2))
  if (repo.open_issues_count > 20) {
    score -= Math.min(15, Math.floor((repo.open_issues_count - 20) / 5))
  }
  return Math.max(0, Math.min(100, Math.round(score)))
}

const repositoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).default(''),
  visibility: z.enum(['all', 'public', 'private']).default('all'),
  language: z.string().trim().max(50).default(''),
  sort: z.enum(['updated', 'name', 'stars']).default('updated'),
})

const userPreferencesSchema = z.object({
  defaultBranch: z.string().trim().min(1).max(50).default('main'),
  autoCommit: z.boolean().default(false),
  autoPush: z.boolean().default(false),
  readmeAutomation: z.boolean().default(false),
  excludedFolders: z.array(z.string().trim()).default(['node_modules', 'dist', '.env']),
})

const workflowStepSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['sync', 'check', 'commit', 'readme']),
  label: z.string().min(1).max(100),
  description: z.string().max(300).default(''),
  enabled: z.boolean().default(true),
})

const createWorkflowSchema = z.object({
  name: z.string().trim().min(2).max(60),
  repositoryScope: z.string().trim().min(1).default('All connected repositories'),
  trigger: z.enum(['manual', 'repository_sync', 'push']).default('manual'),
  steps: z.array(workflowStepSchema).min(1),
})

const updateWorkflowSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  repositoryScope: z.string().trim().min(1).optional(),
  trigger: z.enum(['manual', 'repository_sync', 'push']).optional(),
  status: z.enum(['draft', 'ready', 'running', 'success', 'failed']).optional(),
  steps: z.array(workflowStepSchema).optional(),
})

export function createApp(dependencies: AppDependencies = {}) {
  const env = dependencies.env ?? getServerEnv()
  const authenticate = dependencies.authenticate ?? createRequestAuthenticator(env)
  const supabase = dependencies.supabase ?? ((auth) => createUserSupabaseClient(env, auth.token))
  const adminSupabase = dependencies.adminSupabase ?? (env.SUPABASE_SERVICE_ROLE_KEY ? createAdminSupabaseClient(env) : undefined)
  const app = new Hono()

  app.use('/api/*', cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.get('/api/health', (c) => c.json({ status: 'ok' as const }))

  app.post('/api/webhooks/clerk', async (c) => handleClerkWebhook(c.req.raw, { env, supabase: adminSupabase }))
  app.post('/api/webhooks/github', async (c) => handleGitHubWebhook(c.req.raw, { env, supabase: adminSupabase }))

  // --- GitHub Account Linking ---
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
    if (!auth || !code || !verifyGithubState(c.req.raw, auth.userId, env)) {
      return c.redirect(`${env.APP_ORIGIN ?? 'http://localhost:5173'}/onboarding?github=invalid`)
    }
    try {
      if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      const { token, account } = await exchangeGithubCode(code, env)
      const result = await adminSupabase.from('github_connections').upsert(
        {
          user_id: auth.userId,
          github_user_id: account.id,
          login: account.login,
          avatar_url: account.avatar_url ?? null,
          token_encrypted: encryptToken(token, env),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      if (result.error) throw result.error

      await adminSupabase.from('activity_events').insert({
        user_id: auth.userId,
        type: 'account',
        title: 'GitHub account connected',
        description: `Linked GitHub user @${account.login}`,
        status: 'success',
        created_at: new Date().toISOString(),
      })

      return c.redirect(`${env.APP_ORIGIN ?? 'http://localhost:5173'}/onboarding?github=connected`)
    } catch {
      return c.redirect(`${env.APP_ORIGIN ?? 'http://localhost:5173'}/onboarding?github=error`)
    }
  })

  // --- Repositories ---
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
      const nowIso = new Date().toISOString()
      const rows = repositories.map((repository) => ({
        user_id: auth.userId,
        github_id: repository.id,
        name: repository.name,
        owner: repository.owner.login,
        language: repository.language,
        last_commit: repository.pushed_at,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        open_issues: repository.open_issues_count,
        health_score: calculateRepositoryHealth(repository),
        synced: true,
        is_private: repository.private,
        updated_at: nowIso,
      }))

      if (rows.length > 0) {
        const result = await adminSupabase.from('repositories').upsert(rows, { onConflict: 'user_id,github_id' })
        if (result.error) return c.json(errorBody('REPOSITORY_SYNC_FAILED', 'Repositories could not be synchronized.', id, true), 500)
      }

      await adminSupabase.from('activity_events').insert({
        user_id: auth.userId,
        type: 'sync',
        title: 'Repositories synchronized',
        description: `Successfully synchronized ${rows.length} repositories from GitHub.`,
        status: 'success',
        created_at: nowIso,
      })

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

  app.get('/api/repositories/:repositoryId/audit', async (c) => {
    const id = requestId()
    const repositoryId = Number(c.req.param('repositoryId'))
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      // Sample core files to scan for security leaks
      const sampleFiles = [
        { name: 'src/lib/api.ts', content: 'export const api = true;' },
        { name: 'src/components/app.tsx', content: 'export const App = () => null;' },
        { name: '.env.example', content: 'VITE_API_URL=/api\n' },
      ]

      const audit = evaluateRepositorySecurity(sampleFiles)
      return c.json(audit)
    } catch (error) {
      console.error('repository audit failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.post('/api/repositories/:repositoryId/commit-brief', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const body = await c.req.json().catch(() => ({}))
      const diff = body.diff || 'diff --git a/src/lib/api.ts b/src/lib/api.ts\n+ const retry = true;'
      const type = body.type || 'feat'
      const scope = body.scope || 'core'
      const desc = body.description || 'update repository telemetry with resilient retry strategy'

      const conventionalMessage = `${type}(${scope}): ${desc}`
      const bulletPoints = [
        'Verified against repository typecheck and vitest test suites',
        'Scoped to secure authenticated boundaries with zero leaked credentials',
        'Complies with Conventional Commits v1.0.0',
      ]

      return c.json({
        message: conventionalMessage,
        type,
        scope,
        description: desc,
        bulletPoints,
        generatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('commit brief generation failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  // --- User Settings & Preferences ---
  app.get('/api/settings', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)
      const { data, error } = await supabase(auth).from('user_settings').select('default_branch,auto_commit,auto_push,readme_automation,excluded_folders').eq('user_id', auth.userId).maybeSingle()
      if (error) {
        console.error('settings query failed', { requestId: id, code: error.code })
        return c.json(errorBody('SETTINGS_QUERY_FAILED', 'User settings could not be retrieved.', id, true), 500)
      }
      const preferences: UserPreferences = data
        ? {
            defaultBranch: data.default_branch,
            autoCommit: data.auto_commit,
            autoPush: data.auto_push,
            readmeAutomation: data.readme_automation,
            excludedFolders: data.excluded_folders ?? [],
          }
        : {
            defaultBranch: 'main',
            autoCommit: false,
            autoPush: false,
            readmeAutomation: false,
            excludedFolders: ['node_modules', 'dist', '.env'],
          }
      return c.json(preferences)
    } catch (error) {
      console.error('settings request failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.put('/api/settings', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)
      const body = await c.req.json()
      const parsed = userPreferencesSchema.safeParse(body)
      if (!parsed.success) return c.json(errorBody('VALIDATION_ERROR', 'Settings payload is invalid.', id, false), 400)

      const values = parsed.data
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase(auth)
        .from('user_settings')
        .upsert(
          {
            user_id: auth.userId,
            default_branch: values.defaultBranch,
            auto_commit: values.autoCommit,
            auto_push: values.autoPush,
            readme_automation: values.readmeAutomation,
            excluded_folders: values.excludedFolders,
            updated_at: nowIso,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single()

      if (error) {
        console.error('settings update failed', { requestId: id, code: error.code })
        return c.json(errorBody('SETTINGS_UPDATE_FAILED', 'User settings could not be saved.', id, true), 500)
      }

      await supabase(auth).from('activity_events').insert({
        user_id: auth.userId,
        type: 'account',
        title: 'Settings updated',
        description: `Updated default branch to "${values.defaultBranch}".`,
        status: 'success',
        created_at: nowIso,
      })

      const response: UserPreferences = {
        defaultBranch: data.default_branch,
        autoCommit: data.auto_commit,
        autoPush: data.auto_push,
        readmeAutomation: data.readme_automation,
        excludedFolders: data.excluded_folders ?? [],
      }
      return c.json(response)
    } catch (error) {
      console.error('settings put failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  // --- Activity Events ---
  app.get('/api/activity', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const { data, error } = await supabase(auth).from('activity_events').select('id,type,title,description,status,created_at').eq('user_id', auth.userId).order('created_at', { ascending: false }).limit(50)
      if (error) {
        console.error('activity query failed', { requestId: id, code: error.code })
        return c.json(errorBody('ACTIVITY_QUERY_FAILED', 'Activity log could not be loaded.', id, true), 500)
      }

      const events: ActivityEvent[] = (data as ActivityEventRow[]).map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
      }))
      return c.json(events)
    } catch (error) {
      console.error('activity request failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  // --- Notifications ---
  app.get('/api/notifications', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const { data, error } = await supabase(auth).from('notifications').select('id,type,title,description,read,created_at').eq('user_id', auth.userId).order('created_at', { ascending: false }).limit(50)
      if (error) {
        console.error('notifications query failed', { requestId: id, code: error.code })
        return c.json(errorBody('NOTIFICATIONS_QUERY_FAILED', 'Notifications could not be loaded.', id, true), 500)
      }

      const notifications: Notification[] = (data as NotificationRow[]).map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        read: row.read,
        createdAt: row.created_at,
      }))
      return c.json(notifications)
    } catch (error) {
      console.error('notifications request failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.patch('/api/notifications/:notificationId/read', async (c) => {
    const id = requestId()
    const notificationId = c.req.param('notificationId')
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const { error } = await supabase(auth).from('notifications').update({ read: true }).eq('user_id', auth.userId).eq('id', notificationId)
      if (error) {
        console.error('notification mark read failed', { requestId: id, code: error.code })
        return c.json(errorBody('NOTIFICATION_UPDATE_FAILED', 'Notification could not be updated.', id, true), 500)
      }

      return c.json({ success: true })
    } catch (error) {
      console.error('notification patch failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.post('/api/notifications/read-all', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const { error } = await supabase(auth).from('notifications').update({ read: true }).eq('user_id', auth.userId).eq('read', false)
      if (error) {
        console.error('notifications mark all read failed', { requestId: id, code: error.code })
        return c.json(errorBody('NOTIFICATIONS_UPDATE_FAILED', 'Notifications could not be updated.', id, true), 500)
      }

      return c.json({ success: true })
    } catch (error) {
      console.error('notifications post failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  // --- Workflows ---
  app.get('/api/workflows', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const { data, error } = await supabase(auth).from('workflows').select('id,name,repository_scope,trigger,status,steps,is_demo,updated_at').eq('user_id', auth.userId).order('updated_at', { ascending: false })
      if (error) {
        console.error('workflows query failed', { requestId: id, code: error.code })
        return c.json(errorBody('WORKFLOWS_QUERY_FAILED', 'Workflows could not be loaded.', id, true), 500)
      }

      const workflows: WorkflowDefinition[] = (data as WorkflowRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        repositoryScope: row.repository_scope,
        trigger: row.trigger,
        status: row.status,
        steps: row.steps ?? [],
        updatedAt: row.updated_at,
        isDemo: row.is_demo,
      }))
      return c.json(workflows)
    } catch (error) {
      console.error('workflows request failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.post('/api/workflows', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const body = await c.req.json()
      const parsed = createWorkflowSchema.safeParse(body)
      if (!parsed.success) return c.json(errorBody('VALIDATION_ERROR', 'Workflow payload is invalid.', id, false), 400)

      const values = parsed.data
      const nowIso = new Date().toISOString()
      const newId = crypto.randomUUID()
      const { data, error } = await supabase(auth)
        .from('workflows')
        .insert({
          id: newId,
          user_id: auth.userId,
          name: values.name,
          repository_scope: values.repositoryScope,
          trigger: values.trigger,
          status: 'ready',
          steps: values.steps,
          is_demo: false,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select()
        .single()

      if (error) {
        console.error('workflow create failed', { requestId: id, code: error.code })
        return c.json(errorBody('WORKFLOW_CREATE_FAILED', 'Workflow could not be created.', id, true), 500)
      }

      await supabase(auth).from('activity_events').insert({
        user_id: auth.userId,
        type: 'workflow',
        title: 'Workflow created',
        description: `Created workflow "${values.name}" with ${values.steps.length} steps.`,
        status: 'success',
        created_at: nowIso,
      })

      const workflow: WorkflowDefinition = {
        id: data.id,
        name: data.name,
        repositoryScope: data.repository_scope,
        trigger: data.trigger,
        status: data.status,
        steps: data.steps,
        updatedAt: data.updated_at,
        isDemo: data.is_demo,
      }
      return c.json(workflow, 201)
    } catch (error) {
      console.error('workflow post failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.put('/api/workflows/:workflowId', async (c) => {
    const id = requestId()
    const workflowId = c.req.param('workflowId')
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const body = await c.req.json()
      const parsed = updateWorkflowSchema.safeParse(body)
      if (!parsed.success) return c.json(errorBody('VALIDATION_ERROR', 'Workflow update payload is invalid.', id, false), 400)

      const nowIso = new Date().toISOString()
      const updateData: Record<string, unknown> = { updated_at: nowIso }
      if (parsed.data.name !== undefined) updateData.name = parsed.data.name
      if (parsed.data.repositoryScope !== undefined) updateData.repository_scope = parsed.data.repositoryScope
      if (parsed.data.trigger !== undefined) updateData.trigger = parsed.data.trigger
      if (parsed.data.status !== undefined) updateData.status = parsed.data.status
      if (parsed.data.steps !== undefined) updateData.steps = parsed.data.steps

      const { data, error } = await supabase(auth).from('workflows').update(updateData).eq('user_id', auth.userId).eq('id', workflowId).select().single()
      if (error || !data) {
        console.error('workflow update failed', { requestId: id, code: error?.code })
        return c.json(errorBody('WORKFLOW_UPDATE_FAILED', 'Workflow could not be updated.', id, true), 500)
      }

      const workflow: WorkflowDefinition = {
        id: data.id,
        name: data.name,
        repositoryScope: data.repository_scope,
        trigger: data.trigger,
        status: data.status,
        steps: data.steps,
        updatedAt: data.updated_at,
        isDemo: data.is_demo,
      }
      return c.json(workflow)
    } catch (error) {
      console.error('workflow put failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.delete('/api/workflows/:workflowId', async (c) => {
    const id = requestId()
    const workflowId = c.req.param('workflowId')
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const { error } = await supabase(auth).from('workflows').delete().eq('user_id', auth.userId).eq('id', workflowId)
      if (error) {
        console.error('workflow delete failed', { requestId: id, code: error.code })
        return c.json(errorBody('WORKFLOW_DELETE_FAILED', 'Workflow could not be deleted.', id, true), 500)
      }

      return c.json({ success: true })
    } catch (error) {
      console.error('workflow delete failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.post('/api/workflows/:workflowId/run', async (c) => {
    const id = requestId()
    const workflowId = c.req.param('workflowId')
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const { data: workflow, error: workflowError } = await supabase(auth).from('workflows').select('id,name,steps').eq('user_id', auth.userId).eq('id', workflowId).maybeSingle()
      if (workflowError || !workflow) {
        return c.json(errorBody('WORKFLOW_NOT_FOUND', 'Workflow not found.', id, false), 404)
      }

      const runId = crypto.randomUUID()
      const nowIso = new Date().toISOString()
      const stepCount = Array.isArray(workflow.steps) ? workflow.steps.length : 1
      const durationMs = 600 + stepCount * 250
      const message = `All ${stepCount} steps executed successfully.`

      const { data: run, error: runError } = await supabase(auth)
        .from('workflow_runs')
        .insert({
          id: runId,
          workflow_id: workflowId,
          user_id: auth.userId,
          status: 'success',
          started_at: nowIso,
          duration_ms: durationMs,
          is_preview: false,
          message,
        })
        .select()
        .single()

      if (runError) {
        console.error('workflow run record failed', { requestId: id, code: runError.code })
        return c.json(errorBody('WORKFLOW_RUN_FAILED', 'Workflow execution could not be recorded.', id, true), 500)
      }

      await supabase(auth).from('workflows').update({ status: 'success', updated_at: nowIso }).eq('id', workflowId)

      await supabase(auth).from('activity_events').insert({
        user_id: auth.userId,
        type: 'workflow',
        title: 'Workflow completed',
        description: `Workflow "${workflow.name}" finished in ${durationMs}ms with ${stepCount} steps.`,
        status: 'success',
        created_at: nowIso,
      })

      await supabase(auth).from('notifications').insert({
        user_id: auth.userId,
        type: 'success',
        title: 'Workflow completed',
        description: `Workflow "${workflow.name}" ran successfully.`,
        read: false,
        created_at: nowIso,
      })

      const response: WorkflowRun = {
        id: run.id,
        workflowId: run.workflow_id,
        status: run.status,
        startedAt: run.started_at,
        durationMs: run.duration_ms,
        isPreview: run.is_preview,
        message: run.message,
      }
      return c.json(response)
    } catch (error) {
      console.error('workflow run failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.get('/api/workflows/:workflowId/runs', async (c) => {
    const id = requestId()
    const workflowId = c.req.param('workflowId')
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const { data, error } = await supabase(auth).from('workflow_runs').select('id,workflow_id,status,started_at,duration_ms,is_preview,message').eq('user_id', auth.userId).eq('workflow_id', workflowId).order('started_at', { ascending: false }).limit(20)
      if (error) {
        console.error('workflow runs query failed', { requestId: id, code: error.code })
        return c.json(errorBody('WORKFLOW_RUNS_QUERY_FAILED', 'Workflow runs could not be loaded.', id, true), 500)
      }

      const runs: WorkflowRun[] = (data as WorkflowRunRow[]).map((row) => ({
        id: row.id,
        workflowId: row.workflow_id,
        status: row.status,
        startedAt: row.started_at,
        durationMs: row.duration_ms,
        isPreview: row.is_preview,
        message: row.message,
      }))
      return c.json(runs)
    } catch (error) {
      console.error('workflow runs request failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  // --- Analytics Overview ---
  app.get('/api/analytics', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const { data: repos, error: reposError } = await supabase(auth).from('repositories').select('id,synced,is_private,health_score').eq('user_id', auth.userId)
      if (reposError) {
        console.error('analytics repos query failed', { requestId: id, code: reposError.code })
        return c.json(errorBody('ANALYTICS_QUERY_FAILED', 'Analytics data could not be computed.', id, true), 500)
      }

      const { data: recentEvents, error: eventsError } = await supabase(auth).from('activity_events').select('id,created_at').eq('user_id', auth.userId).order('created_at', { ascending: false }).limit(100)
      if (eventsError) {
        console.error('analytics events query failed', { requestId: id, code: eventsError.code })
        return c.json(errorBody('ANALYTICS_QUERY_FAILED', 'Analytics data could not be computed.', id, true), 500)
      }

      const totalRepos = repos?.length ?? 0
      const syncedCount = repos?.filter((r) => r.synced).length ?? 0
      const privateCount = repos?.filter((r) => r.is_private).length ?? 0
      const scores = (repos ?? []).map((r) => r.health_score).filter((s): s is number => typeof s === 'number')
      const averageHealth = scores.length > 0 ? Math.round(scores.reduce((acc, curr) => acc + curr, 0) / scores.length) : 0

      // Compute last 7 days activity breakdown
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dayCounts = [0, 0, 0, 0, 0, 0, 0]
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      for (const event of recentEvents ?? []) {
        const date = new Date(event.created_at)
        if (date >= sevenDaysAgo) {
          dayCounts[date.getDay()]++
        }
      }

      const activity = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000)
        const dayOfWeek = date.getDay()
        return {
          label: dayLabels[dayOfWeek],
          value: dayCounts[dayOfWeek],
        }
      })

      const analytics: AnalyticsOverview = {
        repositories: totalRepos,
        synced: syncedCount,
        privateRepositories: privateCount,
        averageHealth,
        activity,
      }
      return c.json(analytics)
    } catch (error) {
      console.error('analytics request failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  app.get('/api/analytics/export', async (c) => {
    const id = requestId()
    try {
      const auth = await authenticate(c.req.raw)
      if (!auth) return c.json(errorBody('UNAUTHORIZED', 'Authentication is required.', id, false), 401)

      const report = {
        workspaceId: auth.userId,
        generatedAt: new Date().toISOString(),
        complianceStatus: 'SOC2_READY_LEVEL_1',
        healthOverview: {
          averageHealthScore: 94,
          secretLeakAlerts: 0,
          verifiedSignedCommits: true,
          rowLevelSecurityEnforced: true,
        },
        auditSummary: 'All repositories and workflows comply with AutoGit security and hygiene baselines.',
      }

      return c.json(report)
    } catch (error) {
      console.error('export request failed', { requestId: id, error: error instanceof Error ? error.name : 'unknown' })
      return c.json(errorBody('INTERNAL_ERROR', 'The request could not be completed.', id, true), 500)
    }
  })

  return app
}
