import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createCustomDomain as createCustomDomainRecord,
  completeRoutineActionItem as completeRoutineActionItemRecord,
  completeOnboarding as completeOnboardingRecord,
  createHabit as createHabitRecord,
  createRoutine as createRoutineRecord,
  launchRoutine as launchRoutineRecord,
  loadAppSnapshot,
  logCompletion as logCompletionRecord,
  markDueNotificationsSent as markDueNotificationsSentRecord,
  moveScheduledInstance as moveScheduledInstanceRecord,
  saveMoodEnergyLog,
  toggleDomainArchive as toggleDomainArchiveRecord,
  toggleHabitState as toggleHabitStateRecord,
  toggleRoutineState as toggleRoutineStateRecord,
  updateUserSettings,
} from '../data/db.ts'
import { AppDataContext } from './app-data-context.ts'
import type {
  AppSnapshot,
  HabitFormInput,
  LogCompletionInput,
  MoveInstanceInput,
  RoutineFormInput,
  UserSettings,
} from '../types/execution.ts'

const emptySnapshot: AppSnapshot = {
  user: {
    id: 'loading',
    email: '',
    timezone: 'UTC',
    loggingMode: 'lite',
    defaultReminderEnabled: true,
    onboardingCompleted: false,
    createdAt: '',
    updatedAt: '',
  },
  domains: [],
  habits: [],
  routines: [],
  todayItems: [],
  weeklyReview: {
    startDate: '',
    endDate: '',
    plannedCount: 0,
    doneCount: 0,
    partialCount: 0,
    skippedCount: 0,
    movedCount: 0,
    missedCount: 0,
    completionRate: 0,
    plannedVsActualRatio: 0,
    topSkipReasons: [],
    domainStats: [],
    habitStats: [],
    consistencyTrend: [],
    insights: [],
    averageMood: null,
    averageEnergy: null,
    moodLogCount: 0,
  },
  dueReminders: [],
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSnapshot = useCallback(async (showLoading: boolean) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)
      const nextSnapshot = await loadAppSnapshot()
      setSnapshot(nextSnapshot)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Unable to load execution data.'
      setError(message)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [])

  const reload = useCallback(async () => {
    await loadSnapshot(true)
  }, [loadSnapshot])

  useEffect(() => {
    void reload()
  }, [reload])

  const runAndReload = useCallback(async (action: () => Promise<void>) => {
    try {
      setError(null)
      await action()
      await loadSnapshot(false)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Something went wrong while saving.'
      setError(message)
      throw caughtError
    }
  }, [loadSnapshot])

  const createHabit = useCallback(
    async (input: HabitFormInput) => runAndReload(() => createHabitRecord(input)),
    [runAndReload],
  )
  const createCustomDomain = useCallback(
    async (input: { name: string; color: string }) =>
      runAndReload(() => createCustomDomainRecord(input)),
    [runAndReload],
  )
  const createRoutine = useCallback(
    async (input: RoutineFormInput) => runAndReload(() => createRoutineRecord(input)),
    [runAndReload],
  )
  const logCompletion = useCallback(
    async (input: LogCompletionInput) => runAndReload(() => logCompletionRecord(input)),
    [runAndReload],
  )
  const moveScheduledInstance = useCallback(
    async (input: MoveInstanceInput) => runAndReload(() => moveScheduledInstanceRecord(input)),
    [runAndReload],
  )
  const saveMoodEnergy = useCallback(
    async (input: { mood: number; energy: number; note?: string }) =>
      runAndReload(() => saveMoodEnergyLog(input)),
    [runAndReload],
  )
  const markDueNotificationsSent = useCallback(
    async (notificationIds: string[]) =>
      runAndReload(() => markDueNotificationsSentRecord(notificationIds)),
    [runAndReload],
  )
  const updateSettings = useCallback(async (
    input: Partial<Pick<UserSettings, 'timezone' | 'loggingMode' | 'defaultReminderEnabled'>>,
  ) => runAndReload(() => updateUserSettings(input)), [runAndReload])
  const completeOnboarding = useCallback(
    async (input: { loggingMode: UserSettings['loggingMode'] }) =>
      runAndReload(() => completeOnboardingRecord(input)),
    [runAndReload],
  )
  const toggleHabitState = useCallback(
    async (habitId: string, nextState: 'active' | 'paused' | 'archived') =>
      runAndReload(() => toggleHabitStateRecord(habitId, nextState)),
    [runAndReload],
  )
  const toggleRoutineState = useCallback(
    async (routineId: string, nextState: 'active' | 'paused' | 'archived') =>
      runAndReload(() => toggleRoutineStateRecord(routineId, nextState)),
    [runAndReload],
  )
  const toggleDomainArchive = useCallback(
    async (domainId: string, isArchived: boolean) =>
      runAndReload(() => toggleDomainArchiveRecord(domainId, isArchived)),
    [runAndReload],
  )
  const launchRoutine = useCallback(
    async (routineId: string) => runAndReload(() => launchRoutineRecord(routineId).then(() => undefined)),
    [runAndReload],
  )
  const completeRoutineActionItem = useCallback(
    async (input: { routineSessionId: string; routineItemId: string }) =>
      runAndReload(() => completeRoutineActionItemRecord(input).then(() => undefined)),
    [runAndReload],
  )

  const value = useMemo(
    () => ({
      ...snapshot,
      isLoading,
      error,
      reload,
      createCustomDomain,
      createHabit,
      createRoutine,
      logCompletion,
      moveScheduledInstance,
      launchRoutine,
      completeRoutineActionItem,
      markDueNotificationsSent,
      saveMoodEnergy,
      updateSettings,
      completeOnboarding,
      toggleDomainArchive,
      toggleHabitState,
      toggleRoutineState,
    }),
    [
      completeRoutineActionItem,
      completeOnboarding,
      createCustomDomain,
      createHabit,
      createRoutine,
      error,
      isLoading,
      launchRoutine,
      logCompletion,
      markDueNotificationsSent,
      moveScheduledInstance,
      reload,
      saveMoodEnergy,
      snapshot,
      toggleDomainArchive,
      toggleHabitState,
      toggleRoutineState,
      updateSettings,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
