import { env } from './env'
import type { ApiError } from '@/types'

export class ApiRequestError extends Error {
  constructor(public readonly details: ApiError) { super(details.message); this.name = 'ApiRequestError' }
}

type ApiRequestInit = RequestInit & { accessToken?: string | null }

export async function apiRequest<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const { accessToken, ...requestInit } = init ?? {}
  const headers = new Headers(requestInit.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${env.VITE_API_URL ?? '/api'}${path}`, {
    ...requestInit,
    credentials: 'include',
    headers,
  })
  if (!response.ok) {
    const details = await response.json().catch(() => ({ code: 'UNKNOWN_ERROR', message: 'Something went wrong.', recoverable: response.status < 500 })) as ApiError
    throw new ApiRequestError(details)
  }
  return response.json() as Promise<T>
}
