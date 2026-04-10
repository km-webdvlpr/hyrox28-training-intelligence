import { useEffect, useMemo, useState } from 'react'
import { LogSheet } from '../components/log-sheet.tsx'
import { PageHeader } from '../components/page-header.tsx'
import { RoutineLaunchSheet } from '../components/routine-launch-sheet.tsx'
import { TodayCard } from '../components/today-card.tsx'
import { useAppData } from '../hooks/use-app-data.ts'
import { formatTimeInZone } from '../lib/date.ts'
import { buildDefaultCompletionPayload } from '../lib/execution.ts'
import type { TodayItem } from '../types/execution.ts'

type ActiveSheet = { item: TodayItem; mode: 'partial' | 'skip' | 'move' } | null

export function TodayPage() {
  const {
    todayItems,
    routines,
    logCompletion,
    moveScheduledInstance,
    saveMoodEnergy,
    moodToday,
    dueReminders,
    markDueNotificationsSent,
    launchRoutine,
    completeRoutineActionItem,
    user,
  } = useAppData()
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null)

  const groupedItems = useMemo(() => {
    return todayItems.reduce<Record<string, TodayItem[]>>((accumulator, item) => {
      const key = item.domain.name
      accumulator[key] = [...(accumulator[key] ?? []), item]
      return accumulator
    }, {})
  }, [todayItems])
  const activeRoutine = useMemo(
    () => routines.find((entry) => entry.routine.id === activeRoutineId) ?? null,
    [activeRoutineId, routines],
  )
  const queuedDueReminderIds = useMemo(
    () =>
      dueReminders
        .filter((entry) => entry.notification.status === 'queued')
        .map((entry) => entry.notification.id),
    [dueReminders],
  )

  useEffect(() => {
    if (!queuedDueReminderIds.length) return

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        for (const entry of dueReminders.filter((item) => item.notification.status === 'queued')) {
          new Notification(entry.notification.title, {
            body: entry.notification.body,
          })
        }
      }
    }

    void markDueNotificationsSent(queuedDueReminderIds)
  }, [dueReminders, markDueNotificationsSent, queuedDueReminderIds])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Today"
        title="Execute what you planned"
        description="This view keeps the day tight: what is planned, what is done, what slipped, and where to capture context without slowing down."
        actions={<MoodEnergyCard moodToday={moodToday} onSave={saveMoodEnergy} />}
      />

      {dueReminders.length ? (
        <section className="space-y-3">
          <div className="eyebrow">Due reminders</div>
          <div className="grid gap-3">
            {dueReminders.map((entry) => (
              <article
                key={entry.notification.id}
                className="rounded-[22px] border border-amber-200 bg-amber-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      {entry.notification.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{entry.notification.body}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {formatTimeInZone(entry.notification.scheduledFor, user.timezone)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {routines.filter((entry) => entry.routine.state === 'active').length ? (
        <section className="space-y-3">
          <div className="eyebrow">Routines</div>
          <div className="grid gap-4">
            {routines
              .filter((entry) => entry.routine.state === 'active')
              .map((entry) => (
                <article key={entry.routine.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{entry.routine.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {entry.items.length} items • {entry.routine.estimatedDurationMin} min
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.launchedToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                      {entry.launchedToday ? 'launched' : 'ready'}
                    </span>
                  </div>
                  <button className="secondary-button mt-4 w-full" onClick={() => setActiveRoutineId(entry.routine.id)} type="button">
                    {entry.launchedToday ? 'Open routine' : 'Launch routine'}
                  </button>
                </article>
              ))}
          </div>
        </section>
      ) : null}

      {todayItems.length === 0 ? (
        <section className="panel">
          <h2 className="text-xl font-semibold text-slate-950">Nothing planned for today</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Add a habit or adjust cadence from the Habits tab so the daily loop has something real to work with.
          </p>
        </section>
      ) : (
        Object.entries(groupedItems).map(([group, items]) => (
          <section key={group} className="space-y-3">
            <div className="eyebrow">{group}</div>
            <div className="grid gap-4">
              {items.map((item) => (
                <TodayCard
                  key={item.instance.id}
                  item={item}
                  onDone={() =>
                    void logCompletion({
                      scheduledInstanceId: item.instance.id,
                      status: 'done',
                      ...buildDefaultCompletionPayload(item.habit, 'done'),
                    })
                  }
                  onPartial={() => setActiveSheet({ item, mode: 'partial' })}
                  onSkip={() => setActiveSheet({ item, mode: 'skip' })}
                  onMove={() => setActiveSheet({ item, mode: 'move' })}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <LogSheet
        item={activeSheet?.item ?? null}
        mode={activeSheet?.mode ?? null}
        onClose={() => setActiveSheet(null)}
        onSubmit={async (payload) => {
          if ('newDate' in payload) {
            await moveScheduledInstance(payload)
            return
          }

          await logCompletion(payload)
        }}
      />

      <RoutineLaunchSheet
        routine={activeRoutine}
        habitItems={todayItems}
        onClose={() => setActiveRoutineId(null)}
        onLaunch={launchRoutine}
        onCompleteAction={completeRoutineActionItem}
        onLogHabitDone={logCompletion}
      />
    </div>
  )
}

function MoodEnergyCard({
  moodToday,
  onSave,
}: {
  moodToday?: { mood: number; energy: number; note?: string | null }
  onSave: (input: { mood: number; energy: number; note?: string }) => Promise<void>
}) {
  const [mood, setMood] = useState(moodToday?.mood ?? 3)
  const [energy, setEnergy] = useState(moodToday?.energy ?? 3)

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="field__label">Daily state check</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <StateSlider label="Mood" value={mood} onChange={setMood} />
        <StateSlider label="Energy" value={energy} onChange={setEnergy} />
      </div>
      <button className="secondary-button mt-4 w-full" onClick={() => void onSave({ mood, energy })} type="button">
        Save state
      </button>
    </div>
  )
}

function StateSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (next: number) => void
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="accent-slate-900"
        max={5}
        min={1}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="text-xs text-slate-500">{value}/5</span>
    </label>
  )
}
