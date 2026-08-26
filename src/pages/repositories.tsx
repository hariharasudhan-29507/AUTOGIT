import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Code2,
  ExternalLink,
  GitBranch,
  GitFork,
  GitPullRequest,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  Workflow,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/ui'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAppAuth } from '@/lib/auth'
import { useGithubStatus, useRepositories, useRepository, useSyncRepositories } from '@/lib/repositories'
import { useAnalytics } from '@/lib/analytics'
import { RepositoryWorkbench } from '@/components/repository-workbench'
import { RepositoryModal } from '@/components/repository-modal'
import { env } from '@/lib/env'
import type { RepositorySummary } from '@/types'

export const DEFAULT_PREVIEW_REPOSITORIES: RepositorySummary[] = [
  {
    id: 1,
    name: 'react',
    owner: 'facebook',
    language: 'JavaScript',
    lastCommit: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    stars: 231400,
    forks: 46800,
    openIssues: 780,
    healthScore: 96,
    synced: true,
    isPrivate: false,
  },
  {
    id: 2,
    name: 'next.js',
    owner: 'vercel',
    language: 'TypeScript',
    lastCommit: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    stars: 126800,
    forks: 27200,
    openIssues: 1240,
    healthScore: 94,
    synced: true,
    isPrivate: false,
  },
  {
    id: 3,
    name: 'tailwindcss',
    owner: 'tailwindlabs',
    language: 'TypeScript',
    lastCommit: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    stars: 84500,
    forks: 4200,
    openIssues: 140,
    healthScore: 98,
    synced: true,
    isPrivate: false,
  },
  {
    id: 4,
    name: 'ui',
    owner: 'shadcn',
    language: 'TypeScript',
    lastCommit: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    stars: 76900,
    forks: 6100,
    openIssues: 95,
    healthScore: 95,
    synced: true,
    isPrivate: false,
  },
  {
    id: 5,
    name: 'workspace-core',
    owner: 'autogit',
    language: 'TypeScript',
    lastCommit: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    stars: 420,
    forks: 38,
    openIssues: 2,
    healthScore: 99,
    synced: true,
    isPrivate: true,
  },
]

function HealthBadge({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
        <ShieldCheck className="mr-1 size-3" /> {score}/100 Healthy
      </Badge>
    )
  }
  if (score >= 50) {
    return (
      <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-600">
        <Activity className="mr-1 size-3" /> {score}/100 Moderate
      </Badge>
    )
  }
  return (
    <Badge variant="destructive">
      <ShieldAlert className="mr-1 size-3" /> {score}/100 Attention
    </Badge>
  )
}

function StatCard({ label, value, icon: Icon, tone = 'default' }: { label: string; value: string; icon: LucideIcon; tone?: 'default' | 'green' }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={tone === 'green' ? 'text-primary size-4' : 'text-muted-foreground size-4'} />
      </div>
      <p className="mt-4 font-mono text-2xl font-semibold">{value}</p>
    </Card>
  )
}

function RepositoryRow({ repo }: { repo: RepositorySummary }) {
  return (
    <Link to={`/repositories/${repo.id}`} className="flex items-center gap-4 border-t border-border px-5 py-4 transition-colors hover:bg-muted/50">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <GitFork className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{repo.owner}/{repo.name}</span>
          {repo.isPrivate && <LockKeyhole className="size-3 text-muted-foreground" />}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{repo.language || 'Unknown language'}</span>
          <span>{repo.lastCommit ? `Updated ${new Date(repo.lastCommit).toLocaleDateString()}` : 'No commit data'}</span>
        </div>
      </div>
      <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
        <span className="flex items-center gap-1">
          <Star className="size-3.5" /> {repo.stars.toLocaleString()}
        </span>
        <HealthBadge score={repo.healthScore} />
        <Badge variant={repo.synced ? 'secondary' : 'outline'}>{repo.synced ? 'Synced' : 'Needs sync'}</Badge>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  )
}

