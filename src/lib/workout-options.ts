import type { ExerciseCategory, WorkoutStatus, WorkoutType } from '../types/workouts.ts'

export const workoutTypeLabels: Record<WorkoutType, string> = {
  run: 'Run',
  strength: 'Strength',
  hyrox_sim: 'Hyrox Sim',
  row: 'Row',
  ski: 'Ski',
  recovery: 'Recovery',
  mixed: 'Mixed',
}

export const workoutStatusLabels: Record<WorkoutStatus, string> = {
  completed: 'Completed',
  modified: 'Modified',
  skipped: 'Skipped',
}

export const exerciseCategoryLabels: Record<ExerciseCategory, string> = {
  run: 'Run',
  row: 'Row',
  ski: 'Ski',
  sled_push: 'Sled Push',
  sled_pull: 'Sled Pull',
  burpee_broad_jump: 'Burpee Broad Jump',
  farmer_carry: 'Farmer Carry',
  sandbag_lunge: 'Sandbag Lunge',
  wall_ball: 'Wall Ball',
  strength: 'Strength',
  mobility: 'Mobility',
  other: 'Other',
}

export const workoutTypeOptions = Object.entries(workoutTypeLabels).map(([value, label]) => ({
  value: value as WorkoutType,
  label,
}))

export const workoutStatusOptions = Object.entries(workoutStatusLabels).map(
  ([value, label]) => ({
    value: value as WorkoutStatus,
    label,
  }),
)

export const exerciseCategoryOptions = Object.entries(exerciseCategoryLabels).map(
  ([value, label]) => ({
    value: value as ExerciseCategory,
    label,
  }),
)

export const exerciseFieldMap: Record<
  ExerciseCategory,
  Array<'sets' | 'reps' | 'weight_kg' | 'distance_m' | 'time_seconds' | 'calories'>
> = {
  run: ['distance_m', 'time_seconds'],
  row: ['distance_m', 'time_seconds', 'calories'],
  ski: ['distance_m', 'time_seconds', 'calories'],
  sled_push: ['distance_m', 'weight_kg'],
  sled_pull: ['distance_m', 'weight_kg'],
  burpee_broad_jump: ['reps', 'distance_m'],
  farmer_carry: ['distance_m', 'weight_kg'],
  sandbag_lunge: ['distance_m', 'weight_kg'],
  wall_ball: ['sets', 'reps'],
  strength: ['sets', 'reps', 'weight_kg'],
  mobility: [],
  other: ['reps'],
}
