import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Notification } from '@/types'
import { ApiRequestError, apiRequest } from './api'
import { useAppAuth } from './auth'

export const notificationsQueryKey = ['notifications'] as const

export function useNotifications() {
  const { configured, session, getToken } = useAppAuth()
  return useQuery({
    queryKey: [...notificationsQueryKey, session?.id ?? 'signed-out'],
    enabled: configured && Boolean(session),
    retry: false,
    queryFn: async () => {
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<Notification[]>('/notifications', { accessToken })
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const { configured, session, getToken } = useAppAuth()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!configured || !session) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<{ success: boolean }>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: 'PATCH',
        accessToken,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  const { configured, session, getToken } = useAppAuth()
  return useMutation({
    mutationFn: async () => {
      if (!configured || !session) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<{ success: boolean }>('/notifications/read-all', {
        method: 'POST',
        accessToken,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    },
  })
}
