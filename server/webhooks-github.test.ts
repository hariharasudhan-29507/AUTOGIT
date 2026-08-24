import { describe, expect, it } from 'vitest'
import crypto from 'node:crypto'
import { verifyGitHubWebhookSignature, handleGitHubWebhook } from './webhooks-github'
import type { ServerEnv } from './config'

const testEnv: ServerEnv = {
  CLERK_SECRET_KEY: 'test-key',
  CLERK_PUBLISHABLE_KEY: 'pk_test_123',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_pub_123',
  GITHUB_WEBHOOK_SECRET: 'my-super-secret-webhook-key',
  CORS_ORIGIN: 'http://localhost:5173',
}

describe('GitHub Webhooks Processor', () => {
  it('validates authentic HMAC-SHA256 signatures', () => {
    const secret = 'my-super-secret-webhook-key'
    const body = JSON.stringify({ zen: 'Mind your words, please.' })
    const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex')
    const header = `sha256=${hmac}`

    expect(verifyGitHubWebhookSignature(body, header, secret)).toBe(true)
  })

  it('rejects tampered or mismatched webhook signatures', () => {
    const secret = 'my-super-secret-webhook-key'
    const body = JSON.stringify({ zen: 'Tampered content' })
    const invalidHeader = 'sha256=1111222233334444555566667777888899990000111122223333444455556666'

    expect(verifyGitHubWebhookSignature(body, invalidHeader, secret)).toBe(false)
  })

  it('handles ping event successfully', async () => {
    const payload = JSON.stringify({ zen: 'Approachable is better than simple.' })
    const hmac = crypto.createHmac('sha256', testEnv.GITHUB_WEBHOOK_SECRET!).update(payload).digest('hex')

    const request = new Request('http://localhost/api/webhooks/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-github-event': 'ping',
        'x-hub-signature-256': `sha256=${hmac}`,
      },
      body: payload,
    })

    const response = await handleGitHubWebhook(request, { env: testEnv })
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.status).toBe('ok')
  })
})
