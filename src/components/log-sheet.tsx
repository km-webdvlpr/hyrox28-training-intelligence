import { useEffect, useState } from 'react'
import { addDaysToDate, todayDateString } from '../lib/date.ts'
import { SKIP_REASON_LABELS } from '../lib/execution.ts'
import type { Habit, LogCompletionInput, SkipReasonCode, TodayItem } from '../types/execution.ts'

type LogMode = 'partial' | 'skip' | 'move'

export function LogSheet({
  item,
  mode,
  onClose,
  onSubmit,
}: {
  item: TodayItem | null
  mode: LogMode | null
  onClose: () => void
  onSubmit: (payload: LogCompletionInput | { scheduledInstanceId: string; newDate: string; newTime?: string | null }) => Promise<void>
}) {
  const [actualValue, setActualValue] = useState(0)
  const [skipReasonCode, setSkipReasonCode] = useState<SkipReasonCode>('time')
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [effort, setEffort] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [newDate, setNewDate] = useState(addDaysToDate(todayDateString(), 1))
  const [newTime, setNewTime] = useState('18:00')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!item || !mode) return
    setActualValue(defaultPartialValue(item.habit))
    setSkipReasonCode('time')
    setMood(null)
    setEnergy(null)
    setEffort(null)
    setNote('')
    setNewDate(addDaysToDate(todayDateString(), 1))
    setNewTime(item.instance.scheduledStart ?? '18:00')
  }, [item, mode])

  if (!item || !mode) return null

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      if (mode === 'move') {
        await onSubmit({
          scheduledInstanceId: item.instance.id,
          newDate,
          newTime,
        })
      } else if (mode === 'skip') {
        await onSubmit({
          scheduledInstanceId: item.instance.id,
          status: 'skipped',
          skipReasonCode,
          mood,
          energy,
          effort,
          note,
        })
      } else {
        const percentComplete =
          item.habit.measurementType === 'binary'
            ? 50
            : Math.max(
                1,
                Math.min(99, Math.round((actualValue / Math.max(item.habit.targetValue, 1)) * 100)),
              )

        await onSubmit({
          scheduledInstanceId: item.instance.id,
          status: 'partial',
          actualValue: item.habit.measurementType === 'binary' ? null : actualValue,
          actualDurationMin:
            item.habit.measurementType === 'duration' ? actualValue : null,
          percentComplete,
          mood,
          energy,
          effort,
          note,
        })
      }

      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto w-full max-w-lg rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.3)]" onClick={(event) => event.stopPropagation()}>
        <div className="eyebrow">{mode === 'move' ? 'Move instance' : mode === 'skip' ? 'Skip with context' : 'Partial completion'}</div>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">{item.habit.title}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {mode === 'partial'
            ? 'Capture the actual amount without breaking the flow.'
            : mode === 'skip'
              ? 'Record the reason so review stays useful.'
              : 'Move this planned occurrence without losing the original plan.'}
        </p>

        <div className="mt-5 space-y-4">
          {mode === 'partial' && item.habit.measurementType !== 'binary' ? (
            <label className="field">
              <span className="field__label">Actual {item.habit.measurementType === 'duration' ? 'minutes' : item.habit.targetUnit}</span>
              <input
                className="input"
                min={1}
                type="number"
                value={actualValue}
                onChange={(event) => setActualValue(Number(event.target.value))}
              />
            </label>
          ) : null}

          {mode === 'partial' && item.habit.measurementType === 'binary' ? (
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Binary habits use a fixed 50% partial in MVP so the outcome stays fast and review math stays explainable.
            </div>
          ) : null}

          {mode === 'skip' ? (
            <div className="space-y-2">
              <div className="field__label">Skip reason</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SKIP_REASON_LABELS).map(([reason, label]) => (
                  <button
                    key={reason}
                    className={skipReasonCode === reason ? 'chip chip--active' : 'chip'}
                    onClick={() => setSkipReasonCode(reason as SkipReasonCode)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mode === 'move' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span className="field__label">New date</span>
                <input className="input" type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
              </label>
              <label className="field">
                <span className="field__label">New time</span>
                <input className="input" type="time" value={newTime} onChange={(event) => setNewTime(event.target.value)} />
              </label>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <ScoreField label="Mood" value={mood} onChange={setMood} />
              <ScoreField label="Energy" value={energy} onChange={setEnergy} />
              <ScoreField label="Effort" value={effort} onChange={setEffort} />
            </div>
          )}

          {mode !== 'move' ? (
            <label className="field">
              <span className="field__label">Note</span>
              <textarea
                className="input min-h-24"
                placeholder="Optional context"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
          ) : null}
        </div>

        <div className="mt-5 flex gap-3">
          <button className="secondary-button flex-1" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="primary-button flex-1" disabled={isSaving} onClick={() => void handleSubmit()} type="button">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function defaultPartialValue(habit: Habit) {
  if (habit.measurementType === 'binary') return 0
  return Math.max(1, Math.round(habit.targetValue / 2))
}

function ScoreField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (next: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="field__label">{label}</div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((entry) => (
          <button
            key={entry}
            className={value === entry ? 'score-pill score-pill--active' : 'score-pill'}
            onClick={() => onChange(entry)}
            type="button"
          >
            {entry}
          </button>
        ))}
      </div>
    </div>
  )
}
