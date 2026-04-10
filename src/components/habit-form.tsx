import { useMemo, useState } from 'react'
import { todayDateString } from '../lib/date.ts'
import type { Domain, HabitFormInput, MeasurementType, RecurrenceType } from '../types/execution.ts'

const measurementOptions: Array<{ value: MeasurementType; label: string }> = [
  { value: 'binary', label: 'Binary' },
  { value: 'count', label: 'Count' },
  { value: 'duration', label: 'Duration' },
]

const recurrenceOptions: Array<{ value: RecurrenceType; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'selected_weekdays', label: 'Selected weekdays' },
  { value: 'every_n_days', label: 'Every n days' },
]

const weekdayLabels = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

export function HabitForm({
  domains,
  onSubmit,
  submitLabel,
}: {
  domains: Domain[]
  onSubmit: (input: HabitFormInput) => Promise<void>
  submitLabel: string
}) {
  const [title, setTitle] = useState('')
  const [domainId, setDomainId] = useState(domains[0]?.id ?? '')
  const [measurementType, setMeasurementType] = useState<MeasurementType>('binary')
  const [targetValue, setTargetValue] = useState(1)
  const [targetUnit, setTargetUnit] = useState('times')
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5])
  const [intervalDays, setIntervalDays] = useState(2)
  const [windowStart, setWindowStart] = useState('07:00')
  const [windowEnd, setWindowEnd] = useState('09:00')
  const [cue, setCue] = useState('')
  const [defaultReminderTime, setDefaultReminderTime] = useState('07:15')
  const [isSaving, setIsSaving] = useState(false)

  const summary = useMemo(() => {
    const unit =
      measurementType === 'binary'
        ? 'once'
        : `${targetValue} ${targetUnit || (measurementType === 'duration' ? 'minutes' : 'times')}`
    return `${title || 'This habit'} targets ${unit} on a ${recurrenceType.replaceAll('_', ' ')} cadence.`
  }, [measurementType, recurrenceType, targetUnit, targetValue, title])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !domainId) return

    setIsSaving(true)
    try {
      await onSubmit({
        title: title.trim(),
        domainId,
        measurementType,
        targetValue: measurementType === 'binary' ? 1 : targetValue,
        targetUnit:
          measurementType === 'binary'
            ? 'completion'
            : targetUnit || (measurementType === 'duration' ? 'minutes' : 'times'),
        recurrenceRule: {
          type: recurrenceType,
          startDate: todayDateString(),
          daysOfWeek: recurrenceType === 'selected_weekdays' ? daysOfWeek : undefined,
          intervalDays: recurrenceType === 'every_n_days' ? intervalDays : undefined,
        },
        windowStart,
        windowEnd,
        cue: cue || null,
        defaultReminderTime: defaultReminderTime || null,
      })

      setTitle('')
      setMeasurementType('binary')
      setTargetValue(1)
      setTargetUnit('times')
      setCue('')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="panel space-y-4" onSubmit={handleSubmit}>
      <div>
        <div className="eyebrow">Create habit</div>
        <div className="mt-2 text-sm text-slate-600">{summary}</div>
      </div>

      <label className="field">
        <span className="field__label">Title</span>
        <input
          className="input"
          placeholder="Morning mobility"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="field">
          <span className="field__label">Domain</span>
          <select className="input" value={domainId} onChange={(event) => setDomainId(event.target.value)}>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Measurement</span>
          <select
            className="input"
            value={measurementType}
            onChange={(event) => setMeasurementType(event.target.value as MeasurementType)}
          >
            {measurementOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {measurementType !== 'binary' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">
            <span className="field__label">Target value</span>
            <input
              className="input"
              min={1}
              type="number"
              value={targetValue}
              onChange={(event) => setTargetValue(Number(event.target.value))}
            />
          </label>
          <label className="field">
            <span className="field__label">Unit</span>
            <input
              className="input"
              value={targetUnit}
              onChange={(event) => setTargetUnit(event.target.value)}
            />
          </label>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="field">
          <span className="field__label">Cadence</span>
          <select
            className="input"
            value={recurrenceType}
            onChange={(event) => setRecurrenceType(event.target.value as RecurrenceType)}
          >
            {recurrenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {recurrenceType === 'every_n_days' ? (
          <label className="field">
            <span className="field__label">Repeat every</span>
            <input
              className="input"
              min={1}
              type="number"
              value={intervalDays}
              onChange={(event) => setIntervalDays(Number(event.target.value))}
            />
          </label>
        ) : (
          <label className="field">
            <span className="field__label">Reminder</span>
            <input
              className="input"
              type="time"
              value={defaultReminderTime}
              onChange={(event) => setDefaultReminderTime(event.target.value)}
            />
          </label>
        )}
      </div>

      {recurrenceType === 'selected_weekdays' ? (
        <div className="space-y-2">
          <div className="field__label">Weekdays</div>
          <div className="flex flex-wrap gap-2">
            {weekdayLabels.map((day) => {
              const active = daysOfWeek.includes(day.value)
              return (
                <button
                  key={day.value}
                  type="button"
                  className={active ? 'chip chip--active' : 'chip'}
                  onClick={() =>
                    setDaysOfWeek((current) =>
                      current.includes(day.value)
                        ? current.filter((entry) => entry !== day.value)
                        : [...current, day.value],
                    )
                  }
                >
                  {day.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="field">
          <span className="field__label">Target window start</span>
          <input className="input" type="time" value={windowStart} onChange={(event) => setWindowStart(event.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Target window end</span>
          <input className="input" type="time" value={windowEnd} onChange={(event) => setWindowEnd(event.target.value)} />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Cue</span>
        <input
          className="input"
          placeholder="After coffee"
          value={cue}
          onChange={(event) => setCue(event.target.value)}
        />
      </label>

      <button className="primary-button w-full" disabled={isSaving} type="submit">
        {isSaving ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
