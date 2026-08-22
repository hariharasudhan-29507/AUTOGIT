export type GitHubConnectionStatus = 'connected' | 'not_connected' | 'connecting' | 'revoked' | 'error'

export interface UserSession { id: string; email: string; name: string; avatarUrl?: string; github: GitHubConnectionStatus }
export interface GitHubAccount { id: number; login: string; avatarUrl: string; name?: string; connectedAt: string }
export interface RepositorySummary { id: number; name: string; owner: string; language: string; lastCommit: string; stars: number; forks: number; openIssues: number; healthScore: number; synced: boolean; isPrivate: boolean }
export interface RepositoryListFilters { page: number; pageSize: number; search: string; visibility: 'all' | 'public' | 'private'; language: string; sort: 'updated' | 'name' | 'stars' }
export type RepositoryDetail = RepositorySummary
export interface ApiError { code: string; message: string; requestId?: string; recoverable: boolean }
export interface PaginatedResponse<T> { data: T[]; page: number; pageSize: number; total: number }
export interface Notification { id: string; type: 'success' | 'warning' | 'error' | 'info'; title: string; description: string; createdAt: string; read: boolean }
export interface UserPreferences { defaultBranch: string; autoCommit: boolean; autoPush: boolean; readmeAutomation: boolean; excludedFolders: string[] }
export type AuthRouteGuard = 'public' | 'authenticated' | 'github_connected'

export interface GitHubService { getConnection(): Promise<GitHubAccount | null>; connect(): Promise<GitHubAccount>; disconnect(): Promise<void> }
export interface RepositoryService { list(): Promise<PaginatedResponse<RepositorySummary>>; get(id: number): Promise<RepositorySummary> }
export interface AnalyticsService { getOverview(): Promise<Record<string, number>> }
export interface NotificationService { list(): Promise<Notification[]>; markRead(id: string): Promise<void> }
export interface SettingsService { getPreferences(): Promise<UserPreferences>; updatePreferences(input: Partial<UserPreferences>): Promise<UserPreferences> }

export type WorkflowStatus = 'draft' | 'ready' | 'running' | 'success' | 'failed'
export type WorkflowTrigger = 'manual' | 'repository_sync' | 'push'
export type WorkflowStepKind = 'sync' | 'check' | 'commit' | 'readme'
export interface WorkflowStep { id: string; kind: WorkflowStepKind; label: string; description: string; enabled: boolean }
export interface WorkflowDefinition { id: string; name: string; repositoryScope: string; trigger: WorkflowTrigger; status: WorkflowStatus; steps: WorkflowStep[]; updatedAt: string; isDemo: boolean }
export interface WorkflowRun { id: string; workflowId: string; status: Exclude<WorkflowStatus, 'draft' | 'ready'>; startedAt: string; durationMs: number; isPreview: boolean; message: string }
export interface ActivityEvent { id: string; type: 'sync' | 'workflow' | 'repository' | 'account'; title: string; description: string; createdAt: string; status: 'success' | 'warning' | 'error' | 'info' }
export interface AnalyticsOverview { repositories: number; synced: number; privateRepositories: number; averageHealth: number; activity: Array<{ label: string; value: number }> }

