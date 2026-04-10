import { useNavigate } from 'react-router-dom'
import { HabitForm } from '../components/habit-form.tsx'
import { PageHeader } from '../components/page-header.tsx'
import { useAppData } from '../hooks/use-app-data.ts'
import type { UserSettings } from '../types/execution.ts'

export function SetupPage() {
  const navigate = useNavigate()
  const { completeOnboarding, createHabit, domains, habits, user } = useAppData()

  const handleFinish = async (loggingMode: UserSettings['loggingMode']) => {
    await completeOnboarding({ loggingMode })
    navigate('/today')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Setup"
        title="Build your execution baseline"
        description="Start with a small set of repeatable behaviors. The goal is a reliable daily loop, not a bloated life dashboard."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <HabitForm domains={domains} onSubmit={createHabit} submitLabel="Add starter habit" />

        <section className="panel space-y-4">
          <div>
            <div className="eyebrow">Step 2</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Finish setup</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Add at least one habit, pick your default logging depth, and move into the Today view.
            </p>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="field__label">Starter habits</div>
            <div className="mt-2 text-sm text-slate-700">{habits.length} created</div>
            <div className="mt-3 space-y-2">
              {habits.slice(0, 5).map((habit) => (
                <div key={habit.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  {habit.title}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              className="primary-button w-full"
              disabled={habits.length === 0}
              onClick={() => void handleFinish('lite')}
              type="button"
            >
              Continue with Lite logging
            </button>
            <button
              className="secondary-button w-full"
              disabled={habits.length === 0}
              onClick={() => void handleFinish('standard')}
              type="button"
            >
              Continue with Standard logging
            </button>
          </div>

          <div className="rounded-[22px] bg-slate-950 px-4 py-4 text-sm text-slate-100">
            <div className="font-semibold">Current local account</div>
            <div className="mt-1 text-slate-300">{user.email}</div>
          </div>
        </section>
      </div>
    </div>
  )
}
