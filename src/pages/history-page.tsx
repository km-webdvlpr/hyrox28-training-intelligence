import { useDeferredValue, useMemo, useState } from 'react'
import { HistoryTable } from '../components/history-table.tsx'
import { PageHeader } from '../components/page-header.tsx'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '../components/states.tsx'
import { useWorkoutData } from '../hooks/use-workout-data.ts'
import { buildAnalyticsBundle, filterWorkoutsByDateRange } from '../lib/analytics.ts'
import { formatPercent } from '../lib/formatters.ts'
import { workoutStatusOptions, workoutTypeOptions } from '../lib/workout-options.ts'

interface Filters {
  startDate: string
  endDate: string
  workoutType: string
  status: string
  programBlock: string
  programWeek: string
}

export function HistoryPage() {
  const { error, isLoading, reload, workouts } = useWorkoutData()
  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: '',
    workoutType: '',
    status: '',
    programBlock: '',
    programWeek: '',
  })
  const deferredFilters = useDeferredValue(filters)

  const blocks = useMemo(
    () => [...new Set(workouts.map((workout) => workout.program_block))].sort(),
    [workouts],
  )

  const weeks = useMemo(
    () => [...new Set(workouts.map((workout) => workout.program_week))].sort((left, right) => left - right),
    [workouts],
  )

  const filteredWorkouts = useMemo(() => {
    const ranged = filterWorkoutsByDateRange(
      workouts,
      deferredFilters.startDate || undefined,
      deferredFilters.endDate || undefined,
    )

    return ranged.filter((workout) => {
      if (deferredFilters.workoutType && workout.workout_type !== deferredFilters.workoutType) return false
      if (deferredFilters.status && workout.status !== deferredFilters.status) return false
      if (deferredFilters.programBlock && workout.program_block !== deferredFilters.programBlock) return false
      if (deferredFilters.programWeek && workout.program_week !== Number(deferredFilters.programWeek)) return false
      return true
    })
  }, [deferredFilters, workouts])

  const filteredAnalytics = useMemo(() => buildAnalyticsBundle(filteredWorkouts), [filteredWorkouts])

  if (isLoading) return <LoadingPanel title="Loading workout history..." />

  if (error) {
    return (
      <ErrorPanel
        message={error}
        action={
          <button className="nav-link nav-link-active" onClick={() => void reload()} type="button">
            Reload
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Workout history"
        title="Session archive"
        description="Filter the log by date, workout type, status, block, or week to isolate patterns before they become habits."
        actions={
          <div className="rounded-[24px] border border-carbon bg-panel px-4 py-3 text-right">
            <div className="data-label">Filtered view</div>
            <div className="mt-2 font-display text-2xl uppercase tracking-tight text-carbon">
              {filteredWorkouts.length} sessions
            </div>
            <div className="mt-1 text-sm text-muted">
              {formatPercent(filteredAnalytics.completionRate)} completion
            </div>
          </div>
        }
      />

      <section className="panel-card grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="field-shell">
          <span className="data-label">Start date</span>
          <input
            type="date"
            className="input-shell"
            value={filters.startDate}
            onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
          />
        </label>

        <label className="field-shell">
          <span className="data-label">End date</span>
          <input
            type="date"
            className="input-shell"
            value={filters.endDate}
            onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
          />
        </label>

        <label className="field-shell">
          <span className="data-label">Workout type</span>
          <select
            className="select-shell"
            value={filters.workoutType}
            onChange={(event) => setFilters((current) => ({ ...current, workoutType: event.target.value }))}
          >
            <option value="">All types</option>
            {workoutTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-shell">
          <span className="data-label">Status</span>
          <select
            className="select-shell"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">All statuses</option>
            {workoutStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-shell">
          <span className="data-label">Program block</span>
          <select
            className="select-shell"
            value={filters.programBlock}
            onChange={(event) => setFilters((current) => ({ ...current, programBlock: event.target.value }))}
          >
            <option value="">All blocks</option>
            {blocks.map((block) => (
              <option key={block} value={block}>
                {block}
              </option>
            ))}
          </select>
        </label>

        <label className="field-shell">
          <span className="data-label">Program week</span>
          <select
            className="select-shell"
            value={filters.programWeek}
            onChange={(event) => setFilters((current) => ({ ...current, programWeek: event.target.value }))}
          >
            <option value="">All weeks</option>
            {weeks.map((week) => (
              <option key={week} value={week}>
                Week {week}
              </option>
            ))}
          </select>
        </label>
      </section>

      {filteredWorkouts.length ? (
        <HistoryTable workouts={filteredWorkouts} />
      ) : (
        <EmptyPanel
          title="No sessions match those filters"
          description="Widen the date range or clear a few filters to bring the training log back into view."
        />
      )}
    </div>
  )
}
