import { Webhook } from 'svix'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServerEnv } from './config'
import { createAdminSupabaseClient } from './supabase'

type ClerkUserEvent = { type: string; data: { id: string; first_name?: string | null; last_name?: string | null; image_url?: string | null; email_addresses?: Array<{ email_address: string }>; primary_email_address_id?: string | null } }

type WebhookDependencies = { env: ServerEnv; supabase?: SupabaseClient }

function displayName(data: ClerkUserEvent['data']): string {
  const name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
  if (name) return name
  return data.email_addresses?.find((email) => email.email_address)?.email_address ?? data.id
}

export async function handleClerkWebhook(request: Request, dependencies: WebhookDependencies): Promise<Response> {
  if (!dependencies.env.CLERK_WEBHOOK_SIGNING_SECRET) return Response.json({ code: 'WEBHOOK_NOT_CONFIGURED', message: 'Clerk webhook signing secret is not configured.' }, { status: 503 })
  const payload = await request.text()
  const headers = { 'svix-id': request.headers.get('svix-id') ?? '', 'svix-timestamp': request.headers.get('svix-timestamp') ?? '', 'svix-signature': request.headers.get('svix-signature') ?? '' }
  let event: ClerkUserEvent
  try {
    event = new Webhook(dependencies.env.CLERK_WEBHOOK_SIGNING_SECRET).verify(payload, headers) as ClerkUserEvent
  } catch {
    return Response.json({ code: 'INVALID_WEBHOOK', message: 'Webhook signature could not be verified.' }, { status: 400 })
  }
  const supabase = dependencies.supabase ?? createAdminSupabaseClient(dependencies.env)
  if (event.type === 'user.deleted') {
    const result = await supabase.from('profiles').delete().eq('user_id', event.data.id)
    if (result.error) return Response.json({ code: 'PROFILE_DELETE_FAILED', message: 'Profile could not be removed.' }, { status: 500 })
  } else if (event.type === 'user.created' || event.type === 'user.updated') {
    const email = event.data.email_addresses?.find((item) => item.email_address)?.email_address
    if (!email) return Response.json({ code: 'PROFILE_EMAIL_MISSING', message: 'Clerk user has no email address.' }, { status: 422 })
    const result = await supabase.from('profiles').upsert({ user_id: event.data.id, email, display_name: displayName(event.data), avatar_url: event.data.image_url ?? null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (result.error) return Response.json({ code: 'PROFILE_SYNC_FAILED', message: 'Profile could not be synchronized.' }, { status: 500 })
  }
  return Response.json({ received: true })
}
