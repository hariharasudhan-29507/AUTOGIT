import { useEffect, useState } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  ArrowLeft,
  BarChart3,
  Check,
  CheckCheck,
  CircleHelp,
  Clock3,
  GitBranch,
  Github,
  Info,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Workflow,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/ui'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useAppAuth } from '@/lib/auth'
import { useSettings, useUpdateSettings } from '@/lib/settings'
import { useActivity } from '@/lib/activity'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/lib/notifications'
import { useCreateWorkflow, useDeleteWorkflow, useRunWorkflow, useUpdateWorkflow, useWorkflowRuns, useWorkflows } from '@/lib/workflows'
import { useAnalytics } from '@/lib/analytics'
import type { ActivityEvent, Notification, WorkflowDefinition, WorkflowStep } from '@/types'

const defaultSteps: WorkflowStep[] = [
  { id: 'sync', kind: 'sync', label: 'Sync repository metadata', description: 'Refresh branches, commits, and health signals.', enabled: true },
  { id: 'check', kind: 'check', label: 'Check project health', description: 'Review the signals and open issues before moving on.', enabled: true },
  { id: 'readme', kind: 'readme', label: 'Review README coverage', description: 'Flag repositories that need clearer documentation.', enabled: true },
]

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === 'success' || status === 'ready' ? 'secondary' : status === 'failed' ? 'destructive' : 'outline'}>
      {status === 'success' ? 'Completed' : status[0].toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function SortableStep({ step, index }: { step: WorkflowStep; index: number }) {
  const sortable = useSortable({ id: step.id })
  const style = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }
  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={`flex items-start gap-3 rounded-lg border border-border bg-card p-4 ${
        sortable.isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
      }`}
    >
      <button type="button" className="mt-1 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted" aria-label={`Reorder step ${index + 1}`} {...sortable.attributes} {...sortable.listeners}>
        <ListChecks className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
          <p className="font-medium">{step.label}</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
      </div>
      <Check className="mt-1 size-4 text-primary" />
    </div>
  )
}

const workflowSchema = z.object({
  name: z.string().trim().min(3, 'Give this workflow a name.').max(60),
  repositoryScope: z.string().min(1),
  trigger: z.enum(['manual', 'repository_sync', 'push']),
})
type WorkflowForm = z.infer<typeof workflowSchema>

