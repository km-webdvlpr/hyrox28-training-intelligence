import { PageHeader } from '../components/page-header.tsx'
import { RoutineForm } from '../components/routine-form.tsx'
import { useAppData } from '../hooks/use-app-data.ts'

export function RoutinesPage() {
  const { createRoutine, domains, habits, routines, toggleRoutineState } = useAppData()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Routine definitions"
        title="Create simple launchable routines"
        description="Routines are manual ordered groups. They can point at today's habits or hold lightweight actions, but they do not create a workflow engine."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <RoutineForm domains={domains} habits={habits.filter((habit) => habit.state === 'active')} onSubmit={createRoutine} />

        <section className="panel space-y-4">
          <div>
            <div className="eyebrow">Current routines</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Launch library</h2>
          </div>

          <div className="space-y-3">
            {routines.length === 0 ? (
              <p className="text-sm text-slate-600">No routines yet.</p>
            ) : (
              routines.map((entry) => (
                <article key={entry.routine.id} className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{entry.routine.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {entry.items.length} items • {entry.routine.estimatedDurationMin} min
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        entry.routine.state === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.routine.state === 'paused'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {entry.routine.state}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    {entry.items.map((item) => (
                      <div key={item.id}>
                        {item.itemType === 'habit_ref' ? 'Habit' : 'Action'}: {item.label}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    {entry.routine.state === 'active' ? (
                      <button
                        className="secondary-button"
                        onClick={() => void toggleRoutineState(entry.routine.id, 'paused')}
                        type="button"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        className="secondary-button"
                        onClick={() => void toggleRoutineState(entry.routine.id, 'active')}
                        type="button"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      className="secondary-button"
                      onClick={() => void toggleRoutineState(entry.routine.id, 'archived')}
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
