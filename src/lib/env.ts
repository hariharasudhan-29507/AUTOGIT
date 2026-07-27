import { z } from 'zod'

const publicEnvSchema = z.object({
  VITE_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  VITE_API_URL: z.string().url().optional(),
})

export const env = publicEnvSchema.parse({
  VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  VITE_API_URL: import.meta.env.VITE_API_URL,
})

export const isClerkConfigured = Boolean(env.VITE_CLERK_PUBLISHABLE_KEY)
