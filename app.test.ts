import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createApp, calculateRepositoryHealth } from './server/app'
import type { ServerEnv } from './server/config'

const env: ServerEnv = {
  CLERK_SECRET_KEY: 'clerk-secret-for-test',
  CLERK_PUBLISHABLE_KEY: 'pk_test_example',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
  CORS_ORIGIN: 'http://localhost:5173',
}

function createMockSupabase(handlers: {
  selectHandler?: (table: string, columns?: string) => unknown
  insertHandler?: (table: string, values: unknown) => unknown
  updateHandler?: (table: string, values: unknown) => unknown
  deleteHandler?: (table: string) => unknown
  upsertHandler?: (table: string, values: unknown) => unknown
}) {
  return {
    from: (table: string) => {
      let isMutation = false
      let queryResult: { data: unknown; error: unknown; count?: number | null } = { data: [], error: null }

      const queryBuilder: Record<string, unknown> = {
        select: (columns?: string) => {
          if (!isMutation && handlers.selectHandler) {
            queryResult = handlers.selectHandler(table, columns) as { data: unknown; error: unknown }
          }
          return queryBuilder
        },
        insert: (values: unknown) => {
          isMutation = true
          if (handlers.insertHandler) {
            queryResult = handlers.insertHandler(table, values) as { data: unknown; error: unknown }
          }
          return queryBuilder
        },
        update: (values: unknown) => {
          isMutation = true
          if (handlers.updateHandler) {
            queryResult = handlers.updateHandler(table, values) as { data: unknown; error: unknown }
          }
          return queryBuilder
        },
        delete: () => {
          isMutation = true
          if (handlers.deleteHandler) {
            queryResult = handlers.deleteHandler(table) as { data: unknown; error: unknown }
          }
          return queryBuilder
        },
        upsert: (values: unknown) => {
          isMutation = true
          if (handlers.upsertHandler) {
            queryResult = handlers.upsertHandler(table, values) as { data: unknown; error: unknown }
          }
          return queryBuilder
        },
        eq: () => queryBuilder,
        or: () => queryBuilder,
        order: () => queryBuilder,
        range: async () => queryResult,
        limit: () => queryBuilder,
        single: async () => {
          if (Array.isArray(queryResult.data)) {
            return { data: queryResult.data[0] ?? null, error: queryResult.error }
          }
          return queryResult
        },
        maybeSingle: async () => {
          if (Array.isArray(queryResult.data)) {
            return { data: queryResult.data[0] ?? null, error: queryResult.error }
          }
          return queryResult
        },
      }

      // Allow calling directly as thenable
      queryBuilder.then = (resolve: (val: unknown) => unknown) => Promise.resolve(queryResult).then(resolve)

      return queryBuilder
    },
  } as unknown as SupabaseClient
}

