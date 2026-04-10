import { HabitForm } from '../components/habit-form.tsx'
import { PageHeader } from '../components/page-header.tsx'
import { useAppData } from '../hooks/use-app-data.ts'

export function HabitsPage() {
  const { createHabit, domains, habits, toggleHabitState } = useAppData()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Habit definitions"
        title="Define the repeatable behaviors"
        description="Keep each behavior measurable enough to review, but simple enough to log in one or two taps."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <HabitForm domains={domains} onSubmit={createHabit} submitLabel="Add habit" />

        <section className="panel space-y-4">
          <div>
            <div className="eyebrow">Active habits</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Current system</h2>
          </div>

          <div className="space-y-3">
            {habits.length === 0 ? (
              <p className="text-sm text-slate-600">No habits yet.</p>
            ) : (
              habits.map((habit) => (
                <article key={habit.id} className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{habit.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {habit.measurementType === 'binary'
                          ? 'Binary completion'
                          : `${habit.targetValue} ${habit.targetUnit}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {habit.recurrenceRule.type.replaceAll('_', ' ')} • {habit.windowStart ?? 'Any time'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        habit.state === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : habit.state === 'paused'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {habit.state}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {habit.state === 'active' ? (
                      <button
                        className="secondary-button"
                        onClick={() => void toggleHabitState(habit.id, 'paused')}
                        type="button"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        className="secondary-button"
                        onClick={() => void toggleHabitState(habit.id, 'active')}
                        type="button"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      className="secondary-button"
                      onClick={() => void toggleHabitState(habit.id, 'archived')}
                      type="button"
                    >
                      Archive
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
