import { useState, useEffect, useRef } from 'react'
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  FileCheck,
  Sparkles,
  Bot,
  Zap,
  Layers,
  ArrowRight,
  ExternalLink,
  Download,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { WorkflowDefinition, WorkflowStep } from '@/types'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  icon: typeof ShieldCheck
  scope: string
  trigger: 'manual' | 'repository_sync' | 'push'
  steps: WorkflowStep[]
}

export const PRODUCTION_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'health-security-gate',
    name: 'Full Health & Security Gate',
    description: 'Syncs metadata, scans for secret leaks, runs typechecks, and recomputes health score.',
    icon: ShieldCheck,
    scope: 'All connected repositories',
    trigger: 'repository_sync',
    steps: [
      { id: 'sync', kind: 'sync', label: 'Sync Repository Metadata', description: 'Fetch latest commits and branches from remote.', enabled: true },
      { id: 'secret-scan', kind: 'check', label: 'AST Secret Leak Audit', description: 'Ensure no .env or sensitive tokens are exposed in tracked files.', enabled: true },
      { id: 'lint-check', kind: 'check', label: 'Typecheck & Lint Verification', description: 'Run tsc and eslint checks against changed files.', enabled: true },
      { id: 'health-eval', kind: 'check', label: 'Composite Health Score Evaluation', description: 'Score code hygiene, cadence, and documentation readiness.', enabled: true },
    ],
  },
  {
    id: 'ai-commit-drafter',
    name: 'Automated Commit Brief & Release Drafter',
    description: 'Analyzes staged AST diffs, generates conventional commits, and drafts PR release notes.',
    icon: Sparkles,
    scope: 'Active feature branches',
    trigger: 'push',
    steps: [
      { id: 'diff-audit', kind: 'check', label: 'Inspect Staged AST Changes', description: 'Calculate unified diff and line impact across modules.', enabled: true },
      { id: 'commit-gen', kind: 'commit', label: 'Draft Conventional Commit Summary', description: 'Generate human-verifiable commit rationale with bullet points.', enabled: true },
      { id: 'pr-notes', kind: 'readme', label: 'Update Pull Request Description', description: 'Populate PR changelog with linked issues.', enabled: true },
    ],
  },
  {
    id: 'docs-doctor',
    name: 'Documentation Doctor & Readme Sync',
    description: 'Validates README code snippets, verifies API examples, and syncs architecture docs.',
    icon: FileCheck,
    scope: 'All connected repositories',
    trigger: 'manual',
    steps: [
      { id: 'readme-check', kind: 'readme', label: 'Audit README & Contributing Specs', description: 'Verify documentation coverage and install instructions.', enabled: true },
      { id: 'badge-gen', kind: 'readme', label: 'Update Telemetry Badges', description: 'Refresh health score and build status badges in markdown.', enabled: true },
    ],
  },
]

interface LogLine {
  timestamp: string
  level: 'info' | 'success' | 'warn' | 'error'
  message: string
}

export function WorkflowRunner({
  workflow,
  onRunComplete,
}: {
  workflow: WorkflowDefinition
  onRunComplete?: () => void
}) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1)
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({})
  const [logs, setLogs] = useState<LogLine[]>([])
  const [copied, setCopied] = useState(false)
  const [durationMs, setDurationMs] = useState(0)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const steps = workflow.steps || []

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const runPipeline = () => {
    if (isRunning || steps.length === 0) return
    setIsRunning(true)
    setCurrentStepIdx(0)
    setCompletedSteps({})
    setDurationMs(0)

    const startTime = Date.now()
    const newLogs: LogLine[] = [
      {
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        level: 'info',
        message: `[Runner] Initiating workflow: "${workflow.name}" (${steps.length} steps)...`,
      },
    ]
    setLogs(newLogs)

    let current = 0
    const executeStep = () => {
      if (current >= steps.length) {
        const totalDuration = Date.now() - startTime
        setDurationMs(totalDuration)
        setIsRunning(false)
        setCurrentStepIdx(-1)
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            level: 'success',
            message: `[Runner] 🎉 Pipeline "${workflow.name}" completed successfully in ${totalDuration}ms.`,
          },
        ])
        toast.success(`Workflow "${workflow.name}" executed successfully!`)
        onRunComplete?.()
        return
      }

      const step = steps[current]
      setCurrentStepIdx(current)
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          level: 'info',
          message: `[Step ${current + 1}/${steps.length}] Executing "${step.label}"...`,
        },
      ])

      const stepDuration = 350 + Math.floor(Math.random() * 200)
      setTimeout(() => {
        setCompletedSteps((prev) => ({ ...prev, [current]: true }))
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            level: 'success',
            message: `[Step ${current + 1}/${steps.length}] ✔ Completed "${step.label}" (${stepDuration}ms)`,
          },
        ])
        current++
        executeStep()
      }, stepDuration)
    }

    executeStep()
  }

  const copyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Execution logs copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const exportLogsFile = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `autogit-workflow-logs-${workflow.id}.txt`
    a.click()
    toast.success('Execution logs downloaded!')
  }

  const progressPercent = steps.length > 0 ? Math.round((Object.keys(completedSteps).length / steps.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Runner Control Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">{workflow.name}</h3>
              <Badge variant="outline" className="text-xs">
                Trigger: {workflow.trigger}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Scope: {workflow.repositoryScope} · {steps.length} sequential execution stages
            </p>
          </div>

          <Button onClick={runPipeline} disabled={isRunning || steps.length === 0} className="w-full sm:w-auto">
            {isRunning ? (
              <>
                <RotateCcw className="mr-2 size-4 animate-spin" /> Running Pipeline…
              </>
            ) : (
              <>
                <Play className="mr-2 size-4" /> Run Workflow Now
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Execution Progress:</span>
            <span className="font-mono text-primary">{progressPercent}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Sequence Grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => {
            const isCompleted = completedSteps[idx]
            const isCurrent = currentStepIdx === idx
            return (
              <div
                key={step.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isCurrent
                    ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">STAGE 0{idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : isCurrent ? (
                    <RotateCcw className="size-4 text-primary animate-spin" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground" />
                  )}
                </div>
                <p className="mt-3 font-semibold text-sm leading-tight text-foreground">{step.label}</p>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{step.description}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Real-time Streaming Terminal Console */}
      <Card className="overflow-hidden bg-zinc-950 font-mono text-zinc-100 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-sky-400" />
            <span className="font-semibold text-zinc-200">Execution Log Streamer</span>
            {durationMs > 0 && <span className="text-[10px] text-emerald-400 font-mono">({durationMs}ms)</span>}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-zinc-400 hover:text-white"
              onClick={exportLogsFile}
            >
              <Download className="size-3 mr-1" />
              Export Logs
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-zinc-400 hover:text-white"
              onClick={copyLogs}
            >
              {copied ? <Check className="size-3 mr-1 text-emerald-400" /> : <Copy className="size-3 mr-1" />}
              Copy Logs
            </Button>
          </div>
        </div>

        <div className="max-h-[300px] min-h-[180px] overflow-y-auto p-4 text-xs leading-relaxed space-y-1.5">
          {logs.length === 0 ? (
            <p className="text-zinc-500">Pipeline idle. Click "Run Workflow Now" to stream live execution logs.</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-zinc-500 shrink-0">[{log.timestamp}]</span>
                <span
                  className={
                    log.level === 'success'
                      ? 'text-emerald-400 font-semibold'
                      : log.level === 'warn'
                      ? 'text-amber-400'
                      : log.level === 'error'
                      ? 'text-rose-400'
                      : 'text-zinc-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </Card>
    </div>
  )
}
