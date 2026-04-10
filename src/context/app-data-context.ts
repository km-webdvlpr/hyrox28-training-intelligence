import { createContext } from 'react'
import type {
  AppSnapshot,
  HabitFormInput,
  LogCompletionInput,
  MoveInstanceInput,
  RoutineFormInput,
  UserSettings,
} from '../types/execution.ts'

export interface AppDataContextValue extends AppSnapshot {
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createCustomDomain: (input: { name: string; color: string }) => Promise<void>
  createHabit: (input: HabitFormInput) => Promise<void>
  createRoutine: (input: RoutineFormInput) => Promise<void>
  logCompletion: (input: LogCompletionInput) => Promise<void>
  moveScheduledInstance: (input: MoveInstanceInput) => Promise<void>
  launchRoutine: (routineId: string) => Promise<void>
  completeRoutineActionItem: (input: { routineSessionId: string; routineItemId: string }) => Promise<void>
  markDueNotificationsSent: (notificationIds: string[]) => Promise<void>
  saveMoodEnergy: (input: { mood: number; energy: number; note?: string }) => Promise<void>
  updateSettings: (
    input: Partial<Pick<UserSettings, 'timezone' | 'loggingMode' | 'defaultReminderEnabled'>>,
  ) => Promise<void>
  completeOnboarding: (input: { loggingMode: UserSettings['loggingMode'] }) => Promise<void>
  toggleHabitState: (habitId: string, nextState: 'active' | 'paused' | 'archived') => Promise<void>
  toggleRoutineState: (routineId: string, nextState: 'active' | 'paused' | 'archived') => Promise<void>
  toggleDomainArchive: (domainId: string, isArchived: boolean) => Promise<void>
}

export const AppDataContext = createContext<AppDataContextValue | null>(null)
