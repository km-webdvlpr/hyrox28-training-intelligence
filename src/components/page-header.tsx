import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-slate-900/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-end md:justify-between md:p-6">
      <div className="max-w-2xl">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
      </div>
      {actions ? <div className="md:min-w-[220px]">{actions}</div> : null}
    </section>
  )
}
