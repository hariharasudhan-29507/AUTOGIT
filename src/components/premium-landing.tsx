import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import CountUp from 'react-countup'
import {
  Activity,
  ArrowRight,
  Bot,
  CircleDot,
  Code2,
  Command,
  GitBranch,
  Github,
  Network,
  Orbit,
  ShieldCheck,
  Sparkles,
  Workflow,
  Terminal,
  Sliders,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { WorkflowScene } from '@/components/workflow-scene'
import { GitSandbox } from '@/components/git-sandbox'
import { HealthCalculator } from '@/components/health-calculator'

const steps = [
  { icon: Github, name: 'Connect repository', detail: 'Authorize the projects you choose with zero stored passwords.' },
  { icon: Network, name: 'Analyze the signal', detail: 'Read branches, AST changes, secret leaks, and health metrics.' },
  { icon: Sparkles, name: 'Generate next action', detail: 'Get structured conventional commits and verified recommendations.' },
  { icon: GitBranch, name: 'Review and push', detail: 'Keep the final decision human while automation handles the routine.' },
]

export function PremiumLanding() {
  const reduceMotion = useReducedMotion()

  return (
    <main>
      {/* 3D Hero Section */}
      <section className="relative min-h-[720px] overflow-hidden border-y border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(125,211,252,.14),transparent_35%),radial-gradient(circle_at_18%_70%,rgba(167,139,250,.12),transparent_30%),linear-gradient(115deg,#07090e_0%,#0b1019_48%,#111828_100%)]" />
        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:pb-20 lg:pt-20">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 max-w-2xl"
          >
            <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[.22em] text-sky-100/55">
              <span className="size-2 rounded-full bg-cyan-300 shadow-[0_0_18px_#67e8f9]" />
              Repository Operating System
            </div>
            <h1 className="mt-7 font-display text-6xl font-semibold leading-[.9] tracking-[-.075em] text-white sm:text-8xl">
              Keep the work<br />
              <span className="text-white/35">in motion.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-white/60 sm:text-lg">
              AutoGit turns repository signals into an actionable sequence of decisions, so your next commit is obvious, safe, and clean.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/signup"
                  className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-zinc-100 transition-colors shadow-lg shadow-white/10"
                >
                  Continue with GitHub <ArrowRight className="size-4" />
                </Link>
              </motion.div>
              <a href="#sandbox" className="inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors">
                Try Live Git Sandbox <ArrowRight className="size-4" />
              </a>
            </div>
            <div className="mt-12 flex gap-8 border-t border-white/10 pt-5 text-xs text-white/40 font-mono">
              <span>01 / CONNECT</span>
              <span>02 / INSPECT</span>
              <span>03 / AUTOMATE</span>
            </div>
          </motion.div>
          <div className="absolute -right-[12%] top-[8%] h-[620px] w-[75%] opacity-95 lg:relative lg:right-auto lg:top-auto lg:h-[660px] lg:w-full">
            <WorkflowScene reducedMotion={reduceMotion ?? false} />
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="border-b border-white/10 bg-[#0b1019] px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
          <Metric value={48} suffix="m" label="saved per developer, weekly" />
          <Metric value={3} suffix="×" label="fewer context switches" />
          <Metric value={99.9} suffix="%" decimals={1} label="automation visibility" />
        </div>
      </section>

      {/* Interactive Git Sandbox Live Experience */}
      <section id="sandbox" className="border-b border-white/10 bg-[#0d1320] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-mono uppercase tracking-[.22em] text-cyan-300/60">Live CLI Playground</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Experience the engine right in your browser.
              </h2>
              <p className="mt-4 max-w-xl text-base text-zinc-400">
                Run authentic AutoGit commands, inspect AST diffs, generate conventional commit notes, and verify repository security gates.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20 transition-colors w-fit"
            >
              Open Full Workspace <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10">
            <GitSandbox />
          </div>
        </div>
      </section>

      {/* Interactive Workflow Deck */}
      <WorkflowDeck />

      {/* Interactive Health Engine Calculator */}
      <section className="bg-[#f5f7fb] dark:bg-zinc-950 px-5 py-24 text-foreground sm:px-8 border-y border-border">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">Multi-factor Algorithm</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Repository Health Engine.
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Calculate the health score of any codebase based on commit cadence, test coverage, issue backlog, documentation, and AST secret safety.
            </p>
          </div>

          <HealthCalculator />
        </div>
      </section>

      {/* Automation Showcase */}
      <section className="border-y border-white/10 bg-[#0b1019] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[.22em] text-cyan-100/40">Automation Engine</p>
              <h2 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[.95] tracking-[-.06em] text-white">
                Make intent executable.
              </h2>
            </div>
            <Link to="/automation" className="inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white">
              Explore automation <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <AutomationCard icon={Bot} title="AI commit briefs" text="Convert a focused diff into a readable conventional commit message with the why intact." />
            <AutomationCard icon={Workflow} title="Preview before push" text="Every sequence is visible, reorderable, and verified against AST security gates first." />
            <AutomationCard icon={Activity} title="Watch the result" text="Follow branches, pull requests, and live streaming execution logs in one continuous trail." />
          </div>
        </div>
      </section>

      {/* Developer Momentum Grid */}
      <section className="bg-[#eef2ff] dark:bg-zinc-900/60 px-5 py-24 text-foreground sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[.22em] text-indigo-500">Built Around Developer Momentum</p>
          <div className="mt-5 grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
            <h2 className="font-display text-5xl font-semibold leading-[.95] tracking-[-.06em]">
              Your codebase is a living system. Treat it like one.
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <UseCase icon={Code2} title="Solo builders" text="Keep a project’s next useful action close while you stay in flow." />
              <UseCase icon={Command} title="Product teams" text="Make asynchronous repository work understandable at a glance." />
              <UseCase icon={GitBranch} title="Platform teams" text="See cross-repository automation and health without chasing status." />
              <UseCase icon={ShieldCheck} title="Engineering leaders" text="Give people context and control without hiding side effects." />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Metric({ value, suffix, label, decimals = 0 }: { value: number; suffix: string; label: string; decimals?: number }) {
  return (
    <div className="border-l border-white/10 pl-5 first:border-l-0 sm:first:pl-0">
      <p className="font-display text-4xl font-semibold tracking-[-.06em] text-white">
        <CountUp end={value} decimals={decimals} duration={1.8} enableScrollSpy />
        {suffix}
      </p>
      <p className="mt-2 text-sm text-white/45">{label}</p>
    </div>
  )
}

function WorkflowDeck() {
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()
  const item = steps[active]
  const Icon = item.icon

  return (
    <section id="workflow" className="overflow-hidden bg-[#e7ecf4] dark:bg-zinc-900 px-5 py-24 text-foreground sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.75fr_1.25fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.22em] text-muted-foreground">Interactive Workflow</p>
          <h2 className="mt-5 max-w-md font-display text-5xl font-semibold leading-[.95] tracking-[-.06em]">The work, made tangible.</h2>
          <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">Move through the sequence. Each step makes the next one more confident.</p>
          <div className="mt-9 grid gap-2">
            {steps.map((step, index) => (
              <button
                key={step.name}
                onClick={() => setActive(index)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${
                  active === index ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:bg-card/50'
                }`}
              >
                <span className={`flex size-7 items-center justify-center rounded-md font-mono text-xs ${active === index ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                {step.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-[420px]">
          {steps.map((step, index) => (
            <motion.div
              key={step.name}
              animate={{
                y: (index - active) * 19,
                x: (index - active) * 14,
                rotate: (index - active) * 1.4,
                opacity: index < active ? 0.22 : 1,
                scale: index === active ? 1 : 0.96,
                zIndex: 10 - index,
              }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 25 }}
              className="absolute inset-x-0 top-0 rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">STEP {String(active + 1).padStart(2, '0')} / 04</span>
              </div>
              <h3 className="mt-20 font-display text-4xl font-semibold tracking-[-.05em]">{item.name}</h3>
              <p className="mt-4 max-w-sm text-lg leading-7 text-muted-foreground">{item.detail}</p>
              <div className="mt-10 flex items-center gap-3 font-mono text-xs text-emerald-600 font-semibold">
                <CircleDot className="size-4" /> SIGNAL VERIFIED
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AutomationCard({ icon: Icon, title, text }: { icon: typeof Bot; title: string; text: string }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="rounded-2xl border border-white/10 bg-white/[.04] p-7 transition-colors hover:border-white/20">
      <Icon className="size-5 text-cyan-300" />
      <h3 className="mt-14 font-display text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/50">{text}</p>
    </motion.div>
  )
}

function UseCase({ icon: Icon, title, text }: { icon: typeof Code2; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-zinc-800 bg-card p-6 shadow-xs">
      <Icon className="size-5 text-indigo-600 dark:text-indigo-400" />
      <h3 className="mt-10 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  )
}