export function AutomationPage() {
  const { data: workflows = [], isLoading, error, refetch } = useWorkflows()
  const createMutation = useCreateWorkflow()
  const updateMutation = useUpdateWorkflow()
  const deleteMutation = useDeleteWorkflow()
  const runMutation = useRunWorkflow()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = workflows.find((w) => w.id === selectedId) ?? workflows[0] ?? null
  const [orderedSteps, setOrderedSteps] = useState<WorkflowStep[]>([])
  const [formOpen, setFormOpen] = useState(false)

  const { data: runs = [], isLoading: runsLoading } = useWorkflowRuns(selected?.id)

  useEffect(() => {
    if (selected) {
      setOrderedSteps(selected.steps)
    }
  }, [selected?.id, selected?.steps])

  const form = useForm<WorkflowForm>({
    resolver: zodResolver(workflowSchema),
    defaultValues: { name: '', repositoryScope: 'All connected repositories', trigger: 'manual' },
  })

  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !selected) return
    const reordered = arrayMove(
      orderedSteps,
      orderedSteps.findIndex((step) => step.id === active.id),
      orderedSteps.findIndex((step) => step.id === over.id)
    )
    setOrderedSteps(reordered)
    updateMutation.mutate(
      { id: selected.id, steps: reordered },
      {
        onSuccess: () => toast.success('Workflow steps reordered'),
        onError: () => toast.error('Failed to save step order'),
      }
    )
  }

  const handleRun = async () => {
    if (!selected) return
    runMutation.mutate(selected.id, {
      onSuccess: (run) => {
        toast.success('Workflow executed', { description: run.message })
      },
      onError: (err) => {
        toast.error('Workflow run failed', { description: err instanceof Error ? err.message : 'Unknown execution error' })
      },
    })
  }

  const handleCreate = (values: WorkflowForm) => {
    createMutation.mutate(
      { ...values, steps: defaultSteps },
      {
        onSuccess: (created) => {
          setSelectedId(created.id)
          setFormOpen(false)
          form.reset()
          toast.success('Workflow created', { description: `"${created.name}" is ready.` })
        },
        onError: (err) => {
          toast.error('Failed to create workflow', { description: err instanceof Error ? err.message : 'Error creating workflow' })
        },
      }
    )
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Workflow deleted')
        if (selectedId === id) setSelectedId(null)
      },
      onError: () => toast.error('Failed to delete workflow'),
    })
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Repository automation"
        title="Make the next move obvious."
        description="Compose routines, reorder steps, and execute backend pipelines directly across your connected repositories."
        action={
          <Button onClick={() => setFormOpen((value) => !value)}>
            <Plus data-icon="inline-start" />
            New workflow
          </Button>
        }
      />

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTitle>Workflows could not be loaded</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Error fetching workflows'}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {formOpen && (
        <Card className="mb-6 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Create a workflow</h2>
              <p className="mt-1 text-sm text-muted-foreground">Start with a structured automation routine.</p>
            </div>
            <button aria-label="Close form" onClick={() => setFormOpen(false)}>
              <X className="size-4" />
            </button>
          </div>
          <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={form.handleSubmit(handleCreate)}>
            <div>
              <Label htmlFor="workflow-name">Name</Label>
              <Input id="workflow-name" className="mt-2" placeholder="Keep repositories ready" {...form.register('name')} />
              {form.formState.errors.name && <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label>Repository scope</Label>
              <Select value={form.watch('repositoryScope')} onValueChange={(value) => form.setValue('repositoryScope', value ?? '')}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All connected repositories">All connected repositories</SelectItem>
                  <SelectItem value="Recently active repositories">Recently active repositories</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trigger</Label>
              <Select value={form.watch('trigger')} onValueChange={(value) => form.setValue('trigger', (value ?? 'manual') as WorkflowForm['trigger'])}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual trigger</SelectItem>
                  <SelectItem value="repository_sync">After repository sync</SelectItem>
                  <SelectItem value="push">After a push</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-fit md:col-span-3">
              {createMutation.isPending ? 'Creating…' : 'Create workflow'}
            </Button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      ) : workflows.length === 0 ? (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Workflow />
            </EmptyMedia>
            <EmptyTitle>No workflows configured</EmptyTitle>
            <EmptyDescription>Create your first workflow to automate repository checks, syncs, and documentation coverage.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setFormOpen(true)}>
              <Plus data-icon="inline-start" />
              Create workflow
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card className="h-fit p-3">
            <div className="flex items-center justify-between px-2 py-2">
              <h2 className="font-display font-semibold">Workflows</h2>
              <Badge variant="outline">{workflows.length}</Badge>
            </div>
            {workflows.map((workflow) => (
              <div key={workflow.id} className="group relative flex items-center">
                <button
                  onClick={() => setSelectedId(workflow.id)}
                  className={`mt-1 flex w-full items-start justify-between gap-3 rounded-lg px-3 py-3 pr-8 text-left ${
                    selected?.id === workflow.id ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{workflow.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{workflow.repositoryScope}</span>
                  </span>
                  <StatusBadge status={workflow.status} />
                </button>
                <button
                  onClick={() => handleDelete(workflow.id)}
                  className="absolute right-2 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete workflow"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </Card>

          {selected && (
            <div className="space-y-6">
              <Card className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Workflow className="size-5 text-primary" />
                      <h2 className="font-display text-xl font-semibold">{selected.name}</h2>
                      <StatusBadge status={selected.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selected.repositoryScope} · Trigger: {selected.trigger.replace('_', ' ')}
                    </p>
                  </div>
                  <Button onClick={() => void handleRun()} disabled={runMutation.isPending || orderedSteps.length === 0}>
                    <RefreshCw className={runMutation.isPending ? 'mr-2 size-4 animate-spin' : 'mr-2 size-4'} />
                    {runMutation.isPending ? 'Running…' : 'Run workflow'}
                  </Button>
                </div>

                <Separator className="my-5" />
                <h3 className="font-medium">Ordered execution steps</h3>
                <p className="mt-1 text-sm text-muted-foreground">Drag to rearrange pipeline sequence.</p>

                <DndContext collisionDetection={closestCenter} onDragEnd={dragEnd}>
                  <SortableContext items={orderedSteps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
                    <div className="mt-4 grid gap-3">
                      {orderedSteps.map((step, index) => (
                        <SortableStep key={step.id} step={step} index={index} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-semibold">Execution run history</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Real execution records recorded from backend runs.</p>
                  </div>
                  <Clock3 className="size-4 text-muted-foreground" />
                </div>

                <div className="mt-4 grid gap-3">
                  {runsLoading ? (
                    <Skeleton className="h-16" />
                  ) : runs.length === 0 ? (
                    <p className="py-5 text-sm text-muted-foreground">No runs recorded yet. Execute the workflow to begin.</p>
                  ) : (
                    runs.map((run) => (
                      <div key={run.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between">
                          <StatusBadge status={run.status} />
                          <span className="font-mono text-xs text-muted-foreground">{run.startedAt.slice(0, 19).replace('T', ' ')}</span>
                        </div>
                        <p className="mt-2 text-sm">{run.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Duration: {run.durationMs}ms</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}

function EventRow({ event }: { event: ActivityEvent }) {
  const Icon = event.type === 'workflow' ? Workflow : event.type === 'sync' ? RefreshCw : event.type === 'account' ? UserRound : GitBranch
  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{event.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
      </div>
      <time className="shrink-0 text-xs text-muted-foreground">
        {event.createdAt ? new Date(event.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : ''}
      </time>
    </div>
  )
}

export function ActivityPage() {
  const { data: events = [], isLoading, error, refetch } = useActivity()

  return (
    <AppShell>
      <PageHeader eyebrow="Workspace history" title="Activity" description="A complete, persistent audit trail of syncs, workflow runs, and account events." />

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTitle>Activity log unavailable</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Failed to fetch activity log'}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : events.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock3 />
              </EmptyMedia>
              <EmptyTitle>No activity recorded yet</EmptyTitle>
              <EmptyDescription>Activity events will appear here automatically when you synchronize repositories or execute workflows.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          events.map((event) => <EventRow key={event.id} event={event} />)
        )}
      </Card>
    </AppShell>
  )
}

function MetricCard({ label, value, icon: Icon, detail }: { label: string; value: string; icon: typeof GitBranch; detail: string }) {
  return (
    <Card className="p-5">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </Card>
  )
}

export function AnalyticsPage() {
  const { data: analytics, isLoading, error, refetch } = useAnalytics()

  return (
    <AppShell>
      <PageHeader eyebrow="Signals" title="Analytics" description="Live workspace metrics computed from connected repository telemetry." />

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTitle>Analytics unavailable</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Failed to load analytics'}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Repositories"
          value={isLoading ? '…' : String(analytics?.repositories ?? 0)}
          icon={GitBranch}
          detail="Active in workspace"
        />
        <MetricCard
          label="Synced Repositories"
          value={isLoading ? '…' : String(analytics?.synced ?? 0)}
          icon={RefreshCw}
          detail={`${analytics?.repositories ? Math.round(((analytics?.synced ?? 0) / analytics.repositories) * 100) : 0}% sync rate`}
        />
        <MetricCard
          label="Private Repositories"
          value={isLoading ? '…' : String(analytics?.privateRepositories ?? 0)}
          icon={LockKeyhole}
          detail="Encrypted access"
        />
        <MetricCard
          label="Average Health Score"
          value={isLoading ? '…' : analytics?.averageHealth ? `${analytics.averageHealth}/100` : '—'}
          icon={ShieldCheck}
          detail="Based on repo signals"
        />
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <h2 className="font-display font-semibold">7-Day Workspace Activity</h2>
        </div>

        {isLoading ? (
          <Skeleton className="mt-6 h-40" />
        ) : (
          <>
            <div className="mt-6 flex h-40 items-end gap-2 border-b border-border">
              {(analytics?.activity ?? []).map((point, index) => {
                const maxVal = Math.max(1, ...(analytics?.activity ?? []).map((p) => p.value))
                const heightPercent = Math.max(8, Math.round((point.value / maxVal) * 100))
                return (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t bg-primary/70 transition-all" style={{ height: `${heightPercent}%` }} />
                    <span className="font-mono text-[10px] text-muted-foreground">{point.label}</span>
                  </div>
                )
              })}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Computed live from repository events, syncs, and workflow execution logs.</p>
          </>
        )}
      </Card>
    </AppShell>
  )
}

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const { data: notifications = [], isLoading, error, refetch } = useNotifications()
  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()

  const unreadCount = notifications.filter((n) => !n.read).length
  const visible = unreadOnly ? notifications.filter((n) => !n.read) : notifications

  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace updates"
        title="Notifications"
        description="Stay notified about repository health alerts, workflow completions, and workspace changes."
        action={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={markAllReadMutation.isPending}
                onClick={() =>
                  markAllReadMutation.mutate(undefined, {
                    onSuccess: () => toast.success('All notifications marked as read'),
                  })
                }
              >
                <CheckCheck className="mr-1 size-4" />
                Mark all read ({unreadCount})
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setUnreadOnly((value) => !value)}>
              {unreadOnly ? 'Show all' : 'Unread only'}
            </Button>
          </div>
        }
      />

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTitle>Notifications unavailable</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Error fetching notifications'}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : visible.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Check />
              </EmptyMedia>
              <EmptyTitle>You are all caught up</EmptyTitle>
              <EmptyDescription>{unreadOnly ? 'There are no unread notifications right now.' : 'No notifications received yet.'}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          visible.map((notification) => (
            <div key={notification.id} className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-0">
              <div className="flex items-start gap-3">
                <div className={`mt-1 size-2 rounded-full ${notification.read ? 'bg-transparent' : 'bg-primary'}`} />
                <div>
                  <p className={`font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                  <time className="mt-2 block text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </time>
                </div>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={markReadMutation.isPending}
                  onClick={() => markReadMutation.mutate(notification.id)}
                >
                  Mark read
                </Button>
              )}
            </div>
          ))
        )}
      </Card>
    </AppShell>
  )
}

