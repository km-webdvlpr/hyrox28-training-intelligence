import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { createSeedData } from './seed.ts'
import type {
  BodyMetric,
  Workout,
  WorkoutDraft,
  WorkoutExercise,
  WorkoutWithExercises,
} from '../types/workouts.ts'

interface HyroxDbSchema extends DBSchema {
  workouts: {
    key: string
    value: Workout
  }
  workout_exercises: {
    key: string
    value: WorkoutExercise
    indexes: {
      'by-workout-id': string
    }
  }
  body_metrics: {
    key: string
    value: BodyMetric
  }
}

const DB_NAME = 'hyrox28-training-intelligence'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<HyroxDbSchema>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<HyroxDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('workout_exercises')) {
          const exerciseStore = db.createObjectStore('workout_exercises', { keyPath: 'id' })
          exerciseStore.createIndex('by-workout-id', 'workout_id')
        }

        if (!db.objectStoreNames.contains('body_metrics')) {
          db.createObjectStore('body_metrics', { keyPath: 'id' })
        }
      },
    })
  }

  return dbPromise
}

async function ensureSeedData() {
  const db = await getDb()
  const workoutCount = await db.count('workouts')
  if (workoutCount > 0) return

  const seed = createSeedData()
  const tx = db.transaction(['workouts', 'workout_exercises'], 'readwrite')

  await Promise.all([
    ...seed.workouts.map((workout) => tx.objectStore('workouts').put(workout)),
    ...seed.exercises.map((exercise) => tx.objectStore('workout_exercises').put(exercise)),
  ])

  await tx.done
}

function combineWorkouts(
  workouts: Workout[],
  exercises: WorkoutExercise[],
): WorkoutWithExercises[] {
  const exerciseMap = new Map<string, WorkoutExercise[]>()

  for (const exercise of exercises) {
    const bucket = exerciseMap.get(exercise.workout_id) ?? []
    bucket.push(exercise)
    exerciseMap.set(exercise.workout_id, bucket)
  }

  return [...workouts]
    .sort((left, right) => right.date.localeCompare(left.date))
    .map((workout) => ({
      ...workout,
      exercises: exerciseMap.get(workout.id) ?? [],
    }))
}

export async function listWorkoutsWithExercises() {
  await ensureSeedData()
  const db = await getDb()
  const [workouts, exercises] = await Promise.all([
    db.getAll('workouts'),
    db.getAll('workout_exercises'),
  ])

  return combineWorkouts(workouts, exercises)
}

export async function addWorkoutWithExercises(draft: WorkoutDraft) {
  const db = await getDb()
  const tx = db.transaction(['workouts', 'workout_exercises'], 'readwrite')
  const timestamp = new Date().toISOString()
  const workoutId = crypto.randomUUID()

  const workout: Workout = {
    id: workoutId,
    date: draft.date,
    program_block: draft.program_block,
    program_week: draft.program_week,
    program_day: draft.program_day,
    title: draft.title,
    workout_type: draft.workout_type,
    status: draft.status,
    duration_minutes: draft.duration_minutes,
    rpe: draft.rpe,
    notes: draft.notes,
    created_at: timestamp,
    updated_at: timestamp,
  }

  const exercises: WorkoutExercise[] = draft.exercises.map((exercise) => ({
    id: crypto.randomUUID(),
    workout_id: workoutId,
    exercise_name: exercise.exercise_name,
    category: exercise.category,
    sets: exercise.sets,
    reps: exercise.reps,
    weight_kg: exercise.weight_kg,
    distance_m: exercise.distance_m,
    time_seconds: exercise.time_seconds,
    calories: exercise.calories,
    notes: exercise.notes,
  }))

  await tx.objectStore('workouts').put(workout)
  await Promise.all(exercises.map((exercise) => tx.objectStore('workout_exercises').put(exercise)))
  await tx.done

  return {
    ...workout,
    exercises,
  }
}
