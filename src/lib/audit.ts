import { useMutation, useQuery } from '@tanstack/react-query'
import type { SecurityAuditResult } from '../../server/security'
import { ApiRequestError, apiRequest } from './api'
import { useAppAuth } from './auth'

export const auditQueryKey = ['audit'] as const

export function useRepositoryAudit(repositoryId: string | number | undefined) {
  const { configured, session, getToken } = useAppAuth()
  return useQuery({
    queryKey: [...auditQueryKey, session?.id ?? 'signed-out', repositoryId],
    enabled: configured && Boolean(session) && Boolean(repositoryId),
    retry: false,
    queryFn: async () => {
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<SecurityAuditResult>(`/repositories/${encodeURIComponent(String(repositoryId))}/audit`, { accessToken })
    },
  })
}

export function useGenerateCommitBrief() {
  const { configured, session, getToken } = useAppAuth()
  return useMutation({
    mutationFn: async ({ repositoryId, diff, type, scope, description }: { repositoryId: string | number; diff?: string; type?: string; scope?: string; description?: string }) => {
      if (!configured || !session) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<{ message: string; bulletPoints: string[] }>(`/repositories/${encodeURIComponent(String(repositoryId))}/commit-brief`, {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ diff, type, scope, description }),
      })
    },
  })
}

export function useExportComplianceReport() {
  const { configured, session, getToken } = useAppAuth()
  return useMutation({
    mutationFn: async () => {
      if (!configured || !session) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<{ workspaceId: string; generatedAt: string; complianceStatus: string; healthOverview: Record<string, unknown> }>('/analytics/export', { accessToken })
    },
  })
}
