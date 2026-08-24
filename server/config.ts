import { z } from 'zod'

const serverEnvSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_WEBHOOK_SIGNING_SECRET: z.preprocess((value) => value === '' ? undefined : value, z.string().min(1).optional()),
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_REDIRECT_URI: z.string().url().optional(),
  GITHUB_STATE_SECRET: z.string().min(32).optional(),
  GITHUB_WEBHOOK_SECRET: z.string().min(1).optional(),
  TOKEN_ENCRYPTION_KEY: z.preprocess((value) => value === '' ? undefined : value, z.string().min(1).optional()),
  APP_ORIGIN: z.string().url().optional(),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function getServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  return serverEnvSchema.parse(source)
}




