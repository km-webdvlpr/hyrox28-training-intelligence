import { formatDistance, formatDuration, formatRpe, formatWorkoutDate } from '../lib/formatters.ts'
import { workoutStatusLabels, workoutTypeLabels } from '../lib/workout-options.ts'
import type { WorkoutWithExercises } from '../types/workouts.ts'
import { cn } from '../lib/cn.ts'

function statusChipClass(status: WorkoutWithExercises['status']) {
  if (status === 'planned') return 'bg-[#efe7d8] text-[#3f3a31]'
  if (status === 'completed') return 'bg-[#e7f5ec] text-[#0f5132]'
  if (status === 'modified') return 'bg-[#fff4d1] text-[#7a5b00]'
  return 'bg-[#ffe0e0] text-[#8f1d1d]'
}

export function HistoryTable({ workouts }: { workouts: WorkoutWithExercises[] }) {
  return (
    <>
      <div className="space-y-4 lg:hidden">
        {workouts.map((workout) => {
          const totalDistance = workout.exercises.reduce(
            (sum, exercise) =>
              sum +
              (exercise.category === 'run' || exercise.category === 'row' || exercise.category === 'ski'
                ? (exercise.distance_m ?? 0)
                : 0),
            0,
          )

          return (
            <article key={workout.id} className="panel-card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="data-label">{formatWorkoutDate(workout.date)}</div>
                  <h3 className="mt-2 font-display text-3xl uppercase tracking-tight text-carbon">
                    {workout.title}
                  </h3>
                </div>
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusChipClass(workout.status))}>
                  {workoutStatusLabels[workout.status]}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="data-label">Type</div>
                  <div className="mt-1 text-sm text-carbon">{workoutTypeLabels[workout.workout_type]}</div>
                </div>
                <div>
                  <div className="data-label">Duration</div>
                  <div className="mt-1 text-sm text-carbon">{formatDuration(workout.duration_minutes)}</div>
                </div>
                <div>
                  <div className="data-label">RPE</div>
                  <div className="mt-1 text-sm text-carbon">{formatRpe(workout.rpe)}</div>
                </div>
                <div>
                  <div className="data-label">Distance</div>
                  <div className="mt-1 text-sm text-carbon">{formatDistance(totalDistance)}</div>
                </div>
              </div>

              <p className="text-sm leading-7 text-muted">{workout.notes || 'No session note logged.'}</p>
            </article>
          )
        })}
      </div>

      <div className="hidden overflow-hidden rounded-[28px] border border-carbon bg-panel shadow-soft lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-carbon text-shell">
              <tr className="font-mono text-[11px] uppercase tracking-[0.22em]">
                <th className="px-4 py-4 text-left">Date</th>
                <th className="px-4 py-4 text-left">Title</th>
                <th className="px-4 py-4 text-left">Type</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-left">Duration</th>
                <th className="px-4 py-4 text-left">RPE</th>
                <th className="px-4 py-4 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((workout) => (
                <tr key={workout.id} className="border-t border-line align-top">
                  <td className="px-4 py-4 text-sm text-carbon">{formatWorkoutDate(workout.date)}</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-carbon">{workout.title}</div>
                    <div className="mt-1 text-xs text-muted">
                      {workout.program_block} // Week {workout.program_week}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-carbon">{workoutTypeLabels[workout.workout_type]}</td>
                  <td className="px-4 py-4">
                    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusChipClass(workout.status))}>
                      {workoutStatusLabels[workout.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-carbon">{formatDuration(workout.duration_minutes)}</td>
                  <td className="px-4 py-4 text-sm text-carbon">{formatRpe(workout.rpe)}</td>
                  <td className="max-w-sm px-4 py-4 text-sm leading-7 text-muted">
                    {workout.notes || 'No session note logged.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
