import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PaginatedResponse, RepositoryDetail, RepositoryListFilters, RepositorySummary } from '@/types'
import { ApiRequestError, apiRequest } from './api'
import { useAppAuth } from './auth'

export const repositoriesQueryKey = ['repositories'] as const

export function useRepositories(filters: RepositoryListFilters) {
  const { configured, session, getToken } = useAppAuth()
  return useQuery({
    queryKey: [...repositoriesQueryKey, session?.id ?? 'signed-out', filters],
    enabled: configured && Boolean(session),
    retry: false,
    queryFn: async () => {
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize), sort: filters.sort })
      if (filters.search) params.set('search', filters.search)
      if (filters.visibility !== 'all') params.set('visibility', filters.visibility)
      if (filters.language) params.set('language', filters.language)
      return apiRequest<PaginatedResponse<RepositorySummary>>(`/repositories?${params.toString()}`, { accessToken })
    },
  })
}

export function useRepository(id: string | undefined) {
  const { configured, session, getToken } = useAppAuth()
  return useQuery({
    queryKey: [...repositoriesQueryKey, 'detail', session?.id ?? 'signed-out', id],
    enabled: configured && Boolean(session) && Boolean(id),
    retry: false,
    queryFn: async () => {
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<RepositoryDetail>(`/repositories/${encodeURIComponent(id!)}`, { accessToken })
    },
  })
}

export function useSyncRepositories() {
  const queryClient = useQueryClient()
  const { configured, session, getToken } = useAppAuth()
  return useMutation({
    mutationFn: async () => {
      if (!configured || !session) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<{ synced: number }>('/repositories/sync', { method: 'POST', accessToken })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: repositoriesQueryKey })
      await queryClient.invalidateQueries({ queryKey: ['github-status'] })
    },
  })
}

export function useGithubStatus() {
  const { configured, session, getToken } = useAppAuth()
  return useQuery({
    queryKey: ['github-status', session?.id ?? 'signed-out'],
    enabled: configured && Boolean(session),
    retry: false,
    queryFn: async () => {
      const accessToken = await getToken()
      if (!accessToken) return { connected: false, login: null, avatarUrl: null, syncedAt: null }
      return apiRequest<{ connected: boolean; login: string | null; avatarUrl: string | null; syncedAt: string | null }>('/github/status', { accessToken })
    },
  })
}
