export const workoutTypes = [
  'run',
  'strength',
  'hyrox_sim',
  'row',
  'ski',
  'recovery',
  'mixed',
] as const

export const workoutStatuses = ['completed', 'modified', 'skipped'] as const

export const exerciseCategories = [
  'run',
  'row',
  'ski',
  'sled_push',
  'sled_pull',
  'burpee_broad_jump',
  'farmer_carry',
  'sandbag_lunge',
  'wall_ball',
  'strength',
  'mobility',
  'other',
] as const

export type WorkoutType = (typeof workoutTypes)[number]
export type WorkoutStatus = (typeof workoutStatuses)[number]
export type ExerciseCategory = (typeof exerciseCategories)[number]

export interface Workout {
  id: string
  date: string
  program_block: string
  program_week: number
  program_day: string
  title: string
  workout_type: WorkoutType
  status: WorkoutStatus
  duration_minutes: number
  rpe: number | null
  notes: string
  created_at: string
  updated_at: string
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_name: string
  category: ExerciseCategory
  sets: number | null
  reps: number | null
  weight_kg: number | null
  distance_m: number | null
  time_seconds: number | null
  calories: number | null
  notes: string
}

export interface BodyMetric {
  id: string
  date: string
  weight_kg: number | null
  resting_hr: number | null
  notes: string
}

export interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExercise[]
}

export interface ExerciseDraft {
  exercise_name: string
  category: ExerciseCategory
  sets: number | null
  reps: number | null
  weight_kg: number | null
  distance_m: number | null
  time_seconds: number | null
  calories: number | null
  notes: string
}

export interface WorkoutDraft {
  date: string
  program_block: string
  program_week: number
  program_day: string
  title: string
  workout_type: WorkoutType
  status: WorkoutStatus
  duration_minutes: number
  rpe: number | null
  notes: string
  exercises: ExerciseDraft[]
}
