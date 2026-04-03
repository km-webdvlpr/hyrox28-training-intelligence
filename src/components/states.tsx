import type { ReactNode } from 'react'
import { AlertTriangle, LoaderCircle, SearchX } from 'lucide-react'

export function LoadingPanel({ title = 'Loading training data...' }: { title?: string }) {
  return (
    <div className="panel-card flex min-h-52 items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-carbon" />
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">{title}</p>
      </div>
    </div>
  )
}

export function ErrorPanel({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="panel-card flex min-h-52 items-center justify-center">
      <div className="max-w-md space-y-3 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-carbon" />
        <h3 className="font-display text-3xl uppercase text-carbon">Something broke</h3>
        <p className="text-sm leading-7 text-muted">{message}</p>
        {action}
      </div>
    </div>
  )
}

export function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="panel-card flex min-h-52 items-center justify-center">
      <div className="max-w-lg space-y-3 text-center">
        <SearchX className="mx-auto h-8 w-8 text-carbon" />
        <h3 className="font-display text-3xl uppercase text-carbon">{title}</h3>
        <p className="text-sm leading-7 text-muted">{description}</p>
        {action}
      </div>
    </div>
  )
}
