import { addDays, format, formatISO, startOfWeek, subWeeks } from 'date-fns'
import type { ExerciseDraft, Workout, WorkoutExercise, WorkoutStatus, WorkoutType } from '../types/workouts.ts'

interface SeedBundle {
  workouts: Workout[]
  exercises: WorkoutExercise[]
}

interface SessionBlueprint {
  dayOffset: number
  workoutType: WorkoutType
  title: string
}

function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function pick<T>(values: T[], random: () => number) {
  return values[Math.floor(random() * values.length)]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function blockForWeek(week: number) {
  if (week <= 3) return 'Foundation Engine'
  if (week <= 7) return 'Build & Strength'
  return 'Race Specific'
}

function statusForType(type: WorkoutType, random: () => number): WorkoutStatus {
  const roll = random()

  if (type === 'recovery') {
    if (roll < 0.58) return 'completed'
    if (roll < 0.82) return 'modified'
    return 'skipped'
  }

  if (type === 'hyrox_sim') {
    if (roll < 0.78) return 'completed'
    if (roll < 0.9) return 'modified'
    return 'skipped'
  }

  if (roll < 0.72) return 'completed'
  if (roll < 0.88) return 'modified'
  return 'skipped'
}

function buildExercises(
  workoutType: WorkoutType,
  week: number,
  random: () => number,
): ExerciseDraft[] {
  const strengthWeight = 52.5 + week * 2 + Math.round(random() * 8) * 2.5
  const stationWeight = 95 + week * 4 + Math.round(random() * 5) * 5
  const carryWeight = 20 + week * 1.5 + Math.round(random() * 4) * 2.5
  const runDistance = 800 + Math.round(random() * 3) * 400
  const rowDistance = 1000 + Math.round(random() * 2) * 250
  const skiDistance = 900 + Math.round(random() * 2) * 300

  switch (workoutType) {
    case 'strength':
      return [
        {
          exercise_name: 'Back Squat',
          category: 'strength',
          sets: 4,
          reps: 5,
          weight_kg: strengthWeight,
          distance_m: null,
          time_seconds: null,
          calories: null,
          notes: 'Drive out of the hole with clean tempo.',
        },
        {
          exercise_name: 'Sled Push',
          category: 'sled_push',
          sets: null,
          reps: null,
          weight_kg: stationWeight,
          distance_m: 50,
          time_seconds: null,
          calories: null,
          notes: 'Focus on body angle and smooth restarts.',
        },
        {
          exercise_name: 'Wall Ball',
          category: 'wall_ball',
          sets: 4,
          reps: 18 + Math.round(random() * 4),
          weight_kg: null,
          distance_m: null,
          time_seconds: null,
          calories: null,
          notes: 'Keep depth and catch rhythm tight.',
        },
      ]
    case 'run':
      return [
        {
          exercise_name: 'Warm-up Mobility',
          category: 'mobility',
          sets: null,
          reps: null,
          weight_kg: null,
          distance_m: null,
          time_seconds: null,
          calories: null,
          notes: 'Ankles, hips, calves.',
        },
        {
          exercise_name: 'Threshold Intervals',
          category: 'run',
          sets: null,
          reps: null,
          weight_kg: null,
          distance_m: runDistance * 4,
          time_seconds: 1060 + Math.round(random() * 180),
          calories: null,
          notes: 'Settle into even pacing from rep two.',
        },
        {
          exercise_name: 'Burpee Broad Jump Touches',
          category: 'burpee_broad_jump',
          sets: null,
          reps: 36 + Math.round(random() * 12),
          weight_kg: null,
          distance_m: 40 + Math.round(random() * 20),
          time_seconds: null,
          calories: null,
          notes: 'Land softly and hold chest over hips.',
        },
      ]
    case 'row':
      return [
        {
          exercise_name: 'Erg Prep',
          category: 'mobility',
          sets: null,
          reps: null,
          weight_kg: null,
          distance_m: null,
          time_seconds: null,
          calories: null,
          notes: 'Thoracic and hip opener block.',
        },
        {
          exercise_name: 'Row Erg Main Set',
          category: 'row',
          sets: null,
          reps: null,
          weight_kg: null,
          distance_m: rowDistance * 3,
          time_seconds: 900 + Math.round(random() * 150),
          calories: 150 + Math.round(random() * 35),
          notes: 'Keep split under control through the last third.',
        },
        {
          exercise_name: 'Farmer Carry',
          category: 'farmer_carry',
          sets: null,
          reps: null,
          weight_kg: carryWeight,
          distance_m: 160,
          time_seconds: null,
          calories: null,
          notes: 'Relax shoulders and keep cadence short.',
        },
      ]
    case 'ski':
      return [
        {
          exercise_name: 'Ski Erg Primer',
          category: 'ski',
          sets: null,
          reps: null,
          weight_kg: null,
          distance_m: skiDistance * 3,
          time_seconds: 930 + Math.round(random() * 160),
          calories: 155 + Math.round(random() * 25),
          notes: 'Push hips back and snap tall.',
        },
        {
          exercise_name: 'Sandbag Lunge',
          category: 'sandbag_lunge',
          sets: null,
          reps: null,
          weight_kg: 18 + Math.round(random() * 4) * 2.5,
          distance_m: 80,
          time_seconds: null,
          calories: null,
          notes: 'Hold posture through each turn.',
        },
        {
          exercise_name: 'Thoracic Reset',
          category: 'mobility',
          sets: null,
          reps: null,
          weight_kg: null,
          distance_m: null,
          time_seconds: null,
          calories: null,
          notes: 'Open rib cage after the erg work.',
        },
      ]
    case 'mixed':
      return [
        {
          exercise_name: 'Compromised Run',
          category: 'run',
          sets: null,
          reps: null,
          weight_kg: null,
          distance_m: 1200 + Math.round(random() * 4) * 200,
          time_seconds: 390 + Math.round(random() * 90),
          calories: null,
          notes: 'Find race rhythm after each station.',
        },
        {
          exercise_name: 'Sled Pull',
          category: 'sled_pull',
          sets: null,
          reps: null,
          weight_kg: stationWeight - 15,
          distance_m: 50,
          time_seconds: null,
          calories: null,
          notes: 'Strong grip and full arm extension.',
        },
        {
          exercise_name: 'Farmer Carry',
          category: 'farmer_carry',
          sets: null,
          reps: null,
          weight_kg: carryWeight + 2.5,
          distance_m: 120,
          time_seconds: null,
          calories: null,
          notes: 'Keep turnover sharp while breathing settles.',
        },
      ]
    case 'hyrox_sim':
      return [
        {
          exercise_name: 'Race Pace Row',
          category: 'row',
          sets: null,
          reps: null,
          weight_kg: null,
          distance_m: 1000,
          time_seconds: 238 + Math.round(random() * 24),
          calories: 75 + Math.round(random() * 12),
          notes: 'Hold pressure without spiking early.',
        },
        {
          exercise_name: 'Sled Push',
          category: 'sled_push',
          sets: null,
          reps: null,
          weight_kg: stationWeight + 10,
          distance_m: 50,
          time_seconds: null,
          calories: null,
          notes: 'Shorter steps when the belt bites back.',
        },
        {
          exercise_name: 'Burpee Broad Jump',
          category: 'burpee_broad_jump',
          sets: null,
          reps: 44 + Math.round(random() * 8),
          weight_kg: null,
          distance_m: 80,
          time_seconds: null,
          calories: null,
          notes: 'Keep transitions deliberate, not frantic.',
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
          notes: 'Finish under fatigue with clean catches.',
        },
      ]
    case 'recovery':
      return [
        {
          exercise_name: 'Easy Flush',
          category: 'run',
          sets: null,
          reps: null,
          weight_kg: null,
          distance_m: 3000 + Math.round(random() * 3) * 500,
          time_seconds: 1200 + Math.round(random() * 240),
          calories: null,
          notes: 'Stay relaxed and conversational.',
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
          notes: 'Hips, calves, shoulders and trunk.',
        },
      ]
  }
}

function noteForStatus(status: WorkoutStatus, random: () => number) {
  const completedNotes = [
    'Held the intended pacing and kept transitions tidy.',
    'Felt composed throughout and finished stronger than the opener.',
    'Solid training day with enough pressure but no technical drop-off.',
  ]

  const modifiedNotes = [
    'Trimmed the final block to keep legs fresh for the weekend simulation.',
    'Dialled back intensity after the warm-up felt heavier than expected.',
    'Kept the session on track but shortened one station to manage fatigue.',
  ]

  const skippedNotes = [
    'Work travel squeezed this one out. Rolling the intent into the next session.',
    'Recovery markers were off, so the session was shelved rather than forced.',
    'Time window collapsed today. Logged as skipped and moved on cleanly.',
  ]

  if (status === 'completed') return pick(completedNotes, random)
  if (status === 'modified') return pick(modifiedNotes, random)
  return pick(skippedNotes, random)
}

function plannedDuration(workoutType: WorkoutType, random: () => number) {
  const base: Record<WorkoutType, number> = {
    run: 58,
    strength: 66,
    hyrox_sim: 78,
    row: 54,
    ski: 52,
    recovery: 38,
    mixed: 64,
  }

  return base[workoutType] + Math.round(random() * 14) - 6
}

function plannedRpe(workoutType: WorkoutType, status: WorkoutStatus, random: () => number) {
  const base: Record<WorkoutType, number> = {
    run: 7.1,
    strength: 7.8,
    hyrox_sim: 8.6,
    row: 6.9,
    ski: 7.0,
    recovery: 4.2,
    mixed: 7.6,
  }

  if (status === 'skipped') return null
  const modifier = status === 'modified' ? -0.6 : 0
  return Number(clamp(base[workoutType] + modifier + (random() * 1.2 - 0.6), 3.5, 9.5).toFixed(1))
}

export function createSeedData(): SeedBundle {
  const workouts: Workout[] = []
  const exercises: WorkoutExercise[] = []
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const firstWeekStart = subWeeks(thisWeekStart, 10)

  for (let weekIndex = 0; weekIndex < 10; weekIndex += 1) {
    const programWeek = weekIndex + 1
    const random = createRandom(programWeek * 917)
    const weekStart = addDays(firstWeekStart, weekIndex * 7)
    const rowOrSki: SessionBlueprint['workoutType'] = weekIndex % 2 === 0 ? 'row' : 'ski'

    const sessions: SessionBlueprint[] = [
      { dayOffset: 0, workoutType: 'strength', title: 'Lower Body Force + Sled Power' },
      { dayOffset: 1, workoutType: 'run', title: 'Threshold Run + Burpee Touches' },
      {
        dayOffset: 2,
        workoutType: rowOrSki,
        title: rowOrSki === 'row' ? 'Row Engine Builder' : 'Ski Erg Threshold Builder',
      },
      { dayOffset: 3, workoutType: 'mixed', title: 'Compromised Run + Carry Circuit' },
      {
        dayOffset: 5,
        workoutType: 'hyrox_sim',
        title: weekIndex % 3 === 0 ? 'Half Hyrox Simulation' : 'Station Grind Rehearsal',
      },
      { dayOffset: 6, workoutType: 'recovery', title: 'Recovery Flush + Mobility' },
    ]

    for (const session of sessions) {
      const status = statusForType(session.workoutType, random)
      const workoutDate = addDays(weekStart, session.dayOffset)
      const workoutId = `seed-workout-${programWeek}-${session.dayOffset}`
      const isoDate = formatISO(workoutDate, { representation: 'date' })
      const durationBase = plannedDuration(session.workoutType, random)
      const duration =
        status === 'skipped'
          ? 0
          : status === 'modified'
            ? Math.max(20, durationBase - (8 + Math.round(random() * 8)))
            : durationBase

      const createdAt = new Date(`${isoDate}T05:45:00`).toISOString()
      const builtExercises = buildExercises(session.workoutType, programWeek, random)

      workouts.push({
        id: workoutId,
        date: isoDate,
        program_block: blockForWeek(programWeek),
        program_week: programWeek,
        program_day: format(workoutDate, 'EEE'),
        title: session.title,
        workout_type: session.workoutType,
        status,
        duration_minutes: duration,
        rpe: plannedRpe(session.workoutType, status, random),
        notes: noteForStatus(status, random),
        created_at: createdAt,
        updated_at: createdAt,
      })

      builtExercises.forEach((exercise, index) => {
        exercises.push({
          id: `seed-exercise-${programWeek}-${session.dayOffset}-${index + 1}`,
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
        })
      })
    }
  }

  return { workouts, exercises }
}
