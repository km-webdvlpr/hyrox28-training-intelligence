import { format } from 'date-fns'
import type {
  ExerciseDraft,
  WorkoutDraft,
  WorkoutStatus,
  WorkoutType,
  WorkoutWithExercises,
} from '../types/workouts.ts'

export function buildWorkoutDraft(
  workout: WorkoutWithExercises,
  overrides?: Partial<WorkoutDraft>,
): WorkoutDraft {
  return {
    date: workout.date,
    program_block: workout.program_block,
    program_week: workout.program_week,
    program_day: workout.program_day,
    title: workout.title,
    workout_type: workout.workout_type,
    status: workout.status,
    duration_minutes: workout.duration_minutes,
    rpe: workout.rpe,
    notes: workout.notes,
    exercises: workout.exercises.map<ExerciseDraft>((exercise) => ({
      exercise_name: exercise.exercise_name,
      category: exercise.category,
      sets: exercise.sets,
      reps: exercise.reps,
      weight_kg: exercise.weight_kg,
      distance_m: exercise.distance_m,
      time_seconds: exercise.time_seconds,
      calories: exercise.calories,
      notes: exercise.notes,
    })),
    ...overrides,
  }
}

export function createDraftForNewDate(
  workout: WorkoutWithExercises,
  status: WorkoutStatus = 'completed',
): WorkoutDraft {
  return buildWorkoutDraft(workout, {
    date: format(new Date(), 'yyyy-MM-dd'),
    program_day: format(new Date(), 'EEE'),
    status,
    notes: status === 'planned' ? 'Planned session queued from a previous workout.' : '',
    rpe: status === 'planned' ? null : workout.rpe,
    duration_minutes: status === 'planned' ? workout.duration_minutes : workout.duration_minutes,
  })
}

export interface WorkoutTemplate {
  id: string
  label: string
  blurb: string
  workout_type: WorkoutType
  program_block: string
  title: string
  program_week: number
  duration_minutes: number
  notes: string
  exercises: ExerciseDraft[]
}

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'hyrox-race-rehearsal',
    label: 'Race Rehearsal',
    blurb: 'Compromised stations with race-adjacent pressure.',
    workout_type: 'hyrox_sim',
    program_block: 'Race Specific',
    program_week: 12,
    title: 'Half Hyrox Simulation',
    duration_minutes: 78,
    notes: 'Hold transitions together and stay smooth under fatigue.',
    exercises: [
      {
        exercise_name: 'Race Pace Row',
        category: 'row',
        sets: null,
        reps: null,
        weight_kg: null,
        distance_m: 1000,
        time_seconds: 245,
        calories: 78,
        notes: 'Controlled but committed.',
      },
      {
        exercise_name: 'Sled Push',
        category: 'sled_push',
        sets: null,
        reps: null,
        weight_kg: 125,
        distance_m: 50,
        time_seconds: null,
        calories: null,
        notes: 'Short, driving steps.',
      },
      {
        exercise_name: 'Wall Ball',
        category: 'wall_ball',
        sets: 5,
        reps: 20,
        weight_kg: null,
        distance_m: null,
        time_seconds: null,
        calories: null,
        notes: 'Finish with clean catches.',
      },
    ],
  },
  {
    id: 'threshold-run',
    label: 'Threshold Run',
    blurb: 'Engine-builder with Hyrox-specific fatigue carryover.',
    workout_type: 'run',
    program_block: 'Build & Strength',
    program_week: 8,
    title: 'Threshold Run + Burpee Touches',
    duration_minutes: 56,
    notes: 'Settle into pace by rep two and protect mechanics.',
    exercises: [
      {
        exercise_name: 'Threshold Intervals',
        category: 'run',
        sets: null,
        reps: null,
        weight_kg: null,
        distance_m: 4800,
        time_seconds: 1260,
        calories: null,
        notes: 'Even splits.',
      },
      {
        exercise_name: 'Burpee Broad Jump',
        category: 'burpee_broad_jump',
        sets: null,
        reps: 40,
        weight_kg: null,
        distance_m: 50,
        time_seconds: null,
        calories: null,
        notes: 'Stay deliberate.',
      },
    ],
  },
  {
    id: 'strength-sled',
    label: 'Strength + Sled',
    blurb: 'Lower-body force with station-specific loading.',
    workout_type: 'strength',
    program_block: 'Build & Strength',
    program_week: 7,
    title: 'Lower Body Force + Sled Power',
    duration_minutes: 64,
    notes: 'Prioritise quality lifts and posture under load.',
    exercises: [
      {
        exercise_name: 'Back Squat',
        category: 'strength',
        sets: 4,
        reps: 5,
        weight_kg: 70,
        distance_m: null,
        time_seconds: null,
        calories: null,
        notes: 'Strong brace.',
      },
      {
        exercise_name: 'Sled Push',
        category: 'sled_push',
        sets: null,
        reps: null,
        weight_kg: 120,
        distance_m: 50,
        time_seconds: null,
        calories: null,
        notes: 'Drive through the floor.',
      },
      {
        exercise_name: 'Wall Ball',
        category: 'wall_ball',
        sets: 4,
        reps: 20,
        weight_kg: null,
        distance_m: null,
        time_seconds: null,
        calories: null,
        notes: 'No broken sets until rep 15.',
      },
    ],
  },
  {
    id: 'recovery-flush',
    label: 'Recovery Flush',
    blurb: 'Easy aerobic work and mobility reset.',
    workout_type: 'recovery',
    program_block: 'Deload / Reset',
    program_week: 1,
    title: 'Recovery Flush + Mobility',
    duration_minutes: 38,
    notes: 'Keep this genuinely easy.',
    exercises: [
      {
        exercise_name: 'Easy Flush',
        category: 'run',
        sets: null,
        reps: null,
        weight_kg: null,
        distance_m: 3500,
        time_seconds: 1350,
        calories: null,
        notes: 'Conversational.',
      },
      {
        exercise_name: 'Mobility Flow',
        category: 'mobility',
        sets: null,
        reps: null,
        weight_kg: null,
        distance_m: null,
        time_seconds: null,
        calories: null,
        notes: 'Hips, calves, shoulders.',
      },
    ],
  },
]

export function createDraftFromTemplate(
  template: WorkoutTemplate,
  status: WorkoutStatus = 'completed',
): WorkoutDraft {
  const today = new Date()

  return {
    date: format(today, 'yyyy-MM-dd'),
    program_block: template.program_block,
    program_week: template.program_week,
    program_day: format(today, 'EEE'),
    title: template.title,
    workout_type: template.workout_type,
    status,
    duration_minutes: status === 'planned' ? template.duration_minutes : template.duration_minutes,
    rpe: status === 'planned' ? null : 7,
    notes:
      status === 'planned'
        ? `Planned from the ${template.label} template.`
        : template.notes,
    exercises: template.exercises,
  }
}
