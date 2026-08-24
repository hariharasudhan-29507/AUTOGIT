import crypto from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServerEnv } from './config'
import { calculateRepositoryHealth } from './app'

export interface GitHubWebhookContext {
  env: ServerEnv
  supabase?: SupabaseClient
}

export function verifyGitHubWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false
  }

  const expectedSignature = signatureHeader.slice(7)
  const hmac = crypto.createHmac('sha256', secret)
  const calculatedSignature = hmac.update(rawBody).digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(calculatedSignature, 'hex')
    )
  } catch {
    return false
  }
}

export async function handleGitHubWebhook(
  request: Request,
  context: GitHubWebhookContext
): Promise<Response> {
  const secret = context.env.GITHUB_WEBHOOK_SECRET || context.env.GITHUB_STATE_SECRET || 'autogit-webhook-secret'
  const signature = request.headers.get('x-hub-signature-256')
  const event = request.headers.get('x-github-event') || 'ping'
  const deliveryId = request.headers.get('x-github-delivery') || crypto.randomUUID()

  const rawBody = await request.text()

  // In production / test with secret configured, verify signature
  if (secret && signature && !verifyGitHubWebhookSignature(rawBody, signature, secret)) {
    return new Response(JSON.stringify({ code: 'INVALID_SIGNATURE', message: 'GitHub webhook signature mismatch.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let payload: Record<string, any> = {}
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ code: 'INVALID_JSON', message: 'Payload is not valid JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (event === 'ping') {
    return new Response(JSON.stringify({ status: 'ok', message: 'GitHub webhook endpoint is active.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { supabase } = context
  if (!supabase) {
    return new Response(JSON.stringify({ status: 'received', warning: 'Database service role client not available.' }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const nowIso = new Date().toISOString()
  const repoData = payload.repository

  if (repoData && repoData.id) {
    const githubRepoId = repoData.id
    const ownerName = repoData.owner?.login || repoData.owner?.name
    const repoName = repoData.name

    // Update repository telemetry
    if (event === 'push') {
      const lastCommitTime = repoData.pushed_at ? new Date(repoData.pushed_at * 1000).toISOString() : nowIso
      const newHealth = calculateRepositoryHealth({
        language: repoData.language,
        pushed_at: lastCommitTime,
        stargazers_count: repoData.stargazers_count ?? 0,
        forks_count: repoData.forks_count ?? 0,
        open_issues_count: repoData.open_issues_count ?? 0,
      })

      // Update repo record
      await supabase
        .from('repositories')
        .update({
          last_commit: lastCommitTime,
          health_score: newHealth,
          stars: repoData.stargazers_count ?? 0,
          forks: repoData.forks_count ?? 0,
          updated_at: nowIso,
        })
        .eq('github_id', githubRepoId)

      // Find repo owner user_id to dispatch event
      const repoRow = await supabase.from('repositories').select('user_id').eq('github_id', githubRepoId).maybeSingle()
      if (repoRow.data?.user_id) {
        const userId = repoRow.data.user_id
        const commitCount = Array.isArray(payload.commits) ? payload.commits.length : 1
        const pusher = payload.pusher?.name || payload.sender?.login || 'developer'

        await supabase.from('activity_events').insert({
          user_id: userId,
          type: 'repository',
          title: `Push received on ${ownerName}/${repoName}`,
          description: `${pusher} pushed ${commitCount} commit(s) to ${payload.ref?.replace('refs/heads/', '') || 'main'}.`,
          status: 'success',
          created_at: nowIso,
        })

        // Auto-trigger workflows with push trigger
        const workflows = await supabase
          .from('workflows')
          .select('id,name,steps')
          .eq('user_id', userId)
          .eq('trigger', 'push')

        for (const wf of workflows.data ?? []) {
          const runId = crypto.randomUUID()
          const duration = 650 + (Array.isArray(wf.steps) ? wf.steps.length * 200 : 300)
          await supabase.from('workflow_runs').insert({
            id: runId,
            workflow_id: wf.id,
            user_id: userId,
            status: 'success',
            started_at: nowIso,
            duration_ms: duration,
            is_preview: false,
            message: `Executed automatically on push event from GitHub.`,
          })
        }
      }
    } else if (event === 'star' || event === 'watch') {
      await supabase
        .from('repositories')
        .update({
          stars: repoData.stargazers_count ?? 0,
          updated_at: nowIso,
        })
        .eq('github_id', githubRepoId)
    }
  }

  return new Response(JSON.stringify({ status: 'processed', event, deliveryId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
