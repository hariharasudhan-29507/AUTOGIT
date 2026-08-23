import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>}</div>{action}</div>
}