export function ProfilePage() {
  const { session, configured, isLoaded } = useAppAuth()
  return (
    <AppShell>
      <PageHeader eyebrow="Account" title="Your profile" description="The identity and connection context behind this workspace." />
      <Card className="max-w-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <UserRound />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">{isLoaded ? session?.name ?? 'Workspace User' : 'Loading profile…'}</h2>
            <p className="text-sm text-muted-foreground">{session?.email ?? 'Local preview mode'}</p>
          </div>
        </div>
        <Separator className="my-6" />
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Auth provider</dt>
            <dd className="mt-1 font-medium">{configured ? 'Clerk' : 'Local preview'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">GitHub</dt>
            <dd className="mt-1 flex items-center gap-2 font-medium">
              <Github className="size-4" />
              Connected via OAuth
            </dd>
          </div>
        </dl>
      </Card>
    </AppShell>
  )
}

const settingsFormSchema = z.object({
  defaultBranch: z.string().trim().min(1, 'Enter a default branch.').max(50),
  autoCommit: z.boolean(),
  autoPush: z.boolean(),
  readmeAutomation: z.boolean(),
  excludedFolders: z.string().trim(),
})
type SettingsFormData = z.infer<typeof settingsFormSchema>

export function SettingsPage() {
  const { data: preferences, isLoading, error } = useSettings()
  const updateMutation = useUpdateSettings()

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      defaultBranch: 'main',
      autoCommit: false,
      autoPush: false,
      readmeAutomation: false,
      excludedFolders: 'node_modules, dist, .env',
    },
  })

  useEffect(() => {
    if (preferences) {
      form.reset({
        defaultBranch: preferences.defaultBranch,
        autoCommit: preferences.autoCommit,
        autoPush: preferences.autoPush,
        readmeAutomation: preferences.readmeAutomation,
        excludedFolders: preferences.excludedFolders.join(', '),
      })
    }
  }, [preferences, form])

  const onSubmit = (values: SettingsFormData) => {
    const excludedList = values.excludedFolders
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    updateMutation.mutate(
      {
        defaultBranch: values.defaultBranch,
        autoCommit: values.autoCommit,
        autoPush: values.autoPush,
        readmeAutomation: values.readmeAutomation,
        excludedFolders: excludedList,
      },
      {
        onSuccess: () => {
          toast.success('Preferences saved', { description: `Updated default branch to "${values.defaultBranch}".` })
        },
        onError: (err) => {
          toast.error('Failed to save settings', { description: err instanceof Error ? err.message : 'Error updating preferences' })
        },
      }
    )
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Workspace preferences" title="Settings" description="Configure automation defaults and sync behavior." />

      {error && (
        <Alert className="mb-6 max-w-2xl" variant="destructive">
          <AlertTitle>Settings unavailable</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : 'Failed to retrieve user preferences'}</AlertDescription>
        </Alert>
      )}

      <Card className="max-w-2xl p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : (
          <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="default-branch">Default branch</Label>
              <Input id="default-branch" className="mt-2" {...form.register('defaultBranch')} />
              {form.formState.errors.defaultBranch && <p className="mt-1 text-xs text-destructive">{form.formState.errors.defaultBranch.message}</p>}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-commit">Auto commit</Label>
                  <p className="text-xs text-muted-foreground">Automatically stage and commit verified changes.</p>
                </div>
                <Switch
                  id="auto-commit"
                  checked={form.watch('autoCommit')}
                  onCheckedChange={(val) => form.setValue('autoCommit', val)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-push">Auto push</Label>
                  <p className="text-xs text-muted-foreground">Push commits to remote origin after verification passes.</p>
                </div>
                <Switch
                  id="auto-push"
                  checked={form.watch('autoPush')}
                  onCheckedChange={(val) => form.setValue('autoPush', val)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="readme-automation">README automation</Label>
                  <p className="text-xs text-muted-foreground">Suggest and update documentation when structural changes occur.</p>
                </div>
                <Switch
                  id="readme-automation"
                  checked={form.watch('readmeAutomation')}
                  onCheckedChange={(val) => form.setValue('readmeAutomation', val)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excluded-folders">Excluded folders</Label>
              <Textarea id="excluded-folders" className="mt-2" {...form.register('excludedFolders')} />
              <p className="mt-1 text-xs text-muted-foreground">Comma-separated paths excluded from automation pipelines.</p>
            </div>

            <Button type="submit" disabled={updateMutation.isPending} className="w-fit">
              {updateMutation.isPending ? 'Saving…' : 'Save preferences'}
            </Button>
          </form>
        )}
      </Card>
    </AppShell>
  )
}

