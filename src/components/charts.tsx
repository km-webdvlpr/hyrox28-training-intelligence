import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

interface ChartCardProps {
  title: string
  description: string
  children: ReactNode
  className?: string
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <section className={cn('panel-card', className)}>
      <div className="mb-5 space-y-2">
        <div className="section-kicker">Chart</div>
        <h3 className="font-display text-3xl uppercase tracking-tight text-carbon">{title}</h3>
        <p className="text-sm leading-7 text-muted">{description}</p>
      </div>
      <div className="h-80">{children}</div>
    </section>
  )
}

export function ChartTooltipCard({
  label,
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <div className="min-w-44 rounded-2xl border border-carbon bg-panel px-4 py-3 shadow-soft">
      {label ? <div className="data-label mb-2">{label}</div> : null}
      <div className="space-y-1.5 text-sm text-carbon">{children}</div>
    </div>
  )
}

export function RangePill({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] transition',
        active
          ? 'border-carbon bg-carbon text-shell'
          : 'border-carbon bg-transparent text-carbon hover:bg-carbon hover:text-shell',
      )}
    >
      {children}
    </button>
  )
}

export function WeekdayHeatmap({
  days,
}: {
  days: Array<{ label: string; adherenceRate: number; total: number }>
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
      {days.map((day) => {
        const level =
          day.adherenceRate >= 85 ? 'heat-3' : day.adherenceRate >= 70 ? 'heat-2' : day.adherenceRate >= 50 ? 'heat-1' : 'heat-0'

        return (
          <div key={day.label} className={cn('rounded-3xl border border-carbon p-4', level)}>
            <div className="data-label">{day.label}</div>
            <div className="mt-2 font-display text-4xl uppercase text-carbon">
              {Math.round(day.adherenceRate)}%
            </div>
            <div className="mt-2 text-sm text-muted">{day.total} logged sessions</div>
          </div>
        )
      })}
    </div>
  )
}
