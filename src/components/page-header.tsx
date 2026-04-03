import type { ReactNode } from 'react'

interface PageHeaderProps {
  kicker: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ kicker, title, description, actions }: PageHeaderProps) {
  return (
    <section className="mb-8 grid gap-5 rounded-[28px] border border-carbon bg-panel px-5 py-6 shadow-soft md:grid-cols-[1fr_auto] md:px-7">
      <div className="space-y-3">
        <div className="section-kicker">{kicker}</div>
        <h2 className="font-display text-4xl uppercase tracking-tight text-carbon sm:text-5xl">
          {title}
        </h2>
        <p className="page-lead max-w-2xl">{description}</p>
      </div>
      {actions ? <div className="flex items-start justify-start md:justify-end">{actions}</div> : null}
    </section>
  )
}