function PublicInfo({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex min-h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="font-display font-semibold">
          Auto<span className="text-primary">Git</span>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back home
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">{children}</div>
      </main>
    </div>
  )
}

function InfoCard({ icon: Icon, title, text }: { icon: typeof Github; title: string; text: string }) {
  return (
    <Card className="p-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <h2 className="mt-5 font-display text-lg font-semibold">{title}</h2>
      <p className="mt-2 leading-6 text-muted-foreground">{text}</p>
    </Card>
  )
}

export function HelpPage() {
  return (
    <PublicInfo eyebrow="Help & docs" title="A calmer path through the workspace." description="Understand what AutoGit currently supports, and how to manage your repository automation.">
      <InfoCard icon={LifeBuoy} title="Connect GitHub" text="Use onboarding, then return to repositories to sync metadata." />
      <InfoCard icon={Workflow} title="Automation workflows" text="Create real workflows, reorder execution steps, and run backend pipelines." />
      <InfoCard icon={CircleHelp} title="Recover quickly" text="Retry a failed request, check your session, or return home." />
    </PublicInfo>
  )
}

export function AboutPage() {
  return (
    <PublicInfo
      eyebrow="About AutoGit"
      title="A focused control center for the work you already do."
      description="AutoGit is designed around orientation: know what changed, what is connected, and what deserves your next ten minutes."
    >
      <InfoCard icon={ShieldCheck} title="Private by default" text="Workspace data stays scoped to the authenticated account." />
      <InfoCard icon={Settings2} title="Explicit automation" text="Workflows make every step visible and verifiable before execution." />
      <InfoCard icon={Sparkles} title="Less noise" text="One primary action, useful empty states, and direct recovery paths." />
    </PublicInfo>
  )
}

export function NotFoundPage() {
  return (
    <PublicInfo eyebrow="404" title="That route is not in the workspace." description="The page may have moved, or the link may be stale. Use the navigation to find a safe way back.">
      <InfoCard icon={ArrowLeft} title="Return home" text="Start again from the public workspace overview." />
    </PublicInfo>
  )
}
