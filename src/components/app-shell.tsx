import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  GitBranch,
  GitFork,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Workflow,
  X,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/lib/notifications'
import { useRepositories, useSyncRepositories } from '@/lib/repositories'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

const primaryNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/repositories', label: 'Repositories', icon: GitBranch },
  { to: '/automation', label: 'Automation', icon: Bot },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/activity', label: 'Activity', icon: BookOpen },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

const secondaryNav = [
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/help', label: 'Help & Docs', icon: CircleHelp },
]

function Logo() {
  return (
    <NavLink to="/" className="flex items-center gap-3 font-display text-base font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GitBranch className="size-4" />
      </span>
      <span>
        Auto<span className="text-primary font-bold">Git</span>
      </span>
    </NavLink>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const { data: notifications = [] } = useNotifications()
  const { data: repositoriesData } = useRepositories({ page: 1, pageSize: 10, search: '', visibility: 'all', language: '', sort: 'updated' })
  const syncMutation = useSyncRepositories()

  const unreadCount = notifications.filter((n) => !n.read).length
  const repositories = repositoriesData?.data ?? []

  // Global ⌘ K keyboard shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
      isActive ? 'bg-primary/10 text-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      collapsed && 'lg:justify-center lg:px-0'
    )

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card p-4 transition-all lg:static lg:translate-x-0',
            collapsed && 'lg:w-[76px]',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-12 items-center justify-between px-2">
            <Logo />
            <button aria-label="Close menu" className="text-muted-foreground hover:text-foreground lg:hidden" onClick={() => setMobileOpen(false)}>
              <X className="size-5" />
            </button>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Primary navigation">
            {primaryNav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={navItemClass}>
                <div className="relative">
                  <Icon className="size-4.5" />
                  {to === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 size-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className={cn(collapsed && 'lg:hidden')}>{label}</span>
                {to === '/notifications' && unreadCount > 0 && !collapsed && (
                  <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            ))}

            <div className="my-5 border-t border-border" />

            {secondaryNav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={navItemClass}>
                <Icon className="size-4.5" />
                <span className={cn(collapsed && 'lg:hidden')}>{label}</span>
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden h-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </aside>

        {/* Content Area */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
            <button
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <span className="font-medium text-foreground">{location.pathname === '/dashboard' ? 'Workspace' : 'AutoGit'}</span>
              <span>/</span>
              <span className="capitalize">{location.pathname.split('/')[1] || 'Dashboard'}</span>
            </div>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setCommandOpen(true)}
                className="hidden h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
                aria-label="Quick Switcher"
              >
                <Search className="size-3.5" />
                <span>Search…</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘ K</kbd>
              </button>

              <NavLink
                to="/notifications"
                className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="size-4.5" />
                {unreadCount > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />}
              </NavLink>

              <NavLink
                to="/profile"
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                aria-label="Profile"
              >
                <UserRound className="size-4.5" />
              </NavLink>
            </div>
          </header>

          {/* Main Body */}
          <main className="mx-auto max-w-[1440px] p-5 sm:p-8">{children}</main>
        </div>
      </div>

      {/* Global Command Palette Dialog */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type a command, search repositories, or switch views…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => {
                navigate('/dashboard')
                setCommandOpen(false)
              }}
            >
              <LayoutDashboard className="mr-2 size-4" />
              <span>Go to Dashboard</span>
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                navigate('/repositories')
                setCommandOpen(false)
              }}
            >
              <GitBranch className="mr-2 size-4" />
              <span>Browse Repositories</span>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                navigate('/automation')
                setCommandOpen(false)
              }}
            >
              <Bot className="mr-2 size-4" />
              <span>Open Automation Workflows</span>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                navigate('/analytics')
                setCommandOpen(false)
              }}
            >
              <BarChart3 className="mr-2 size-4" />
              <span>View Analytics</span>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                navigate('/activity')
                setCommandOpen(false)
              }}
            >
              <BookOpen className="mr-2 size-4" />
              <span>Activity Audit Trail</span>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                navigate('/notifications')
                setCommandOpen(false)
              }}
            >
              <Bell className="mr-2 size-4" />
              <span>Notifications Feed</span>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                navigate('/settings')
                setCommandOpen(false)
              }}
            >
              <Settings className="mr-2 size-4" />
              <span>Workspace Settings</span>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                navigate('/help')
                setCommandOpen(false)
              }}
            >
              <HelpCircle className="mr-2 size-4" />
              <span>Help & Documentation</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                syncMutation.mutate()
                setCommandOpen(false)
              }}
            >
              <RefreshCw className="mr-2 size-4" />
              <span>Sync GitHub Repositories Now</span>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                navigate('/automation')
                setCommandOpen(false)
              }}
            >
              <Plus className="mr-2 size-4" />
              <span>Create New Workflow</span>
            </CommandItem>
          </CommandGroup>

          {repositories.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent Repositories">
                {repositories.slice(0, 5).map((repo) => (
                  <CommandItem
                    key={repo.id}
                    onSelect={() => {
                      navigate(`/repositories/${repo.id}`)
                      setCommandOpen(false)
                    }}
                  >
                    <GitFork className="mr-2 size-4 text-muted-foreground" />
                    <span>
                      {repo.owner}/{repo.name}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">{repo.healthScore}/100</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  )
}
