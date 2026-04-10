import { buildDefaultCompletionPayload } from '../lib/execution.ts'
import type { RoutineSummary, TodayItem } from '../types/execution.ts'

export function RoutineLaunchSheet({
  routine,
  habitItems,
  onClose,
  onLaunch,
  onCompleteAction,
  onLogHabitDone,
}: {
  routine: RoutineSummary | null
  habitItems: TodayItem[]
  onClose: () => void
  onLaunch: (routineId: string) => Promise<void>
  onCompleteAction: (input: { routineSessionId: string; routineItemId: string }) => Promise<void>
  onLogHabitDone: (input: { scheduledInstanceId: string; status: 'done'; actualValue?: number | null; actualDurationMin?: number | null; percentComplete?: number | null }) => Promise<void>
}) {
  if (!routine) return null

  const sessionId = routine.launchedTodaySessionId ?? null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto w-full max-w-lg rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.3)]" onClick={(event) => event.stopPropagation()}>
        <div className="eyebrow">Routine launch</div>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">{routine.routine.title}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {routine.routine.estimatedDurationMin} min estimated. Keep this a simple ordered pass, not a workflow engine.
        </p>

        {!routine.launchedToday ? (
          <button className="primary-button mt-4 w-full" onClick={() => void onLaunch(routine.routine.id)} type="button">
            Launch routine
          </button>
        ) : null}

        <div className="mt-5 space-y-3">
          {routine.items.map((item) => {
            const linkedToday = item.habitId ? habitItems.find((entry) => entry.habit.id === item.habitId) : null
            const actionDone = routine.completedActionItemIds.includes(item.id)

            return (
              <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{item.label}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.itemType === 'habit_ref' ? 'Linked habit' : 'Action item'}
                    </div>
                  </div>
                  {item.itemType === 'action' ? (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${actionDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {actionDone ? 'done' : 'pending'}
                    </span>
                  ) : linkedToday ? (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${linkedToday.instance.status === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {linkedToday.instance.status}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                      no today instance
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  {item.itemType === 'action' && routine.launchedToday ? (
                    <button
                      className="secondary-button w-full"
                      disabled={actionDone || !sessionId}
                      onClick={() =>
                        sessionId
                          ? void onCompleteAction({
                              routineSessionId: sessionId,
                              routineItemId: item.id,
                            })
                          : undefined
                      }
                      type="button"
                    >
                      Mark action done
                    </button>
                  ) : null}

                  {item.itemType === 'habit_ref' && linkedToday ? (
                    <button
                      className="secondary-button w-full"
                      disabled={linkedToday.instance.status !== 'planned'}
                      onClick={() =>
                        void onLogHabitDone({
                          scheduledInstanceId: linkedToday.instance.id,
                          status: 'done',
                          ...buildDefaultCompletionPayload(linkedToday.habit, 'done'),
                        })
                      }
                      type="button"
                    >
                      Mark linked habit done
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        <button className="secondary-button mt-5 w-full" onClick={onClose} type="button">
          Close
        </button>
      </div>
    </div>
  )
}
