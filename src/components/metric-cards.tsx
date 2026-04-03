import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string
  detail: string
  icon: LucideIcon
}

interface InsightCardProps {
  label: string
  value: string
  detail: string
}

export function KpiCard({ label, value, detail, icon: Icon }: KpiCardProps) {
  return (
    <article className="kpi-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="data-label">{label}</div>
          <div className="metric-value">{value}</div>
        </div>
        <div className="rounded-full border border-carbon bg-accent p-3">
          <Icon className="h-5 w-5 text-carbon" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">{detail}</p>
    </article>
  )
}

export function InsightCard({ label, value, detail }: InsightCardProps) {
  return (
    <article className="panel-card">
      <div className="data-label">{label}</div>
      <div className="mt-3 font-display text-3xl uppercase tracking-tight text-carbon">
        {value}
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">{detail}</p>
    </article>
  )
}
