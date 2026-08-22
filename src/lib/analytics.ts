import { useQuery } from '@tanstack/react-query'
import type { AnalyticsOverview } from '@/types'
import { ApiRequestError, apiRequest } from './api'
import { useAppAuth } from './auth'

export const analyticsQueryKey = ['analytics'] as const

export function useAnalytics() {
  const { configured, session, getToken } = useAppAuth()
  return useQuery({
    queryKey: [...analyticsQueryKey, session?.id ?? 'signed-out'],
    enabled: configured && Boolean(session),
    retry: false,
    queryFn: async () => {
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<AnalyticsOverview>('/analytics', { accessToken })
    },
  })
}
