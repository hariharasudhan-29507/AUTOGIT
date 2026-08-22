import { useQuery } from '@tanstack/react-query'
import type { ActivityEvent } from '@/types'
import { ApiRequestError, apiRequest } from './api'
import { useAppAuth } from './auth'

export const activityQueryKey = ['activity'] as const

export function useActivity() {
  const { configured, session, getToken } = useAppAuth()
  return useQuery({
    queryKey: [...activityQueryKey, session?.id ?? 'signed-out'],
    enabled: configured && Boolean(session),
    retry: false,
    queryFn: async () => {
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<ActivityEvent[]>('/activity', { accessToken })
    },
  })
}
