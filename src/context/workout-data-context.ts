import { createContext } from 'react'
import type { AnalyticsBundle } from '../lib/analytics.ts'
import type { WorkoutDraft, WorkoutWithExercises } from '../types/workouts.ts'

export interface WorkoutDataContextValue {
  workouts: WorkoutWithExercises[]
  analytics: AnalyticsBundle
  isLoading: boolean
  error: string | null
  saveWorkout: (draft: WorkoutDraft, workoutId?: string) => Promise<void>
  reload: () => Promise<void>
}

export const WorkoutDataContext = createContext<WorkoutDataContextValue | null>(null)
