import { useContext } from 'react'
import { WorkoutDataContext } from '../context/workout-data-context.ts'

export function useWorkoutData() {
  const context = useContext(WorkoutDataContext)

  if (!context) {
    throw new Error('useWorkoutData must be used inside WorkoutDataProvider')
  }

  return context
}
