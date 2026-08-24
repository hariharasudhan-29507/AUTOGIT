import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  GitPullRequest,
  BookOpen,
  FileCheck,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from 'react-router-dom'

interface HealthFactors {
  daysSincePush: number
  testCoverage: number
  openIssuesRatio: number
  docCoverage: number
  securityCompliance: number
}

export function HealthCalculator() {
  const [repoUrl, setRepoUrl] = useState('')
  const [factors, setFactors] = useState<HealthFactors>({
    daysSincePush: 3,
    testCoverage: 85,
    openIssuesRatio: 12,
    docCoverage: 90,
    securityCompliance: 98,
  })

  // Calculate composite score dynamically
  const score = useMemo(() => {
    // Recency score (0-25 pts)
    const recencyPts = Math.max(0, 25 - factors.daysSincePush * 0.8)
    // Test coverage (0-20 pts)
    const testPts = (factors.testCoverage / 100) * 20
    // Issue management (0-20 pts) - fewer open issues ratio is better
    const issuePts = Math.max(0, 20 - factors.openIssuesRatio * 0.4)
    // Docs (0-15 pts)
    const docPts = (factors.docCoverage / 100) * 15
    // Security (0-20 pts)
    const secPts = (factors.securityCompliance / 100) * 20

    return Math.min(100, Math.max(0, Math.round(recencyPts + testPts + issuePts + docPts + secPts)))
  }, [factors])

  const grade = useMemo(() => {
    if (score >= 85) return { text: 'Tier 1 · Production Ready', tone: 'healthy', color: 'text-emerald-500' }
    if (score >= 60) return { text: 'Tier 2 · Moderate Health', tone: 'moderate', color: 'text-amber-500' }
    return { text: 'Tier 3 · Action Required', tone: 'attention', color: 'text-rose-500' }
  }, [score])

  const recommendations = useMemo(() => {
    const list = []
    if (factors.daysSincePush > 14) list.push('Commit cadence has dropped. Re-synchronize main branch.')
    if (factors.testCoverage < 80) list.push('Add automated unit and regression test step in AutoGit workflow.')
    if (factors.openIssuesRatio > 25) list.push('Issue triage overdue. Run auto-triage automation to label stale issues.')
    if (factors.docCoverage < 80) list.push('README coverage incomplete. Enable AutoGit README Doctor to auto-generate docs.')
    if (factors.securityCompliance < 95) list.push('Enable AST secret scanner to catch leaked tokens before push.')
    if (list.length === 0) list.push('Repository is in pristine condition. All health gates pass smoothly.')
    return list
  }, [factors])

  const handleSimulateRepo = (name: string, f: HealthFactors) => {
    setRepoUrl(name)
    setFactors(f)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
      {/* Interactive Controls Card */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="size-5 text-primary" />
              <h3 className="font-display text-xl font-semibold">Repository Health Calculator</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Adjust telemetry sliders or select a preset repo to test the algorithm.</p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">Live Formula Engine</Badge>
        </div>

        {/* Preset repo chips */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Presets:</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() =>
              handleSimulateRepo('facebook/react', {
                daysSincePush: 1,
                testCoverage: 92,
                openIssuesRatio: 18,
                docCoverage: 95,
                securityCompliance: 99,
              })
            }
          >
            react (96/100)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() =>
              handleSimulateRepo('vercel/next.js', {
                daysSincePush: 2,
                testCoverage: 88,
                openIssuesRatio: 22,
                docCoverage: 92,
                securityCompliance: 96,
              })
            }
          >
            next.js (91/100)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() =>
              handleSimulateRepo('legacy/monolith', {
                daysSincePush: 45,
                testCoverage: 42,
                openIssuesRatio: 65,
                docCoverage: 30,
                securityCompliance: 60,
              })
            }
          >
            legacy-repo (44/100)
          </Button>
        </div>

        {/* Sliders Grid */}
        <div className="mt-6 space-y-5">
          {/* Days since push */}
          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Activity className="size-3.5 text-primary" /> Push Recency:
              </span>
              <span className="font-mono text-primary">{factors.daysSincePush} days ago</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={factors.daysSincePush}
              onChange={(e) => setFactors({ ...factors, daysSincePush: Number(e.target.value) })}
              className="mt-2 w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Test Coverage */}
          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <FileCheck className="size-3.5 text-primary" /> Test & Type Coverage:
              </span>
              <span className="font-mono text-primary">{factors.testCoverage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={factors.testCoverage}
              onChange={(e) => setFactors({ ...factors, testCoverage: Number(e.target.value) })}
              className="mt-2 w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Open Issues Ratio */}
          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <GitPullRequest className="size-3.5 text-primary" /> Open Issues Backlog:
              </span>
              <span className="font-mono text-primary">{factors.openIssuesRatio} pending</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={factors.openIssuesRatio}
              onChange={(e) => setFactors({ ...factors, openIssuesRatio: Number(e.target.value) })}
              className="mt-2 w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Doc Coverage */}
          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-primary" /> Documentation & README Quality:
              </span>
              <span className="font-mono text-primary">{factors.docCoverage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={factors.docCoverage}
              onChange={(e) => setFactors({ ...factors, docCoverage: Number(e.target.value) })}
              className="mt-2 w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Security Compliance */}
          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" /> Security & Secret Audit:
              </span>
              <span className="font-mono text-primary">{factors.securityCompliance}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={factors.securityCompliance}
              onChange={(e) => setFactors({ ...factors, securityCompliance: Number(e.target.value) })}
              className="mt-2 w-full accent-primary cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* Score Output & Actionable Diagnostics */}
      <Card className="flex flex-col justify-between p-6 md:p-8 bg-card/90">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Computed Score</p>
              <h4 className="mt-1 font-display text-2xl font-bold">{grade.text}</h4>
            </div>
            <div className="flex size-20 items-center justify-center rounded-2xl border-2 border-border bg-muted/40 font-mono text-3xl font-bold">
              <span className={grade.color}>{score}</span>
              <span className="text-xs text-muted-foreground font-normal">/100</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                score >= 85 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>

          {/* Diagnostic Breakdown Matrix */}
          <div className="mt-6 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Diagnostic Recommendations:</p>
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border/80 bg-background/60 p-3 text-xs leading-relaxed">
                <CheckCircle2 className="size-4 shrink-0 text-primary mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-8 border-t border-border pt-5">
          <Link
            to="/automation"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
          >
            <Zap className="size-4" /> Automate this repository <ArrowRight className="size-4" />
          </Link>
        </div>
      </Card>
    </div>
  )
}