describe('AutoGit Backend API', () => {
  const testAuth = { userId: 'user_test_123', token: 'clerk-token-abc' }

  describe('Public & Health', () => {
    it('returns a public health response', async () => {
      const response = await createApp({ env }).request('http://localhost/api/health')
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ status: 'ok' })
    })

    it('rejects unauthenticated requests to protected endpoints', async () => {
      const app = createApp({ env, authenticate: async () => null })
      const response = await app.request('http://localhost/api/repositories')
      expect(response.status).toBe(401)
      expect(await response.json()).toMatchObject({ code: 'UNAUTHORIZED', recoverable: false })
    })
  })

  describe('Repository Health Calculation', () => {
    it('calculates expected health scores based on repo metrics', () => {
      const highHealth = calculateRepositoryHealth({
        language: 'TypeScript',
        pushed_at: new Date().toISOString(),
        stargazers_count: 50,
        forks_count: 10,
        open_issues_count: 2,
      })
      expect(highHealth).toBeGreaterThanOrEqual(80)

      const staleRepo = calculateRepositoryHealth({
        language: null,
        pushed_at: '2020-01-01T00:00:00Z',
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 50,
      })
      expect(staleRepo).toBeLessThan(50)
    })
  })

  describe('Settings Endpoints', () => {
    it('returns default preferences when no user settings row exists', async () => {
      const app = createApp({
        env,
        authenticate: async () => testAuth,
        supabase: () =>
          createMockSupabase({
            selectHandler: () => ({ data: null, error: null }),
          }),
      })

      const res = await app.request('http://localhost/api/settings')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toMatchObject({
        defaultBranch: 'main',
        autoCommit: false,
        autoPush: false,
        readmeAutomation: false,
      })
    })

    it('updates user settings and logs an activity event', async () => {
      let savedSettings: unknown = null
      let activityInserted = false

      const app = createApp({
        env,
        authenticate: async () => testAuth,
        supabase: () =>
          createMockSupabase({
            upsertHandler: (_table, values) => {
              savedSettings = values
              return {
                data: {
                  default_branch: 'develop',
                  auto_commit: true,
                  auto_push: false,
                  readme_automation: true,
                  excluded_folders: ['build', 'tmp'],
                },
                error: null,
              }
            },
            insertHandler: (table) => {
              if (table === 'activity_events') activityInserted = true
              return { data: {}, error: null }
            },
          }),
      })

      const res = await app.request('http://localhost/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultBranch: 'develop',
          autoCommit: true,
          autoPush: false,
          readmeAutomation: true,
          excludedFolders: ['build', 'tmp'],
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.defaultBranch).toBe('develop')
      expect(data.autoCommit).toBe(true)
      expect(savedSettings).toMatchObject({ user_id: 'user_test_123', default_branch: 'develop' })
      expect(activityInserted).toBe(true)
    })
  })

  describe('Activity & Notifications Endpoints', () => {
    it('retrieves user activity events', async () => {
      const mockEvents = [
        {
          id: 'ev-1',
          type: 'sync',
          title: 'Repositories synchronized',
          description: 'Synced 5 repos',
          status: 'success',
          created_at: '2026-08-22T10:00:00Z',
        },
      ]

      const app = createApp({
        env,
        authenticate: async () => testAuth,
        supabase: () =>
          createMockSupabase({
            selectHandler: () => ({ data: mockEvents, error: null }),
          }),
      })

      const res = await app.request('http://localhost/api/activity')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({ id: 'ev-1', type: 'sync', title: 'Repositories synchronized' })
    })

    it('retrieves notifications and marks a notification as read', async () => {
      let updatedRead = false

      const app = createApp({
        env,
        authenticate: async () => testAuth,
        supabase: () =>
          createMockSupabase({
            selectHandler: () => ({
              data: [
                {
                  id: 'notif-1',
                  type: 'info',
                  title: 'New repository',
                  description: 'Added test-repo',
                  read: false,
                  created_at: '2026-08-22T12:00:00Z',
                },
              ],
              error: null,
            }),
            updateHandler: (_table, values) => {
              if ((values as Record<string, unknown>).read === true) updatedRead = true
              return { data: {}, error: null }
            },
          }),
      })

      const listRes = await app.request('http://localhost/api/notifications')
      expect(listRes.status).toBe(200)
      const list = await listRes.json()
      expect(list[0].id).toBe('notif-1')

      const patchRes = await app.request('http://localhost/api/notifications/notif-1/read', { method: 'PATCH' })
      expect(patchRes.status).toBe(200)
      expect(await patchRes.json()).toEqual({ success: true })
      expect(updatedRead).toBe(true)
    })
  })

  describe('Workflows Endpoints', () => {
    it('creates, lists, and executes a workflow run', async () => {
      let createdWorkflow: unknown = null
      let runRecorded = false

      const testWorkflow = {
        id: 'wf-123',
        user_id: 'user_test_123',
        name: 'Auto Branch Sync',
        repository_scope: 'All connected repositories',
        trigger: 'manual',
        status: 'ready',
        steps: [{ id: 'step-1', kind: 'sync', label: 'Sync Branches', description: 'Refresh git branches', enabled: true }],
        is_demo: false,
        created_at: '2026-08-22T00:00:00Z',
        updated_at: '2026-08-22T00:00:00Z',
      }

      const app = createApp({
        env,
        authenticate: async () => testAuth,
        supabase: () =>
          createMockSupabase({
            selectHandler: (table) => {
              if (table === 'workflows') return { data: [testWorkflow], error: null }
              return { data: [], error: null }
            },
            insertHandler: (table, values) => {
              if (table === 'workflows') {
                createdWorkflow = values
                return { data: { ...(values as Record<string, unknown>), id: 'wf-123', updated_at: '2026-08-22T00:00:00Z' }, error: null }
              }
              if (table === 'workflow_runs') {
                runRecorded = true
                return {
                  data: {
                    id: 'run-999',
                    workflow_id: 'wf-123',
                    status: 'success',
                    started_at: '2026-08-22T00:01:00Z',
                    duration_ms: 850,
                    is_preview: false,
                    message: 'All 1 steps executed successfully.',
                  },
                  error: null,
                }
              }
              return { data: {}, error: null }
            },
            updateHandler: () => ({ data: {}, error: null }),
          }),
      })

      // 1. Create Workflow
      const createRes = await app.request('http://localhost/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Auto Branch Sync',
          repositoryScope: 'All connected repositories',
          trigger: 'manual',
          steps: [{ id: 'step-1', kind: 'sync', label: 'Sync Branches', description: 'Refresh git branches', enabled: true }],
        }),
      })

      expect(createRes.status).toBe(201)
      const created = await createRes.json()
      expect(created.name).toBe('Auto Branch Sync')
      expect(createdWorkflow).toBeTruthy()

      // 2. List Workflows
      const listRes = await app.request('http://localhost/api/workflows')
      expect(listRes.status).toBe(200)
      const workflows = await listRes.json()
      expect(workflows).toHaveLength(1)
      expect(workflows[0].id).toBe('wf-123')

      // 3. Run Workflow
      const runRes = await app.request('http://localhost/api/workflows/wf-123/run', { method: 'POST' })
      expect(runRes.status).toBe(200)
      const run = await runRes.json()
      expect(run.status).toBe('success')
      expect(run.workflowId).toBe('wf-123')
      expect(runRecorded).toBe(true)
    })
  })

  describe('Analytics Endpoint', () => {
    it('computes workspace analytics from repositories and activity logs', async () => {
      const mockRepos = [
        { id: 1, synced: true, is_private: false, health_score: 90 },
        { id: 2, synced: true, is_private: true, health_score: 70 },
        { id: 3, synced: false, is_private: true, health_score: 80 },
      ]

      const app = createApp({
        env,
        authenticate: async () => testAuth,
        supabase: () =>
          createMockSupabase({
            selectHandler: (table) => {
              if (table === 'repositories') return { data: mockRepos, error: null }
              if (table === 'activity_events') return { data: [{ id: 'ev-1', created_at: new Date().toISOString() }], error: null }
              return { data: [], error: null }
            },
          }),
      })

      const res = await app.request('http://localhost/api/analytics')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.repositories).toBe(3)
      expect(data.synced).toBe(2)
      expect(data.privateRepositories).toBe(2)
      expect(data.averageHealth).toBe(80) // (90+70+80)/3
      expect(data.activity).toHaveLength(7)
    })
  })
})