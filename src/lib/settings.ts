import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserPreferences } from '@/types'
import { ApiRequestError, apiRequest } from './api'
import { useAppAuth } from './auth'

export const settingsQueryKey = ['settings'] as const
export const activityQueryKey = ['activity'] as const

export function useSettings() {
  const { configured, session, getToken } = useAppAuth()
  return useQuery({
    queryKey: [...settingsQueryKey, session?.id ?? 'signed-out'],
    enabled: configured && Boolean(session),
    retry: false,
    queryFn: async () => {
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<UserPreferences>('/settings', { accessToken })
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  const { configured, session, getToken } = useAppAuth()
  return useMutation({
    mutationFn: async (input: UserPreferences) => {
      if (!configured || !session) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<UserPreferences>('/settings', {
        method: 'PUT',
        accessToken,
        body: JSON.stringify(input),
      })
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData([...settingsQueryKey, session?.id ?? 'signed-out'], updated)
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
      await queryClient.invalidateQueries({ queryKey: activityQueryKey })
    },
  })
}