function RepositoryEmptyState({ empty, onRetry, error }: { empty?: boolean; onRetry?: () => void; error?: string }) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Repositories could not be loaded</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{error}</span>
          {onRetry && (
            <Button variant="outline" size="sm" className="w-fit" onClick={onRetry}>
              Try again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Empty className="min-h-64 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GitBranch />
        </EmptyMedia>
        <EmptyTitle>{empty ? 'No repositories synchronized' : 'Repositories are unavailable'}</EmptyTitle>
        <EmptyDescription>
          {empty ? 'Connect your GitHub account and synchronize repositories to populate your workspace.' : 'Repository service is currently unavailable.'}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {empty && (
          <a
            href={`${env.VITE_API_URL ?? '/api'}/github/connect`}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Connect GitHub
          </a>
        )}
      </EmptyContent>
    </Empty>
  )
}

export function DashboardPage() {
  const { data, isLoading, error, refetch } = useRepositories({
    page: 1,
    pageSize: 10,
    search: '',
    visibility: 'all',
    language: '',
    sort: 'updated',
  })
  const { data: analytics } = useAnalytics()
  const syncMutation = useSyncRepositories()

  const [customRepos, setCustomRepos] = useState<RepositorySummary[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const initialRepos = (data?.data && data.data.length > 0) ? data.data : DEFAULT_PREVIEW_REPOSITORIES
  const repos = useMemo(() => [...customRepos, ...initialRepos], [customRepos, initialRepos])

  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace overview"
        title="Your workspace"
        description="A real-time control center for repositories, synchronization health, and automation readiness."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              <Sparkles className="mr-2 size-4 text-primary" /> New / Import Repository
            </Button>
            <Button
              onClick={() =>
                syncMutation.mutate(undefined, {
                  onSuccess: (res) => void refetch(),
                })
              }
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={syncMutation.isPending ? 'mr-2 size-4 animate-spin' : 'mr-2 size-4'} />
              {syncMutation.isPending ? 'Syncing…' : 'Sync GitHub'}
            </Button>
          </div>
        }
      />

      <RepositoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddRepository={(newRepo) => setCustomRepos((prev) => [newRepo, ...prev])}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Repositories" value={isLoading ? '…' : String(data?.total ?? repos.length)} icon={GitFork} />
        <StatCard
          label="Synced Repositories"
          value={isLoading ? '…' : String(repos.filter((r) => r.synced).length)}
          icon={RefreshCw}
          tone="green"
        />
        <StatCard
          label="Average Health Score"
          value={isLoading ? '…' : `${Math.round(repos.reduce((a, b) => a + b.healthScore, 0) / repos.length)}/100`}
          icon={ShieldCheck}
          tone="green"
        />
        <StatCard
          label="Private Repositories"
          value={isLoading ? '…' : String(repos.filter((r) => r.isPrivate).length)}
          icon={LockKeyhole}
        />
      </div>

      <div className="mt-8">
        <Card>
          <div className="flex items-center justify-between p-5">
            <div>
              <h2 className="font-display font-semibold">Active Repositories</h2>
              <p className="mt-1 text-sm text-muted-foreground">Connected repositories in your private workspace.</p>
            </div>
            <Link to="/repositories" className="text-sm font-medium text-primary hover:underline">
              View all ({data?.total ?? repos.length})
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4 p-5">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : error && repos.length === 0 ? (
            <div className="p-5">
              <RepositoryEmptyState error={error instanceof Error ? error.message : 'Error loading repositories'} onRetry={() => void refetch()} />
            </div>
          ) : (
            repos.map((repo) => <RepositoryRow repo={repo} key={repo.id} />)
          )}
        </Card>
      </div>
    </AppShell>
  )
}

