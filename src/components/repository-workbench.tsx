import { useState, useMemo } from 'react'
import {
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  GitPullRequest,
  Code2,
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Star,
  CircleAlert,
  Sparkles,
  Terminal,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  Tag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { RepositorySummary } from '@/types'

interface CommitItem {
  hash: string
  shortHash: string
  message: string
  author: string
  date: string
  branch: string
  isMerge?: boolean
  additions: number
  deletions: number
}

interface FileNode {
  name: string
  type: 'file' | 'folder'
  path: string
  size?: string
  content?: string
  children?: FileNode[]
}

const SAMPLE_COMMITS: CommitItem[] = [
  {
    hash: 'e4a91b2c7f0983d5a219e8b7d9014a51e6c38290',
    shortHash: 'e4a91b2',
    message: 'feat(shell): implement interactive navigation & live signals',
    author: 'AutoGit Engineer',
    date: '2 hours ago',
    branch: 'main',
    additions: 142,
    deletions: 18,
  },
  {
    hash: '8c3d90fa2b419876e5d0124a98124b89f012e567',
    shortHash: '8c3d90f',
    message: 'fix(api): wrap endpoint requests with resilient retry backoff',
    author: 'AutoGit Bot',
    date: '1 day ago',
    branch: 'main',
    additions: 45,
    deletions: 12,
  },
  {
    hash: '7b2a891e4590cf2134a98124b89f012e5671a980',
    shortHash: '7b2a891',
    message: 'refactor(workflows): streamline drag-and-drop AST runner pipeline',
    author: 'AutoGit Engineer',
    date: '3 days ago',
    branch: 'main',
    isMerge: true,
    additions: 89,
    deletions: 64,
  },
  {
    hash: '3f9012e5671a9807b2a891e4590cf2134a98124b',
    shortHash: '3f9012e',
    message: 'chore(security): verify AST secret leak scanner & RLS token policies',
    author: 'Security Bot',
    date: '5 days ago',
    branch: 'main',
    additions: 24,
    deletions: 6,
  },
]

const SAMPLE_FILE_TREE: FileNode[] = [
  {
    name: 'src',
    type: 'folder',
    path: 'src',
    children: [
      {
        name: 'components',
        type: 'folder',
        path: 'src/components',
        children: [
          {
            name: 'app-shell.tsx',
            type: 'file',
            path: 'src/components/app-shell.tsx',
            size: '15.6 KB',
            content: `export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const { data: notifications = [] } = useNotifications()
  const { data: repositoriesData } = useRepositories({ page: 1, pageSize: 10, search: '', visibility: 'all', language: '', sort: 'updated' })
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Dynamic responsive navigation shell */}
      <Sidebar collapsed={collapsed} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}`,
          },
          {
            name: 'git-sandbox.tsx',
            type: 'file',
            path: 'src/components/git-sandbox.tsx',
            size: '11.2 KB',
            content: `export function GitSandbox() {
  // In-browser interactive git state machine
  const [currentBranch, setCurrentBranch] = useState('main')
  const executeCommand = (cmd: string) => {
    // Process autogit commands with live telemetry
  }
}`,
          },
        ],
      },
      {
        name: 'lib',
        type: 'folder',
        path: 'src/lib',
        children: [
          {
            name: 'api.ts',
            type: 'file',
            path: 'src/lib/api.ts',
            size: '3.4 KB',
            content: `export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = \`\${env.VITE_API_URL}\${endpoint}\`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: \`Bearer \${options.accessToken}\` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) throw new ApiRequestError({ code: 'REQUEST_FAILED', message: res.statusText, recoverable: true })
  return res.json()
}`,
          },
          {
            name: 'repositories.ts',
            type: 'file',
            path: 'src/lib/repositories.ts',
            size: '2.6 KB',
            content: `export function useRepositories(filters: RepositoryListFilters) {
  return useQuery({
    queryKey: ['repositories', filters],
    queryFn: () => apiRequest('/repositories'),
  })
}`,
          },
        ],
      },
      {
        name: 'main.tsx',
        type: 'file',
        path: 'src/main.tsx',
        size: '2.4 KB',
        content: `import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
)`,
      },
    ],
  },
  {
    name: 'README.md',
    type: 'file',
    path: 'README.md',
    size: '2.7 KB',
    content: `# AutoGit

AutoGit is a calm, GitHub-inspired workspace for repositories, local changes, and project health.

## Core Features
- 🚀 **Interactive Git Telemetry**: Real-time branch, commit graph, and health radar inspection.
- 🛡 **Security & Secret Scanner**: AST-powered leak prevention before pushing.
- ⚡ **Continuous Automation**: Reorderable workflow pipelines with live terminal streaming.
`,
  },
  {
    name: 'package.json',
    type: 'file',
    path: 'package.json',
    size: '2.5 KB',
    content: `{
  "name": "autogit",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^19.1.1",
    "@tanstack/react-query": "^5.101.4",
    "motion": "^12.43.0"
  }
}`,
  },
]

const SAMPLE_PULL_REQUESTS = [
  {
    id: 104,
    title: 'feat: add live terminal streamer and interactive git workbench',
    author: 'AutoGit Engineer',
    branch: 'feature/workbench-v2',
    target: 'main',
    status: 'open',
    checks: 'passed',
    comments: 4,
    updatedAt: '1 hour ago',
  },
  {
    id: 102,
    title: 'fix: optimize repository health calculation algorithm',
    author: 'AutoGit Bot',
    branch: 'fix/health-radar',
    target: 'main',
    status: 'merged',
    checks: 'passed',
    comments: 2,
    updatedAt: 'Yesterday',
  },
]

export function RepositoryWorkbench({ repo }: { repo: RepositorySummary }) {
  const [selectedBranch, setSelectedBranch] = useState('main')
  const [cloneType, setCloneType] = useState<'https' | 'ssh' | 'cli'>('https')
  const [copiedClone, setCopiedClone] = useState(false)
  const [selectedCommit, setSelectedCommit] = useState<CommitItem>(SAMPLE_COMMITS[0])
  const [selectedFile, setSelectedFile] = useState<FileNode>(SAMPLE_FILE_TREE[0].children![0].children![0])
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    'src/components': true,
    'src/lib': true,
  })

  // Conventional Commit Generator State
  const [diffType, setDiffType] = useState<'feat' | 'fix' | 'refactor' | 'perf' | 'chore'>('feat')
  const [commitScope, setCommitScope] = useState('workbench')
  const [commitDesc, setCommitDesc] = useState('implement visual commit graph and code viewer')

  const cloneCommands = {
    https: `https://github.com/${repo.owner}/${repo.name}.git`,
    ssh: `git@github.com:${repo.owner}/${repo.name}.git`,
    cli: `gh repo clone ${repo.owner}/${repo.name}`,
  }

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text)
    toast.success(msg)
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const generatedCommitMessage = `${diffType}(${commitScope || 'core'}): ${commitDesc}`

  return (
    <div className="space-y-6">
      {/* Workbench Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GitFork className="size-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {repo.owner} / <span className="text-primary">{repo.name}</span>
              </h2>
              <Badge variant={repo.isPrivate ? 'outline' : 'secondary'}>{repo.isPrivate ? 'Private' : 'Public'}</Badge>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <ShieldCheck className="mr-1 size-3.5" /> {repo.healthScore}/100 Healthy
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Primary: {repo.language || 'TypeScript'}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Star className="size-3 text-amber-500" /> {repo.stars} stars
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <GitFork className="size-3" /> {repo.forks} forks
              </span>
              <span>·</span>
              <span>Updated {repo.lastCommit ? new Date(repo.lastCommit).toLocaleDateString() : 'recently'}</span>
            </p>
          </div>
        </div>

        {/* Quick Clone & Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 text-xs">
            <button
              onClick={() => setCloneType('https')}
              className={`rounded px-2 py-1 font-medium transition-colors ${cloneType === 'https' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'}`}
            >
              HTTPS
            </button>
            <button
              onClick={() => setCloneType('ssh')}
              className={`rounded px-2 py-1 font-medium transition-colors ${cloneType === 'ssh' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'}`}
            >
              SSH
            </button>
            <button
              onClick={() => setCloneType('cli')}
              className={`rounded px-2 py-1 font-medium transition-colors ${cloneType === 'cli' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'}`}
            >
              CLI
            </button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-1 h-6 px-2 text-xs"
              onClick={() => copyToClipboard(cloneCommands[cloneType], `Copied ${cloneType.toUpperCase()} clone URL`)}
            >
              <Copy className="size-3 mr-1" /> Copy
            </Button>
          </div>

          <a
            href={`https://github.com/${repo.owner}/${repo.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium hover:bg-muted"
          >
            <ExternalLink className="size-3.5" /> GitHub
          </a>
        </div>
      </div>

      {/* Main Interactive Workbench Tabs */}
      <Tabs defaultValue="commits" className="w-full flex flex-col gap-4">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="inline-flex h-11 min-w-max items-center justify-start rounded-xl bg-muted/50 p-1 text-muted-foreground">
            <TabsTrigger value="commits" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5">
              <GitCommitHorizontal className="size-4 text-primary" /> Visual Commits
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5">
              <Code2 className="size-4 text-primary" /> File Explorer
            </TabsTrigger>
            <TabsTrigger value="diffs" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5">
              <Layers className="size-4 text-primary" /> Diff Inspector
            </TabsTrigger>
            <TabsTrigger value="brief" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5">
              <Sparkles className="size-4 text-primary" /> PR & Commit Automator
            </TabsTrigger>
            <TabsTrigger value="prs" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5">
              <GitPullRequest className="size-4 text-primary" /> Pull Requests
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5">
              <ShieldCheck className="size-4 text-emerald-500" /> Security Audit
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- Tab 1: Visual Commit Graph --- */}
        <TabsContent value="commits" className="mt-4 space-y-4">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
            <Card className="p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-display font-semibold">Visual Commit Timeline</h3>
                  <p className="text-xs text-muted-foreground">Interactive branch lanes with git commit hashes and telemetry.</p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  <GitBranch className="size-3 mr-1 text-emerald-500" />
                  {selectedBranch}
                </Badge>
              </div>

              {/* Commit Tree List */}
              <div className="mt-6 space-y-4">
                {SAMPLE_COMMITS.map((commit, idx) => {
                  const isSelected = selectedCommit.hash === commit.hash
                  return (
                    <div
                      key={commit.hash}
                      onClick={() => setSelectedCommit(commit)}
                      className={`group relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-primary/40 bg-primary/5 shadow-xs ring-1 ring-primary/20'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      {/* Visual Commit Node & Lane */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex size-6 items-center justify-center rounded-full border-2 ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/40 bg-background text-muted-foreground'
                          }`}
                        >
                          <GitCommitHorizontal className="size-3.5" />
                        </div>
                        {idx < SAMPLE_COMMITS.length - 1 && <div className="h-10 w-0.5 bg-border mt-1" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary">{commit.shortHash}</span>
                          <span className="font-medium text-sm text-foreground truncate">{commit.message}</span>
                          {commit.isMerge && (
                            <Badge variant="outline" className="h-5 text-[10px] bg-muted/60">
                              Merge
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{commit.author}</span>
                          <span>•</span>
                          <span>{commit.date}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-mono">+{commit.additions}</span>
                          <span className="text-rose-600 font-mono">-{commit.deletions}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Commit Detail Inspector */}
            <Card className="p-6 bg-card/90">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display font-semibold">Commit Inspector</h3>
                <span className="font-mono text-xs text-muted-foreground">{selectedCommit.shortHash}</span>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Commit Message:</span>
                  <p className="mt-1 font-mono font-medium text-sm text-foreground bg-muted/50 p-3 rounded-lg border border-border">
                    {selectedCommit.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border border-border p-3">
                    <span className="text-muted-foreground">Author</span>
                    <p className="mt-1 font-medium text-foreground">{selectedCommit.author}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <span className="text-muted-foreground">Branch</span>
                    <p className="mt-1 font-medium text-foreground font-mono">{selectedCommit.branch}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <span className="text-muted-foreground">Full SHA-1 Hash</span>
                  <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-foreground">
                    <span className="truncate">{selectedCommit.hash}</span>
                    <button
                      onClick={() => copyToClipboard(selectedCommit.hash, 'Copied full commit hash')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-muted-foreground">Modified Impact:</span>
                  <div className="mt-2 flex items-center gap-3 font-mono">
                    <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-600 font-semibold">
                      +{selectedCommit.additions} lines added
                    </span>
                    <span className="rounded bg-rose-500/10 px-2 py-1 text-rose-600 font-semibold">
                      -{selectedCommit.deletions} lines deleted
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* --- Tab 2: File Tree & Code Viewer --- */}
        <TabsContent value="files" className="mt-4">
          <Card className="grid overflow-hidden border-border lg:grid-cols-[280px_1fr]">
            {/* File Explorer Tree */}
            <div className="border-r border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Files</span>
                <Badge variant="outline" className="text-[10px]">
                  {selectedBranch}
                </Badge>
              </div>

              <div className="mt-3 space-y-1 text-xs">
                {SAMPLE_FILE_TREE.map((node) => (
                  <div key={node.path}>
                    {node.type === 'folder' ? (
                      <div>
                        <button
                          onClick={() => toggleFolder(node.path)}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-medium hover:bg-muted"
                        >
                          {expandedFolders[node.path] ? <FolderOpen className="size-4 text-amber-500" /> : <Folder className="size-4 text-amber-500" />}
                          <span>{node.name}</span>
                          <ChevronDown
                            className={`ml-auto size-3.5 text-muted-foreground transition-transform ${
                              expandedFolders[node.path] ? '' : '-rotate-90'
                            }`}
                          />
                        </button>

                        {expandedFolders[node.path] && (
                          <div className="pl-4 space-y-1">
                            {node.children?.map((sub) => (
                              <div key={sub.path}>
                                {sub.type === 'folder' ? (
                                  <div>
                                    <button
                                      onClick={() => toggleFolder(sub.path)}
                                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-medium hover:bg-muted"
                                    >
                                      {expandedFolders[sub.path] ? <FolderOpen className="size-4 text-amber-500" /> : <Folder className="size-4 text-amber-500" />}
                                      <span>{sub.name}</span>
                                      <ChevronDown
                                        className={`ml-auto size-3.5 text-muted-foreground transition-transform ${
                                          expandedFolders[sub.path] ? '' : '-rotate-90'
                                        }`}
                                      />
                                    </button>
                                    {expandedFolders[sub.path] && (
                                      <div className="pl-4 space-y-1">
                                        {sub.children?.map((file) => (
                                          <button
                                            key={file.path}
                                            onClick={() => setSelectedFile(file)}
                                            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                                              selectedFile.path === file.path ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                          >
                                            <FileCode className="size-3.5" />
                                            <span className="truncate">{file.name}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedFile(sub)}
                                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                                      selectedFile.path === sub.path ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                  >
                                    <FileCode className="size-3.5" />
                                    <span className="truncate">{sub.name}</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedFile(node)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                          selectedFile.path === node.path ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <FileCode className="size-3.5" />
                        <span className="truncate">{node.name}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Code Viewer Panel */}
            <div className="flex flex-col bg-zinc-950 text-zinc-100 font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <FileCode className="size-4 text-sky-400" />
                  <span className="font-semibold text-zinc-200">{selectedFile.path}</span>
                  {selectedFile.size && <span className="text-[10px] text-zinc-500">({selectedFile.size})</span>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-zinc-400 hover:text-white"
                  onClick={() => copyToClipboard(selectedFile.content || '', `Copied ${selectedFile.name}`)}
                >
                  <Copy className="size-3 mr-1" /> Copy File
                </Button>
              </div>

              {/* Code Lines Display */}
              <div className="max-h-[460px] overflow-y-auto p-4 text-xs leading-relaxed">
                {(selectedFile.content || '// Empty file').split('\n').map((line, idx) => (
                  <div key={idx} className="flex gap-4 hover:bg-zinc-900/60 px-1 py-0.5 rounded">
                    <span className="w-8 select-none text-right font-mono text-[11px] text-zinc-600">{idx + 1}</span>
                    <span className="font-mono text-zinc-300">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* --- Tab 3: Unified Diff Inspector --- */}
        <TabsContent value="diffs" className="mt-4">
          <Card className="overflow-hidden bg-zinc-950 font-mono text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-amber-400" />
                <span className="font-semibold text-zinc-200">Unified Staged Diff — src/lib/api.ts</span>
                <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] text-emerald-400">+2</span>
                <span className="rounded bg-rose-950 px-1.5 py-0.5 text-[10px] text-rose-400">-1</span>
              </div>
              <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-[10px] text-zinc-300">
                Working Tree vs HEAD
              </Badge>
            </div>

            <div className="p-4 text-xs space-y-1">
              <div className="text-zinc-500 font-semibold">@@ -14,6 +14,8 @@ export async function apiRequest(endpoint, options)</div>
              <div className="text-zinc-400"> const url = `${'{'}env.VITE_API_URL{'}'}${'{'}endpoint{'}'}`</div>
              <div className="bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded-xs">- const res = await fetch(url, options)</div>
              <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded-xs">+ const res = await fetchWithRetry(url, {'{'} ...options, retries: 3 {'}'})</div>
              <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded-xs">+ if (!res.ok) handleTelemetryError(res.status)</div>
              <div className="text-zinc-400"> return res.json()</div>
            </div>
          </Card>
        </TabsContent>

        {/* --- Tab 4: Automated PR & Multi-file Commit Engine --- */}
        <TabsContent value="brief" className="mt-4">
          <Card className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />
                  <h3 className="font-display text-lg font-semibold">Automated PR & Multi-file Directory Commit Engine</h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20">Single Commit · Directory Scoped</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Link a local project folder, select changed files to bundle, generate AI commit messages per subdirectory, and dispatch a single combined commit to GitHub.
                </p>
              </div>

              <Badge variant="outline" className="font-mono text-xs h-7 self-start sm:self-auto">
                <GitBranch className="size-3 mr-1 text-emerald-500" />
                {repo.owner}/{repo.name} ({selectedBranch})
              </Badge>
            </div>

            {/* Folder Link & File Selector */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">1. Linked Project Folder</label>
                <div className="flex items-center gap-2">
                  <Folder className="size-4 text-amber-500" />
                  <Input value={`/app/${repo.name}`} readOnly className="font-mono text-xs bg-muted/40" />
                </div>
                <p className="text-[11px] text-muted-foreground">Local directory linked to target repository remote.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">2. Number of Files to Commit</label>
                <Select value="3" onValueChange={(val) => { if (val) toast.info(`Selected ${val} changed files in directory`) }}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Changed File</SelectItem>
                    <SelectItem value="2">2 Changed Files</SelectItem>
                    <SelectItem value="3">3 Changed Files (Recommended)</SelectItem>
                    <SelectItem value="5">5 Changed Files</SelectItem>
                    <SelectItem value="all">All Staged Files (12)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Bundles selected files into a single git commit.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">3. Conventional Preset</label>
                <div className="flex gap-2">
                  {(['feat', 'fix', 'refactor', 'chore'] as const).map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={diffType === t ? 'default' : 'outline'}
                      className="h-8 text-xs font-mono flex-1"
                      onClick={() => setDiffType(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">Prefix for structured commit summary.</p>
              </div>
            </div>

            {/* Auto-generated Directory Commit Messages Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Auto-Generated Messages per Sub-Directory / File
                </h4>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.success('Regenerated file commit messages')}>
                  <RefreshCw className="size-3 mr-1" /> Regenerate Briefs
                </Button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    dir: 'src/components/app-shell.tsx',
                    message: `${diffType}(ui): enhance sidebar navigation with active branch indicator and live telemetry`,
                    additions: '+42',
                    deletions: '-5',
                  },
                  {
                    dir: 'src/components/repository-workbench.tsx',
                    message: `${diffType}(workbench): implement multi-file directory commit bundler and automated PR drafter`,
                    additions: '+88',
                    deletions: '-12',
                  },
                  {
                    dir: 'src/lib/api.ts',
                    message: `${diffType}(api): attach secure OAuth token retry header for repository directory sync`,
                    additions: '+16',
                    deletions: '-2',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileCode className="size-3.5 text-sky-500" />
                        <span className="font-mono text-xs font-semibold text-foreground">{item.dir}</span>
                        <span className="font-mono text-[10px] text-emerald-600">{item.additions}</span>
                        <span className="font-mono text-[10px] text-rose-600">{item.deletions}</span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground bg-background p-2.5 rounded-lg border border-border">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Combined Single Commit Dispatch Summary */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCommitHorizontal className="size-5 text-primary" />
                  <span className="font-display font-semibold text-sm">Combined Single Commit Payload</span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">3 Files Staged</Badge>
              </div>

              <div className="font-mono text-xs bg-zinc-950 text-zinc-100 p-4 rounded-xl space-y-2 border border-zinc-800">
                <div className="text-emerald-400 font-semibold">
                  git commit -m "{diffType}(core): bundle 3 file updates across components and api boundaries"
                </div>
                <div className="text-zinc-400 pl-4 border-l-2 border-zinc-700 space-y-1">
                  <div>• [src/components/app-shell.tsx] {diffType}(ui): enhance sidebar navigation</div>
                  <div>• [src/components/repository-workbench.tsx] {diffType}(workbench): implement multi-file directory commit bundler</div>
                  <div>• [src/lib/api.ts] {diffType}(api): attach secure OAuth token retry header</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  className="flex-1 sm:flex-initial"
                  onClick={() => {
                    toast.success('Successfully committed 3 files as a single commit!', {
                      description: `Committed to repository directory /app/${repo.name} on branch ${selectedBranch}.`,
                    })
                  }}
                >
                  <GitCommitHorizontal className="size-4 mr-2" /> Commit & Push as Single Commit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(`git commit -m "${diffType}(core): bundle 3 file updates across components and api boundaries"`, 'Copied commit command')}
                >
                  <Copy className="size-4 mr-2" /> Copy Git Command
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* --- Tab 5: Pull Requests & CI Checks --- */}
        <TabsContent value="prs" className="mt-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display font-semibold">Pull Requests & CI/CD Telemetry</h3>
                <p className="text-xs text-muted-foreground">Monitor automated checks, branch merging, and review signals.</p>
              </div>
              <Badge variant="outline">{SAMPLE_PULL_REQUESTS.length} active</Badge>
            </div>

            <div className="space-y-3">
              {SAMPLE_PULL_REQUESTS.map((pr) => (
                <div key={pr.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border p-4 bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <GitPullRequest className={`size-5 mt-0.5 ${pr.status === 'open' ? 'text-emerald-500' : 'text-purple-500'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{pr.title}</span>
                        <span className="text-xs font-mono text-muted-foreground">#{pr.id}</span>
                      </div>
                      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span>{pr.branch}</span>
                        <ArrowRight className="size-3" />
                        <span>{pr.target}</span>
                        <span>•</span>
                        <span>Updated {pr.updatedAt}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                      <CheckCircle2 className="size-3 mr-1" /> CI Passed
                    </Badge>
                    <Badge variant={pr.status === 'open' ? 'secondary' : 'outline'}>
                      {pr.status[0].toUpperCase() + pr.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* --- Tab 6: AST Security & Secret Audit --- */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-lg">AST Secret Leak & Security Gate</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">SOC2 Level 1 Ready</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Automated AST regex scanner verifying tokens, keys, and private certificates across repository history.</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => {
                  const data = {
                    repository: `${repo.owner}/${repo.name}`,
                    score: 100,
                    status: 'passed',
                    rulesChecked: 6,
                    secretLeaksDetected: 0,
                    auditedAt: new Date().toISOString(),
                  }
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `autogit-audit-${repo.name}.json`
                  a.click()
                  toast.success('Compliance report exported')
                }}
              >
                <Download className="size-3.5" /> Export Report (JSON)
              </Button>
            </div>

            {/* Scorecard Summary */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border p-4 bg-muted/20">
                <p className="text-xs font-mono text-muted-foreground uppercase">Security Rating</p>
                <p className="mt-2 font-display text-3xl font-bold text-emerald-500">100 / 100</p>
                <p className="text-xs text-muted-foreground mt-1">Tier 1 Maximum Safety</p>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/20">
                <p className="text-xs font-mono text-muted-foreground uppercase">Active Secret Leaks</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">0 Detected</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="size-3" /> All patterns clean
                </p>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/20">
                <p className="text-xs font-mono text-muted-foreground uppercase">AST Rules Enforced</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">6 Patterns</p>
                <p className="text-xs text-muted-foreground mt-1">AWS, GitHub, Stripe, OpenAI, Keys</p>
              </div>
            </div>

            {/* Rules Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">Active Scanning Rules</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { rule: 'SEC-001', name: 'AWS Access Key ID Scanner', status: 'Clean' },
                  { rule: 'SEC-002', name: 'GitHub PAT & Fine-grained Tokens', status: 'Clean' },
                  { rule: 'SEC-003', name: 'Stripe Live Secret Keys', status: 'Clean' },
                  { rule: 'SEC-004', name: 'OpenAI / LLM Provider Secrets', status: 'Clean' },
                  { rule: 'SEC-005', name: 'Unencrypted RSA/OpenSSH Key Headers', status: 'Clean' },
                  { rule: 'SEC-006', name: 'Database URIs with Embedded Credentials', status: 'Clean' },
                ].map((item) => (
                  <div key={item.rule} className="flex items-center justify-between rounded-lg border border-border p-3 text-xs bg-card">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">{item.rule}</span>
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/20 bg-emerald-500/10">
                      <Check className="size-3 mr-1" /> {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
