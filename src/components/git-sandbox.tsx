import { useState, useRef, useEffect } from 'react'
import {
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  GitBranch,
  GitCommitHorizontal,
  ChevronRight,
  Copy,
  Check,
  Layers,
  FileCode,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CommandEntry {
  id: string
  command: string
  output: Array<{ type: 'info' | 'success' | 'warning' | 'error' | 'diff-add' | 'diff-del' | 'code' | 'head'; text: string }>
  timestamp: string
}

const INITIAL_OUTPUT: CommandEntry = {
  id: 'init',
  command: 'autogit status',
  output: [
    { type: 'info', text: 'AutoGit Engine v2.4.0 · Connected to origin (main)' },
    { type: 'success', text: '✔ Repository telemetry synchronized with upstream' },
    { type: 'head', text: 'On branch main · Up to date with origin/main' },
    { type: 'warning', text: 'Changes not staged for commit:' },
    { type: 'diff-del', text: '  modified:   src/lib/api.ts (added secure auth retry)' },
    { type: 'diff-add', text: '  modified:   src/components/app-shell.tsx (interactive navigation)' },
    { type: 'info', text: 'Type "help" or click a command chip below to execute.' },
  ],
  timestamp: '12:00:00',
}

const SUGGESTED_COMMANDS = [
  { label: 'autogit status', cmd: 'autogit status', desc: 'Inspect repo state' },
  { label: 'autogit scan', cmd: 'autogit scan', desc: 'Run security audit' },
  { label: 'autogit health', cmd: 'autogit health', desc: 'Compute health matrix' },
  { label: 'autogit diff', cmd: 'autogit diff', desc: 'View staged diff' },
  { label: 'autogit commit-brief', cmd: 'autogit commit-brief', desc: 'Generate AI commit note' },
  { label: 'autogit workflow run', cmd: 'autogit workflow run', desc: 'Execute CI pipeline' },
]

export function GitSandbox({ className }: { className?: string }) {
  const [history, setHistory] = useState<CommandEntry[]>([INITIAL_OUTPUT])
  const [inputVal, setInputVal] = useState('')
  const [currentBranch, setCurrentBranch] = useState('main')
  const [copied, setCopied] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [cmdIndex, setCmdIndex] = useState(-1)
  const pastCommands = useRef<string[]>([])
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, isRunning])

  const executeCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim()
    if (!trimmed) return
    pastCommands.current.push(trimmed)
    setCmdIndex(-1)
    setInputVal('')

    const timeStr = new Date().toLocaleTimeString([], { hour12: false })
    const entryId = crypto.randomUUID()

    if (trimmed.toLowerCase() === 'clear') {
      setHistory([])
      return
    }

    if (trimmed.toLowerCase() === 'help') {
      setHistory((prev) => [
        ...prev,
        {
          id: entryId,
          command: trimmed,
          output: [
            { type: 'head', text: 'Available AutoGit & Git Commands:' },
            { type: 'info', text: '  autogit status          Inspect branch, staged index & health' },
            { type: 'info', text: '  autogit scan            Run secret leakage & vulnerability check' },
            { type: 'info', text: '  autogit health          Multi-factor quality scorecard' },
            { type: 'info', text: '  autogit diff            Colorized unified diff preview' },
            { type: 'info', text: '  autogit commit-brief    Generate structured conventional commit' },
            { type: 'info', text: '  autogit workflow run    Trigger full verification pipeline' },
            { type: 'info', text: '  git branch              List all repository branches' },
            { type: 'info', text: '  git checkout <branch>   Switch active branch' },
            { type: 'info', text: '  git log                 Show recent commit timeline' },
            { type: 'info', text: '  clear                   Clear terminal console' },
          ],
          timestamp: timeStr,
        },
      ])
      return
    }

    if (trimmed.startsWith('git checkout ')) {
      const targetBranch = trimmed.replace('git checkout ', '').trim()
      setCurrentBranch(targetBranch)
      setHistory((prev) => [
        ...prev,
        {
          id: entryId,
          command: trimmed,
          output: [
            { type: 'success', text: `Switched to branch '${targetBranch}'` },
            { type: 'info', text: `Your branch is up to date with 'origin/${targetBranch}'.` },
          ],
          timestamp: timeStr,
        },
      ])
      return
    }

    if (trimmed === 'git branch') {
      setHistory((prev) => [
        ...prev,
        {
          id: entryId,
          command: trimmed,
          output: [
            { type: 'head', text: currentBranch === 'main' ? '* main' : '  main' },
            { type: currentBranch === 'feature/auto-pr' ? 'head' : 'info', text: currentBranch === 'feature/auto-pr' ? '* feature/auto-pr' : '  feature/auto-pr' },
            { type: currentBranch === 'chore/health-gate' ? 'head' : 'info', text: currentBranch === 'chore/health-gate' ? '* chore/health-gate' : '  chore/health-gate' },
          ],
          timestamp: timeStr,
        },
      ])
      return
    }

    if (trimmed === 'git log') {
      setHistory((prev) => [
        ...prev,
        {
          id: entryId,
          command: trimmed,
          output: [
            { type: 'head', text: 'commit e4a91b2 (HEAD -> ' + currentBranch + ', origin/' + currentBranch + ')' },
            { type: 'info', text: 'Author: AutoGit Engineer <dev@autogit.io>' },
            { type: 'info', text: 'Date:   Today 11:42:18 +0000' },
            { type: 'code', text: '    feat(shell): implement interactive navigation & live signals' },
            { type: 'head', text: 'commit 8c3d90f' },
            { type: 'info', text: 'Author: AutoGit Bot <bot@autogit.io>' },
            { type: 'info', text: 'Date:   Yesterday 18:20:04 +0000' },
            { type: 'code', text: '    chore(audit): automated health gate verification passed (94/100)' },
          ],
          timestamp: timeStr,
        },
      ])
      return
    }

    if (trimmed === 'autogit scan') {
      setIsRunning(true)
      setTimeout(() => {
        setIsRunning(false)
        setHistory((prev) => [
          ...prev,
          {
            id: entryId,
            command: trimmed,
            output: [
              { type: 'info', text: 'Scanning 48 tracked files across 14 modules...' },
              { type: 'success', text: '✔ Secret leak check: 0 secrets detected in working tree' },
              { type: 'success', text: '✔ Dependency audit: 0 high/critical CVEs' },
              { type: 'success', text: '✔ Branch protection rule: Signed commits verified' },
              { type: 'head', text: '🛡 Security Status: PASS (Clean for production)' },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          },
        ])
      }, 450)
      return
    }

    if (trimmed === 'autogit health') {
      setIsRunning(true)
      setTimeout(() => {
        setIsRunning(false)
        setHistory((prev) => [
          ...prev,
          {
            id: entryId,
            command: trimmed,
            output: [
              { type: 'head', text: '══ AutoGit Repository Health Matrix ══' },
              { type: 'success', text: '  ▶ Commit Cadence (recency & velocity):   98/100  [EXCELLENT]' },
              { type: 'success', text: '  ▶ Code Hygiene & Linting:                95/100  [CLEAN]' },
              { type: 'success', text: '  ▶ Documentation & README:                90/100  [PASS]' },
              { type: 'info', text: '  ▶ PR Turnaround & Issue Velocity:        92/100  [ACTIVE]' },
              { type: 'head', text: '  ★ Overall Workspace Health:              94/100 (Tier 1)' },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          },
        ])
      }, 500)
      return
    }

    if (trimmed === 'autogit diff') {
      setHistory((prev) => [
        ...prev,
        {
          id: entryId,
          command: trimmed,
          output: [
            { type: 'head', text: 'diff --git a/src/lib/api.ts b/src/lib/api.ts' },
            { type: 'info', text: 'index 4a12..9f88 100644' },
            { type: 'info', text: '@@ -14,6 +14,8 @@ export async function apiRequest(endpoint, options)' },
            { type: 'diff-del', text: '-  const res = await fetch(url, options)' },
            { type: 'diff-add', text: '+  const res = await fetchWithRetry(url, { ...options, retries: 3 })' },
            { type: 'diff-add', text: '+  if (!res.ok) handleTelemetryError(res.status)' },
            { type: 'code', text: '   return res.json()' },
          ],
          timestamp: timeStr,
        },
      ])
      return
    }

    if (trimmed === 'autogit commit-brief') {
      setIsRunning(true)
      setTimeout(() => {
        setIsRunning(false)
        setHistory((prev) => [
          ...prev,
          {
            id: entryId,
            command: trimmed,
            output: [
              { type: 'head', text: '✨ Generated Conventional Commit Brief:' },
              { type: 'success', text: 'feat(api): add resilient auth retry strategy with telemetry error handler' },
              { type: 'code', text: '• Wraps outgoing endpoint requests in 3-phase exponential backoff' },
              { type: 'code', text: '• Emits typed telemetry audit event on non-recoverable failure' },
              { type: 'code', text: '• Verified with vitest test suites (13/13 passing)' },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          },
        ])
      }, 600)
      return
    }

    if (trimmed === 'autogit workflow run') {
      setIsRunning(true)
      setTimeout(() => {
        setIsRunning(false)
        setHistory((prev) => [
          ...prev,
          {
            id: entryId,
            command: trimmed,
            output: [
              { type: 'info', text: '🚀 Dispatching pipeline: "Full Health & Security Gate"...' },
              { type: 'success', text: '[1/4] ✔ Syncing repository metadata (210ms)' },
              { type: 'success', text: '[2/4] ✔ Running AST security & secret leak scan (180ms)' },
              { type: 'success', text: '[3/4] ✔ Evaluating TypeScript typecheck & test suite (340ms)' },
              { type: 'success', text: '[4/4] ✔ Computing updated health score -> 94/100 (95ms)' },
              { type: 'head', text: '🎉 Pipeline completed in 825ms · All 4 steps passed' },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          },
        ])
      }, 750)
      return
    }

    if (trimmed === 'autogit status' || trimmed === 'git status') {
      setHistory((prev) => [
        ...prev,
        {
          id: entryId,
          command: trimmed,
          output: [
            { type: 'head', text: `On branch ${currentBranch}` },
            { type: 'info', text: `Your branch is up to date with 'origin/${currentBranch}'.` },
            { type: 'warning', text: 'Changes not staged for commit:' },
            { type: 'diff-del', text: '  modified:   src/lib/api.ts' },
            { type: 'diff-add', text: '  modified:   src/components/app-shell.tsx' },
            { type: 'success', text: 'Workspace health: 94/100 · Clean state' },
          ],
          timestamp: timeStr,
        },
      ])
      return
    }

    // Default handler for custom commands
    setHistory((prev) => [
      ...prev,
      {
        id: entryId,
        command: trimmed,
        output: [
          { type: 'info', text: `Executed: "${trimmed}"` },
          { type: 'success', text: 'Command acknowledged by AutoGit daemon.' },
          { type: 'info', text: 'Type "help" for a list of interactive operations.' },
        ],
        timestamp: timeStr,
      },
    ])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (pastCommands.current.length > 0) {
        const nextIndex = cmdIndex < pastCommands.current.length - 1 ? cmdIndex + 1 : cmdIndex
        setCmdIndex(nextIndex)
        setInputVal(pastCommands.current[pastCommands.current.length - 1 - nextIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (cmdIndex > 0) {
        const nextIndex = cmdIndex - 1
        setCmdIndex(nextIndex)
        setInputVal(pastCommands.current[pastCommands.current.length - 1 - nextIndex] || '')
      } else if (cmdIndex === 0) {
        setCmdIndex(-1)
        setInputVal('')
      }
    }
  }

  const copyTerminal = () => {
    const text = history.map((h) => `$ ${h.command}\n${h.output.map((o) => o.text).join('\n')}`).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border border-border/80 bg-zinc-950 font-mono text-zinc-100 shadow-2xl overflow-hidden',
        className
      )}
    >
      {/* Terminal Title Bar */}
      <div className="flex h-11 items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-red-500/80" />
          <div className="size-3 rounded-full bg-amber-500/80" />
          <div className="size-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 flex items-center gap-1.5 text-xs text-zinc-400 font-sans font-medium">
            <Terminal className="size-3.5 text-sky-400" />
            autogit-cli — {currentBranch}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-6 border-zinc-700 bg-zinc-800/80 text-[10px] text-zinc-300">
            <GitBranch className="mr-1 size-3 text-emerald-400" />
            {currentBranch}
          </Badge>
          <button
            onClick={copyTerminal}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Copy terminal session"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>
          <button
            onClick={() => setHistory([INITIAL_OUTPUT])}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Reset terminal"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="max-h-[360px] min-h-[260px] overflow-y-auto p-4 text-xs leading-relaxed space-y-4">
        {history.map((entry) => (
          <div key={entry.id} className="space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-emerald-400 font-bold">➜</span>
              <span className="text-sky-400 font-semibold">autogit</span>
              <span className="text-zinc-500">({currentBranch})</span>
              <span className="text-zinc-200 font-medium">{entry.command}</span>
              <span className="ml-auto text-[10px] text-zinc-600">{entry.timestamp}</span>
            </div>
            <div className="pl-4 space-y-0.5 font-mono">
              {entry.output.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    line.type === 'head' && 'font-semibold text-sky-300',
                    line.type === 'success' && 'text-emerald-400',
                    line.type === 'warning' && 'text-amber-300',
                    line.type === 'error' && 'text-red-400',
                    line.type === 'diff-add' && 'text-emerald-300 bg-emerald-950/40 px-1 rounded-sm w-fit',
                    line.type === 'diff-del' && 'text-rose-300 bg-rose-950/40 px-1 rounded-sm w-fit',
                    line.type === 'code' && 'text-zinc-300 pl-2 border-l-2 border-zinc-700',
                    line.type === 'info' && 'text-zinc-400'
                  )}
                >
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        ))}

        {isRunning && (
          <div className="flex items-center gap-2 text-sky-400 pl-4 animate-pulse">
            <RotateCcw className="size-3.5 animate-spin" />
            <span>Executing command pipeline...</span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Suggested Command Chips */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800/80 bg-zinc-900/50 p-2.5">
        <span className="text-[11px] font-sans text-zinc-400 mr-1 flex items-center gap-1">
          <Sparkles className="size-3 text-amber-400" />
          Quick run:
        </span>
        {SUGGESTED_COMMANDS.map((sc) => (
          <button
            key={sc.cmd}
            onClick={() => executeCommand(sc.cmd)}
            disabled={isRunning}
            className="group inline-flex items-center gap-1 rounded-md border border-zinc-700/70 bg-zinc-800/90 px-2 py-1 text-[11px] text-zinc-200 transition-all hover:border-sky-500 hover:bg-sky-950/40 hover:text-sky-200"
          >
            <code>{sc.label}</code>
            <ChevronRight className="size-3 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-400" />
          </button>
        ))}
      </div>

      {/* Terminal Input Line */}
      <div className="flex items-center gap-2 border-t border-zinc-800 bg-zinc-900/90 px-4 py-2.5">
        <span className="text-emerald-400 font-bold">➜</span>
        <span className="text-sky-400 font-semibold text-xs">autogit</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type 'help', 'autogit scan', or git commands..."
          disabled={isRunning}
          className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => executeCommand(inputVal)}
          disabled={!inputVal.trim() || isRunning}
          className="h-7 px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <Play className="size-3 mr-1" /> Run
        </Button>
      </div>
    </div>
  )
}
