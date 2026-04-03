import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { addWorkoutWithExercises, listWorkoutsWithExercises } from '../data/db.ts'
import { buildAnalyticsBundle } from '../lib/analytics.ts'
import { WorkoutDataContext } from './workout-data-context.ts'
import type { WorkoutDraft, WorkoutWithExercises } from '../types/workouts.ts'

const fallbackAnalytics = buildAnalyticsBundle([])

export function WorkoutDataProvider({ children }: { children: ReactNode }) {
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const nextWorkouts = await listWorkoutsWithExercises()
      setWorkouts(nextWorkouts)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Unable to read training data.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const addWorkout = async (draft: WorkoutDraft) => {
    try {
      setError(null)
      await addWorkoutWithExercises(draft)
      const nextWorkouts = await listWorkoutsWithExercises()
      setWorkouts(nextWorkouts)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Unable to save the workout.'
      setError(message)
      throw caughtError
    }
  }

  const analytics = useMemo(() => buildAnalyticsBundle(workouts), [workouts])

  const value = useMemo(
    () => ({
      workouts,
      analytics: workouts.length ? analytics : fallbackAnalytics,
      isLoading,
      error,
      addWorkout,
      reload,
    }),
    [analytics, error, isLoading, workouts],
  )

  return <WorkoutDataContext.Provider value={value}>{children}</WorkoutDataContext.Provider>
}