export function RepositoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(
    () => ({
      page: Math.max(1, Number(searchParams.get('page') ?? 1)),
      pageSize: Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 10))),
      search: searchParams.get('search') ?? '',
      visibility: (searchParams.get('visibility') ?? 'all') as 'all' | 'public' | 'private',
      language: searchParams.get('language') ?? '',
      sort: (searchParams.get('sort') ?? 'updated') as 'updated' | 'name' | 'stars',
    }),
    [searchParams]
  )

  const [draftSearch, setDraftSearch] = useState(filters.search)
  useEffect(() => setDraftSearch(filters.search), [filters.search])

  const [customRepos, setCustomRepos] = useState<RepositorySummary[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const query = useRepositories(filters)
  const sync = useSyncRepositories()
  
  // Combine custom created repos with query / default repos
  const repos = useMemo(() => {
    const baseList = (query.data?.data && query.data.data.length > 0) ? query.data.data : DEFAULT_PREVIEW_REPOSITORIES
    const combined = [...customRepos, ...baseList]
    return combined.filter((r) => {
      if (filters.search && !r.name.toLowerCase().includes(filters.search.toLowerCase()) && !r.owner.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.visibility === 'public' && r.isPrivate) return false
      if (filters.visibility === 'private' && !r.isPrivate) return false
      if (filters.language && r.language?.toLowerCase() !== filters.language.toLowerCase()) return false
      return true
    })
  }, [query.data, customRepos, filters])

  const updateFilters = (values: Partial<typeof filters>) => {
    const next = {
      ...Object.fromEntries(searchParams.entries()),
      ...Object.fromEntries(Object.entries(values).filter(([, val]) => val !== '' && val !== 'all' && val !== 1)),
    }
    setSearchParams(next as Record<string, string>)
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Source control" title="Repositories" description="Search, inspect, and manage projects in your workspace." />

      <form
        className="mb-6 grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-[1fr_auto_auto_auto]"
        onSubmit={(e) => {
          e.preventDefault()
          updateFilters({ search: draftSearch, page: 1 })
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="repository-search">Search repositories</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              id="repository-search"
              className="pl-9"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              placeholder="Search by repository name or owner…"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="repository-visibility">Visibility</Label>
          <Select value={filters.visibility} onValueChange={(value) => updateFilters({ visibility: value as typeof filters.visibility, page: 1 })}>
            <SelectTrigger id="repository-visibility" className="w-full md:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visibility</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="repository-sort">Sort by</Label>
          <Select value={filters.sort} onValueChange={(value) => updateFilters({ sort: value as typeof filters.sort, page: 1 })}>
            <SelectTrigger id="repository-sort" className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Recently updated</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="stars">Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="self-end">
          Search
        </Button>
      </form>

      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {repos.length} of {(query.data?.total ?? 5) + customRepos.length} repositories
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Sparkles className="mr-1 size-3.5" />
            New Repository
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching || sync.isPending}>
            <RefreshCw className={query.isFetching ? 'mr-1 size-3.5 animate-spin' : 'mr-1 size-3.5'} />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RefreshCw className={sync.isPending ? 'mr-1 size-3.5 animate-spin' : 'mr-1 size-3.5'} />
            {sync.isPending ? 'Syncing…' : 'Sync GitHub'}
          </Button>
        </div>
      </div>

      <RepositoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddRepository={(newRepo) => setCustomRepos((prev) => [newRepo, ...prev])}
      />

      {query.isLoading ? (
        <Card className="p-5">
          <div className="space-y-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </Card>
      ) : repos.length === 0 ? (
        <RepositoryEmptyState empty />
      ) : (
        <>
          <Card>
            {repos.map((repo) => (
              <RepositoryRow repo={repo} key={repo.id} />
            ))}
          </Card>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {filters.page} of {Math.max(1, Math.ceil((query.data?.total ?? repos.length) / filters.pageSize))}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page <= 1 || query.isFetching}
                onClick={() => updateFilters({ page: filters.page - 1 })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page >= Math.ceil((query.data?.total ?? repos.length) / filters.pageSize) || query.isFetching}
                onClick={() => updateFilters({ page: filters.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}

export function RepositoryDetailPage() {
  const { id } = useParams()
  const query = useRepository(id)
  
  const repo = useMemo(() => {
    if (query.data) return query.data
    const numId = Number(id)
    return DEFAULT_PREVIEW_REPOSITORIES.find((r) => r.id === numId) ?? DEFAULT_PREVIEW_REPOSITORIES[0]
  }, [query.data, id])

  if (query.isLoading && !repo) {
    return (
      <AppShell>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-64" />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <Link to="/repositories" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-1 size-4" /> Back to repositories
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/automation"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Workflow className="size-3.5" /> Attach Automation
          </Link>
        </div>
      </div>

      {/* Deep Repository Workbench */}
      <RepositoryWorkbench repo={repo} />
    </AppShell>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, configured, isLoaded } = useAppAuth()
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-sm text-muted-foreground">Checking workspace session…</div>
      </div>
    )
  }
  if (configured && !session) return <Navigate to="/login" replace />
  return <>{children}</>
}
