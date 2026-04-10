import type { TodayItem } from '../types/execution.ts'

export function TodayCard({
  item,
  onDone,
  onPartial,
  onSkip,
  onMove,
}: {
  item: TodayItem
  onDone: () => void
  onPartial: () => void
  onSkip: () => void
  onMove: () => void
}) {
  const isResolved = item.instance.status !== 'planned'

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
              style={{ backgroundColor: item.domain.color }}
            >
              {item.domain.name}
            </span>
            <span className="text-xs text-slate-500">
              {item.instance.scheduledStart ?? 'Any time'}
              {item.instance.scheduledEnd ? ` - ${item.instance.scheduledEnd}` : ''}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.habit.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            Planned target:{' '}
            {item.habit.measurementType === 'binary'
              ? 'Complete once'
              : `${item.habit.targetValue} ${item.habit.targetUnit}`}
          </p>
          {item.habit.cue ? <p className="mt-2 text-xs text-slate-500">Cue: {item.habit.cue}</p> : null}
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            item.instance.status === 'done'
              ? 'bg-emerald-100 text-emerald-800'
              : item.instance.status === 'partial'
                ? 'bg-amber-100 text-amber-800'
                : item.instance.status === 'skipped'
                  ? 'bg-rose-100 text-rose-800'
                  : item.instance.status === 'moved'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-slate-100 text-slate-700'
          }`}
        >
          {item.instance.status}
        </div>
      </div>

      {item.completion?.note ? (
        <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {item.completion.note}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button className="action-button action-button--done" disabled={isResolved} onClick={onDone} type="button">
          Done
        </button>
        <button className="action-button" disabled={isResolved} onClick={onPartial} type="button">
          Partial
        </button>
        <button className="action-button" disabled={isResolved} onClick={onSkip} type="button">
          Skipped
        </button>
        <button className="action-button" disabled={isResolved} onClick={onMove} type="button">
          Moved
        </button>
      </div>
    </article>
  )
}
