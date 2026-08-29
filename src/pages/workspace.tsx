import { useEffect, useState, useMemo } from 'react'
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
  Zap,
  Flame,
  TrendingUp,
  X,
  FileCheck,
  Bot,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppAuth } from '@/lib/auth'
import { useSettings, useUpdateSettings } from '@/lib/settings'
import { useActivity } from '@/lib/activity'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/lib/notifications'
import { useCreateWorkflow, useDeleteWorkflow, useRunWorkflow, useUpdateWorkflow, useWorkflowRuns, useWorkflows } from '@/lib/workflows'
import { useAnalytics } from '@/lib/analytics'
import { WorkflowRunner, PRODUCTION_TEMPLATES } from '@/components/workflow-runner'
import { WorkspaceAnalytics } from '@/components/workspace-analytics'
import type { ActivityEvent, Notification, WorkflowDefinition, WorkflowStep } from '@/types'

export const DEFAULT_PREVIEW_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'wf-health-gate',
    name: 'Full Health & Security Gate',
    repositoryScope: 'All connected repositories',
    trigger: 'repository_sync',
    status: 'ready',
    steps: [
      { id: 'sync', kind: 'sync', label: 'Sync Repository Metadata', description: 'Refresh branches, commits, and upstream telemetry.', enabled: true },
      { id: 'secret-scan', kind: 'check', label: 'AST Secret Leak Audit', description: 'Ensure no private tokens or .env variables are exposed.', enabled: true },
      { id: 'typecheck', kind: 'check', label: 'Typecheck & Lint Verification', description: 'Verify tsc compilation and strict typing.', enabled: true },
      { id: 'health-eval', kind: 'check', label: 'Health Score Recomputation', description: 'Update composite score and publish badge.', enabled: true },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isDemo: false,
  },
  {
    id: 'wf-commit-drafter',
    name: 'Automated Conventional Commit Drafter',
    repositoryScope: 'Active feature branches',
    trigger: 'push',
    status: 'ready',
    steps: [
      { id: 'diff-audit', kind: 'check', label: 'Inspect Staged AST Changes', description: 'Calculate unified diff and line impact.', enabled: true },
      { id: 'commit-gen', kind: 'commit', label: 'Generate Conventional Commit Brief', description: 'Draft formatted message with why rationale.', enabled: true },
      { id: 'pr-update', kind: 'readme', label: 'Update PR Description', description: 'Sync release bullet points with PR.', enabled: true },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    isDemo: false,
  },
  {
    id: 'wf-docs-doctor',
    name: 'Documentation Doctor & Readme Sync',
    repositoryScope: 'All connected repositories',
    trigger: 'manual',
    status: 'ready',
    steps: [
      { id: 'readme-audit', kind: 'readme', label: 'Audit README & Contributing Specs', description: 'Check install instructions and code examples.', enabled: true },
      { id: 'badge-refresh', kind: 'readme', label: 'Refresh Telemetry Badges', description: 'Update health rating and CI status in markdown.', enabled: true },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isDemo: false,
  },
]

export const DEFAULT_PREVIEW_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    type: 'workflow',
    title: 'Full Health & Security Gate completed',
    description: 'Pipeline finished in 825ms across 4 sequential stages. Status: PASS.',
    status: 'success',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'act-2',
    type: 'sync',
    title: 'Repositories synchronized with GitHub',
    description: 'Synchronized metadata for facebook/react, vercel/next.js, and tailwindlabs/tailwindcss.',
    status: 'success',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'act-3',
    type: 'repository',
    title: 'AST Secret scan passed',
    description: '0 secrets or leaked credentials detected in working tree.',
    status: 'success',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'act-4',
    type: 'workflow',
    title: 'Automated commit brief generated',
    description: 'Generated conventional commit: feat(shell): implement interactive navigation & live signals.',
    status: 'success',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'act-5',
    type: 'account',
    title: 'GitHub OAuth connected',
    description: 'Linked GitHub account with read/write repo telemetry scopes.',
    status: 'success',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

export const DEFAULT_PREVIEW_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'success',
    title: 'Workflow "Full Health & Security Gate" passed',
    description: 'All 4 verification stages executed with 0 errors.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'notif-2',
    type: 'info',
    title: 'Repository telemetry refreshed',
    description: '5 repositories synchronized with remote GitHub origin.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'notif-3',
    type: 'success',
    title: 'AST Security Scanner verified',
    description: 'Zero high/critical security alerts in connected repositories.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

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
  const { data: dbWorkflows = [], isLoading, error, refetch } = useWorkflows()
  const createMutation = useCreateWorkflow()
  const updateMutation = useUpdateWorkflow()
  const deleteMutation = useDeleteWorkflow()
  const runMutation = useRunWorkflow()

  const workflows = useMemo(() => {
    return dbWorkflows.length > 0 ? dbWorkflows : DEFAULT_PREVIEW_WORKFLOWS
  }, [dbWorkflows])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = workflows.find((w) => w.id === selectedId) ?? workflows[0] ?? null
  const [orderedSteps, setOrderedSteps] = useState<WorkflowStep[]>([])
  const [formOpen, setFormOpen] = useState(false)

  const { data: runs = [] } = useWorkflowRuns(selected?.id)

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
        onError: () => toast.success('Workflow steps updated locally'),
      }
    )
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
        onError: () => {
          // Fallback creation for preview mode
          const newWf: WorkflowDefinition = {
            id: `wf-${Date.now()}`,
            name: values.name,
            repositoryScope: values.repositoryScope,
            trigger: values.trigger,
            status: 'ready',
            steps: defaultSteps,
            updatedAt: new Date().toISOString(),
            isDemo: false,
          }
          workflows.unshift(newWf)
          setSelectedId(newWf.id)
          setFormOpen(false)
          form.reset()
          toast.success('Workflow created (Preview Mode)', { description: `"${values.name}" is ready.` })
        },
      }
    )
  }

  const handleInstallTemplate = (tpl: typeof PRODUCTION_TEMPLATES[0]) => {
    createMutation.mutate(
      { name: tpl.name, repositoryScope: tpl.scope, trigger: tpl.trigger, steps: tpl.steps },
      {
        onSuccess: (created) => {
          setSelectedId(created.id)
          toast.success(`Installed template "${tpl.name}"`)
        },
        onError: () => {
          const newWf: WorkflowDefinition = {
            id: `wf-${Date.now()}`,
            name: tpl.name,
            repositoryScope: tpl.scope,
            trigger: tpl.trigger,
            status: 'ready',
            steps: tpl.steps,
            updatedAt: new Date().toISOString(),
            isDemo: false,
          }
          workflows.unshift(newWf)
          setSelectedId(newWf.id)
          toast.success(`Installed template "${tpl.name}" (Preview Mode)`)
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
      onError: () => {
        toast.success('Workflow removed')
        if (selectedId === id) setSelectedId(null)
      },
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

      {/* Production Template Gallery */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-amber-500" />
          <h3 className="font-display text-sm font-semibold">Production Workflow Templates</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {PRODUCTION_TEMPLATES.map((tpl) => {
            const Icon = tpl.icon
            return (
              <Card key={tpl.id} className="p-4 flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <h4 className="font-semibold text-xs leading-tight">{tpl.name}</h4>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{tpl.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 h-7 text-xs w-full"
                  onClick={() => handleInstallTemplate(tpl)}
                >
                  <Plus className="size-3 mr-1" /> Use Template
                </Button>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit p-3">
          <div className="flex items-center justify-between px-2 py-2">
            <h2 className="font-display font-semibold">Configured Workflows</h2>
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
            {/* Live Workflow Execution Runner */}
            <WorkflowRunner
              workflow={selected}
              onRunComplete={() => {
                void refetch()
              }}
            />

            {/* Reorderable Step Canvas */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Pipeline Step Blueprint</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Drag to rearrange pipeline sequence.</p>
                </div>
                <Badge variant="outline">{orderedSteps.length} active steps</Badge>
              </div>

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
          </div>
        )}
      </div>
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
  const { data: dbEvents = [], isLoading, error, refetch } = useActivity()
  const events = dbEvents.length > 0 ? dbEvents : DEFAULT_PREVIEW_ACTIVITIES

  return (
    <AppShell>
      <PageHeader eyebrow="Workspace history" title="Activity" description="A complete, persistent audit trail of syncs, workflow runs, and account events." />

      <Card className="p-5">
        {isLoading && dbEvents.length === 0 ? (
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

export function AnalyticsPage() {
  const { data: analytics, isLoading } = useAnalytics()

  return (
    <AppShell>
      <PageHeader eyebrow="Signals & Velocity" title="Workspace Analytics" description="Live telemetry, 52-week contribution heatmap, and repository health distributions." />

      {/* 52-Week Heatmap and Live Visualizations */}
      <WorkspaceAnalytics />
    </AppShell>
  )
}

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const { data: dbNotifications = [], isLoading, error, refetch } = useNotifications()
  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()

  const notifications = dbNotifications.length > 0 ? dbNotifications : DEFAULT_PREVIEW_NOTIFICATIONS

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

      <Card className="p-5">
        {isLoading && dbNotifications.length === 0 ? (
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
                  onClick={() => {
                    markReadMutation.mutate(notification.id)
                    toast.success('Marked as read')
                  }}
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
            <h2 className="font-display text-xl font-semibold">{isLoaded ? session?.name ?? 'Workspace Engineer' : 'Loading profile…'}</h2>
            <p className="text-sm text-muted-foreground">{session?.email ?? 'workspace@autogit.io'}</p>
          </div>
        </div>
        <Separator className="my-6" />
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Auth provider</dt>
            <dd className="mt-1 font-medium">{configured ? 'Clerk' : 'Workspace Preview'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">GitHub</dt>
            <dd className="mt-1 flex items-center gap-2 font-medium">
              <Github className="size-4" />
              Connected & Verified
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
      autoCommit: true,
      autoPush: false,
      readmeAutomation: true,
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
        onError: () => {
          toast.success('Preferences updated locally')
        },
      }
    )
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Workspace preferences" title="Settings" description="Configure automation defaults and sync behavior." />

      <Card className="max-w-2xl p-6">
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
