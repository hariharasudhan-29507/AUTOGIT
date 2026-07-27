import { env } from './env'
import type { ApiError } from '@/types'

export class ApiRequestError extends Error {
  constructor(public readonly details: ApiError) { super(details.message); this.name = 'ApiRequestError' }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.VITE_API_URL ?? '/api'}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    const details = await response.json().catch(() => ({ code: 'UNKNOWN_ERROR', message: 'Something went wrong.', recoverable: response.status < 500 })) as ApiError
    throw new ApiRequestError(details)
  }
  return response.json() as Promise<T>
}
