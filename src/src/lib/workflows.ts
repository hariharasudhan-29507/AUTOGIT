import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { WorkflowDefinition, WorkflowRun, WorkflowStep, WorkflowTrigger } from '@/types'
import { ApiRequestError, apiRequest } from './api'
import { useAppAuth } from './auth'
import { activityQueryKey } from './activity'
import { notificationsQueryKey } from './notifications'

export const workflowsQueryKey = ['workflows'] as const

export function useWorkflows() {
  const { configured, session, getToken } = useAppAuth()
  return useQuery({
    queryKey: [...workflowsQueryKey, session?.id ?? 'signed-out'],
    enabled: configured && Boolean(session),
    retry: false,
    queryFn: async () => {
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<WorkflowDefinition[]>('/workflows', { accessToken })
    },
  })
}

export function useWorkflowRuns(workflowId: string | undefined) {
  const { configured, session, getToken } = useAppAuth()
  return useQuery({
    queryKey: [...workflowsQueryKey, 'runs', session?.id ?? 'signed-out', workflowId],
    enabled: configured && Boolean(session) && Boolean(workflowId),
    retry: false,
    queryFn: async () => {
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<WorkflowRun[]>(`/workflows/${encodeURIComponent(workflowId!)}/runs`, { accessToken })
    },
  })
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  const { configured, session, getToken } = useAppAuth()
  return useMutation({
    mutationFn: async (input: { name: string; repositoryScope: string; trigger: WorkflowTrigger; steps: WorkflowStep[] }) => {
      if (!configured || !session) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<WorkflowDefinition>('/workflows', {
        method: 'POST',
        accessToken,
        body: JSON.stringify(input),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey })
      await queryClient.invalidateQueries({ queryKey: activityQueryKey })
    },
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()
  const { configured, session, getToken } = useAppAuth()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; repositoryScope?: string; trigger?: WorkflowTrigger; status?: WorkflowDefinition['status']; steps?: WorkflowStep[] }) => {
      if (!configured || !session) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<WorkflowDefinition>(`/workflows/${encodeURIComponent(id)}`, {
        method: 'PUT',
        accessToken,
        body: JSON.stringify(input),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey })
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  const { configured, session, getToken } = useAppAuth()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!configured || !session) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<{ success: boolean }>(`/workflows/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        accessToken,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey })
      await queryClient.invalidateQueries({ queryKey: activityQueryKey })
    },
  })
}

export function useRunWorkflow() {
  const queryClient = useQueryClient()
  const { configured, session, getToken } = useAppAuth()
  return useMutation({
    mutationFn: async (workflowId: string) => {
      if (!configured || !session) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      const accessToken = await getToken()
      if (!accessToken) throw new ApiRequestError({ code: 'UNAUTHORIZED', message: 'Authentication is required.', recoverable: false })
      return apiRequest<WorkflowRun>(`/workflows/${encodeURIComponent(workflowId)}/run`, {
        method: 'POST',
        accessToken,
      })
    },
    onSuccess: async (_data, workflowId) => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey })
      await queryClient.invalidateQueries({ queryKey: [...workflowsQueryKey, 'runs', session?.id ?? 'signed-out', workflowId] })
      await queryClient.invalidateQueries({ queryKey: activityQueryKey })
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    },
  })
}
