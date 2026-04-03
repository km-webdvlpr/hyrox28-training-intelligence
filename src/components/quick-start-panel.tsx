import { CopyPlus, NotebookPen, X } from 'lucide-react'
import { formatDuration, formatWorkoutDate } from '../lib/formatters.ts'
import {
  createDraftFromTemplate,
  createDraftForNewDate,
  workoutTemplates,
} from '../lib/workout-drafts.ts'
import { workoutTypeLabels } from '../lib/workout-options.ts'
import type { WorkoutDraft, WorkoutWithExercises } from '../types/workouts.ts'

interface QuickStartPanelProps {
  activeSourceLabel?: string | null
  onClearSource?: () => void
  onSelectDraft: (draft: WorkoutDraft, options?: { workoutId?: string | null; label?: string }) => void
  recentWorkouts: WorkoutWithExercises[]
}

export function QuickStartPanel({
  activeSourceLabel,
  onClearSource,
  onSelectDraft,
  recentWorkouts,
}: QuickStartPanelProps) {
  return (
    <section className="panel-card space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="section-kicker">Quick start</div>
          <h3 className="font-display text-3xl uppercase tracking-tight text-carbon">
            Reuse your work
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            Start from a session template, duplicate a recent workout, or load a planned session
            into the form instead of typing from scratch.
          </p>
        </div>

        {activeSourceLabel ? (
          <div className="rounded-[24px] border border-carbon bg-accent-soft px-4 py-3">
            <div className="data-label">Active source</div>
            <div className="mt-2 text-sm font-semibold text-carbon">{activeSourceLabel}</div>
            {onClearSource ? (
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-carbon px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-carbon transition hover:bg-carbon hover:text-shell"
                onClick={onClearSource}
              >
                <X className="h-3.5 w-3.5" />
                Clear source
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="data-label">Workout templates</div>
          <div className="grid gap-4">
            {workoutTemplates.map((template) => (
              <article key={template.id} className="rounded-[24px] border border-line bg-shell p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-2xl uppercase tracking-tight text-carbon">
                      {template.label}
                    </h4>
                    <div className="mt-1 text-xs text-muted">
                      {workoutTypeLabels[template.workout_type]} // {formatDuration(template.duration_minutes)}
                    </div>
                  </div>
                  <span className="rounded-full border border-carbon px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-carbon">
                    Template
                  </span>
                </div>

                <p className="mt-3 text-sm leading-7 text-muted">{template.blurb}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-carbon bg-carbon px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-shell transition hover:-translate-y-0.5"
                    onClick={() =>
                      onSelectDraft(createDraftFromTemplate(template, 'completed'), {
                        label: `${template.label} template // use today`,
                      })
                    }
                  >
                    Use today
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-carbon px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-carbon transition hover:bg-carbon hover:text-shell"
                    onClick={() =>
                      onSelectDraft(createDraftFromTemplate(template, 'planned'), {
                        label: `${template.label} template // plan it`,
                      })
                    }
                  >
                    Plan it
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="data-label">Recent sessions</div>
          <div className="grid gap-4">
            {recentWorkouts.slice(0, 4).map((workout) => (
              <article key={workout.id} className="rounded-[24px] border border-line bg-shell p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-2xl uppercase tracking-tight text-carbon">
                      {workout.title}
                    </h4>
                    <div className="mt-1 text-xs text-muted">
                      {formatWorkoutDate(workout.date)} // {workoutTypeLabels[workout.workout_type]}
                    </div>
                  </div>
                  <span className="rounded-full border border-carbon px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-carbon">
                    Recent
                  </span>
                </div>

                <p className="mt-3 text-sm leading-7 text-muted">
                  Reuse the session structure, then tweak what changed today.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-carbon bg-carbon px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-shell transition hover:-translate-y-0.5"
                    onClick={() =>
                      onSelectDraft(createDraftForNewDate(workout, 'completed'), {
                        label: `Duplicated ${workout.title}`,
                      })
                    }
                  >
                    <CopyPlus className="h-3.5 w-3.5" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-carbon px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-carbon transition hover:bg-carbon hover:text-shell"
                    onClick={() =>
                      onSelectDraft(createDraftForNewDate(workout, 'planned'), {
                        label: `Planned from ${workout.title}`,
                      })
                    }
                  >
                    <NotebookPen className="h-3.5 w-3.5" />
                    Plan from this
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
