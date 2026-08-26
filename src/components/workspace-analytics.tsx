import { useState, useMemo } from 'react'
import {
  BarChart3,
  GitCommitHorizontal,
  GitBranch,
  Flame,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Code2,
  Download,
  Calendar,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DayActivity {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export function WorkspaceAnalytics() {
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null)
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('1y')

  // Generate contribution activity dataset filtered by selected time range
  const { weeks, totalContributions, currentStreak, maxStreak } = useMemo(() => {
    const numWeeks = timeRange === '30d' ? 5 : timeRange === '90d' ? 13 : 52
    const totalDays = numWeeks * 7
    const result: DayActivity[][] = []
    let total = 0
    let maxS = 0
    let currS = 0

    const today = new Date()

    let currentWeek: DayActivity[] = []
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dayOfWeek = d.getDay()
      
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const baseChance = isWeekend ? 0.35 : 0.85
      const count = Math.random() < baseChance ? Math.floor(Math.random() * 8) + 1 : 0

      let level: 0 | 1 | 2 | 3 | 4 = 0
      if (count >= 7) level = 4
      else if (count >= 4) level = 3
      else if (count >= 2) level = 2
      else if (count >= 1) level = 1

      total += count

      if (count > 0) {
        currS++
        if (currS > maxS) maxS = currS
      } else {
        currS = 0
      }

      const entry: DayActivity = {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        count,
        level,
      }

      currentWeek.push(entry)
      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) result.push(currentWeek)

    return {
      weeks: result,
      totalContributions: total,
      currentStreak: 12,
      maxStreak: maxS > 18 ? maxS : 24,
    }
  }, [timeRange])

  const exportCSV = () => {
    let csv = 'Date,Contributions\n'
    weeks.flat().forEach((day) => {
      csv += `"${day.date}",${day.count}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `autogit-analytics-${timeRange}.csv`
    a.click()
    toast.success(`Exported ${timeRange} analytics as CSV`)
  }

  const exportJSON = () => {
    const data = {
      timeRange,
      totalContributions,
      currentStreak,
      maxStreak,
      activity: weeks.flat(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `autogit-analytics-${timeRange}.json`
    a.click()
    toast.success(`Exported ${timeRange} analytics as JSON`)
  }

  const languages = [
    { name: 'TypeScript', percentage: 58.4, color: 'bg-sky-500' },
    { name: 'Rust', percentage: 22.1, color: 'bg-orange-500' },
    { name: 'Python', percentage: 12.5, color: 'bg-emerald-500' },
    { name: 'Go', percentage: 7.0, color: 'bg-cyan-500' },
  ]

  const getColorClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-emerald-950/60 dark:bg-emerald-950 border-emerald-800/40'
      case 2:
        return 'bg-emerald-700/80 dark:bg-emerald-700 border-emerald-600'
      case 3:
        return 'bg-emerald-500 dark:bg-emerald-500 border-emerald-400'
      case 4:
        return 'bg-emerald-300 dark:bg-emerald-300 border-emerald-200'
      default:
        return 'bg-muted/40 border-border/40'
    }
  }

  return (
    <div className="space-y-6">
      {/* 52-Week Contribution Matrix */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <GitCommitHorizontal className="size-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Contribution Activity Matrix</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {totalContributions.toLocaleString()} total commits and workflow dispatches ({timeRange}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range Filter Selector */}
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              {(['30d', '90d', '1y'] as const).map((tr) => (
                <button
                  key={tr}
                  onClick={() => setTimeRange(tr)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    timeRange === tr ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tr === '30d' ? '30 Days' : tr === '90d' ? '90 Days' : '1 Year'}
                </button>
              ))}
            </div>

            {/* Export Actions */}
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCSV}>
              <Download className="size-3 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportJSON}>
              <Download className="size-3 mr-1" /> JSON
            </Button>

            <div className="flex items-center gap-3 text-xs font-medium pl-2 border-l border-border">
              <div className="flex items-center gap-1.5 text-amber-500">
                <Flame className="size-4" />
                <span>{currentStreak} day streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="mt-6 overflow-x-auto pb-2">
          <div className="min-w-[720px] flex gap-1.5 items-start">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`size-3 rounded-xs border transition-transform hover:scale-125 cursor-pointer ${getColorClass(
                      day.level
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Hover Status Legend */}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <div>
              {hoveredDay ? (
                <span className="font-medium text-foreground">
                  {hoveredDay.count} contribution{hoveredDay.count === 1 ? '' : 's'} on {hoveredDay.date}
                </span>
              ) : (
                <span>Hover over any day square for contribution telemetry</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px]">
              <span>Less</span>
              <div className="size-2.5 rounded-xs bg-muted/40 border border-border/40" />
              <div className="size-2.5 rounded-xs bg-emerald-950/60 border border-emerald-800/40" />
              <div className="size-2.5 rounded-xs bg-emerald-700/80 border border-emerald-600" />
              <div className="size-2.5 rounded-xs bg-emerald-500 border border-emerald-400" />
              <div className="size-2.5 rounded-xs bg-emerald-300 border border-emerald-200" />
              <span>More</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Language Composition & ROI Velocity */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Language Breakdown */}
        <Card className="p-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Code2 className="size-5 text-primary" />
            <h3 className="font-display font-semibold">Language Composition</h3>
          </div>

          {/* Stacked Percentage Bar */}
          <div className="mt-6 h-3 flex overflow-hidden rounded-full bg-muted">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className={`h-full ${lang.color}`}
                style={{ width: `${lang.percentage}%` }}
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>

          {/* Language Legends */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
            {languages.map((lang) => (
              <div key={lang.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <div className={`size-2.5 rounded-full ${lang.color}`} />
                  <span className="font-medium">{lang.name}</span>
                </div>
                <span className="font-mono text-muted-foreground">{lang.percentage}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Automation Velocity & Hours Saved */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sparkles className="size-5 text-primary" />
              <h3 className="font-display font-semibold">Engineering Velocity & ROI</h3>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <span className="text-xs text-muted-foreground">Hours Saved / Month</span>
                <p className="mt-2 font-display text-3xl font-bold text-primary">38.4 hrs</p>
                <p className="mt-1 text-[11px] text-emerald-600 font-medium">↑ 18% vs last month</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <span className="text-xs text-muted-foreground">AST Scans Completed</span>
                <p className="mt-2 font-display text-3xl font-bold text-primary">142</p>
                <p className="mt-1 text-[11px] text-emerald-600 font-medium">100% pass rate</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span>AutoGit automation saves an estimated 48 minutes per developer each week.</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
