import {
  endOfDay,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import type { WorkoutType, WorkoutWithExercises } from '../types/workouts.ts'

export interface WeeklyMetric {
  weekKey: string
  weekLabel: string
  totalWorkouts: number
  completed: number
  modified: number
  skipped: number
  completionRate: number
  modifiedRate: number
  skippedRate: number
  totalDuration: number
  avgRpe: number | null
  volumeByType: Record<WorkoutType, number>
  runDistance: number
  rowDistance: number
  skiDistance: number
}

export interface WeekdayMetric {
  key: string
  label: string
  total: number
  completed: number
  modified: number
  skipped: number
  adherenceRate: number
  totalDuration: number
}

export interface AnalyticsBundle {
  totalWorkouts: number
  completionRate: number
  skippedRate: number
  modifiedRate: number
  currentStreak: number
  weeklyVolume: number
  averageRpe: number | null
  totalDistance: number
  totalRunDistance: number
  totalRowDistance: number
  totalSkiDistance: number
  mostSkippedWorkoutType: WorkoutType | null
  highestVolumeWeek: WeeklyMetric | null
  rpeTrendDirection: 'rising' | 'stable' | 'falling'
  bestWeekday: WeekdayMetric | null
  workoutTypeDistribution: Array<{ name: string; value: number }>
  weeklyMetrics: WeeklyMetric[]
  completionTrend: Array<{ weekLabel: string; completionRate: number }>
  weeklyVolumeTrend: Array<Record<string, number | string>>
  distanceTrend: Array<{ weekLabel: string; run: number; row: number; ski: number }>
  fatigueScatter: Array<{ weekLabel: string; volume: number; rpe: number }>
  weekdayMetrics: WeekdayMetric[]
}

const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function blankVolumeByType(): Record<WorkoutType, number> {
  return {
    run: 0,
    strength: 0,
    hyrox_sim: 0,
    row: 0,
    ski: 0,
    recovery: 0,
    mixed: 0,
  }
}

function withinInclusiveRange(date: Date, start?: Date, end?: Date) {
  if (start && isBefore(date, startOfDay(start))) return false
  if (end && isAfter(date, endOfDay(end))) return false
  return true
}

function average(values: number[]) {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function filterWorkoutsByDateRange(
  workouts: WorkoutWithExercises[],
  startDate?: string,
  endDate?: string,
) {
  const start = startDate ? parseISO(startDate) : undefined
  const end = endDate ? parseISO(endDate) : undefined
  return workouts.filter((workout) => withinInclusiveRange(parseISO(workout.date), start, end))
}

export function buildAnalyticsBundle(workouts: WorkoutWithExercises[]): AnalyticsBundle {
  const ordered = [...workouts].sort((left, right) => left.date.localeCompare(right.date))
  const weeklyMap = new Map<string, WeeklyMetric & { rpeValues: number[] }>()
  const weekdayMap = new Map<string, WeekdayMetric>()
  const skippedByType = new Map<WorkoutType, number>()
  const distribution = new Map<WorkoutType, number>()
  const averageRpeValues: number[] = []

  let completed = 0
  let modified = 0
  let skipped = 0
  let totalRunDistance = 0
  let totalRowDistance = 0
  let totalSkiDistance = 0

  for (const weekday of weekdayOrder) {
    weekdayMap.set(weekday, {
      key: weekday,
      label: weekday,
      total: 0,
      completed: 0,
      modified: 0,
      skipped: 0,
      adherenceRate: 0,
      totalDuration: 0,
    })
  }

  for (const workout of ordered) {
    const workoutDate = parseISO(workout.date)
    const weekStart = startOfWeek(workoutDate, { weekStartsOn: 1 })
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    const weekdayKey = format(workoutDate, 'EEE')

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        weekKey,
        weekLabel: `${format(weekStart, 'dd MMM')} - ${format(endOfWeek(workoutDate, { weekStartsOn: 1 }), 'dd MMM')}`,
        totalWorkouts: 0,
        completed: 0,
        modified: 0,
        skipped: 0,
        completionRate: 0,
        modifiedRate: 0,
        skippedRate: 0,
        totalDuration: 0,
        avgRpe: null,
        volumeByType: blankVolumeByType(),
        runDistance: 0,
        rowDistance: 0,
        skiDistance: 0,
        rpeValues: [],
      })
    }

    distribution.set(workout.workout_type, (distribution.get(workout.workout_type) ?? 0) + 1)

    const weekEntry = weeklyMap.get(weekKey)!
    const weekdayEntry = weekdayMap.get(weekdayKey)

    weekEntry.totalWorkouts += 1
    if (weekdayEntry) weekdayEntry.total += 1

    if (workout.status === 'completed') {
      completed += 1
      weekEntry.completed += 1
      if (weekdayEntry) weekdayEntry.completed += 1
    }

    if (workout.status === 'modified') {
      modified += 1
      weekEntry.modified += 1
      if (weekdayEntry) weekdayEntry.modified += 1
    }

    if (workout.status === 'skipped') {
      skipped += 1
      weekEntry.skipped += 1
      skippedByType.set(workout.workout_type, (skippedByType.get(workout.workout_type) ?? 0) + 1)
      if (weekdayEntry) weekdayEntry.skipped += 1
    }

    const countsForVolume = workout.status !== 'skipped'
    if (countsForVolume) {
      weekEntry.totalDuration += workout.duration_minutes
      weekEntry.volumeByType[workout.workout_type] += workout.duration_minutes
      if (weekdayEntry) weekdayEntry.totalDuration += workout.duration_minutes

      if (workout.rpe !== null) {
        weekEntry.rpeValues.push(workout.rpe)
        averageRpeValues.push(workout.rpe)
      }

      for (const exercise of workout.exercises) {
        if (exercise.category === 'run' && exercise.distance_m) {
          weekEntry.runDistance += exercise.distance_m
          totalRunDistance += exercise.distance_m
        }

        if (exercise.category === 'row' && exercise.distance_m) {
          weekEntry.rowDistance += exercise.distance_m
          totalRowDistance += exercise.distance_m
        }

        if (exercise.category === 'ski' && exercise.distance_m) {
          weekEntry.skiDistance += exercise.distance_m
          totalSkiDistance += exercise.distance_m
        }
      }
    }
  }

  const weeklyMetrics = [...weeklyMap.values()].map((week) => ({
    ...week,
    completionRate: week.totalWorkouts ? (week.completed / week.totalWorkouts) * 100 : 0,
    modifiedRate: week.totalWorkouts ? (week.modified / week.totalWorkouts) * 100 : 0,
    skippedRate: week.totalWorkouts ? (week.skipped / week.totalWorkouts) * 100 : 0,
    avgRpe: average(week.rpeValues),
  }))

  const weekdayMetrics = weekdayOrder
    .map((key) => weekdayMap.get(key)!)
    .map((weekday) => ({
      ...weekday,
      adherenceRate: weekday.total ? ((weekday.completed + weekday.modified) / weekday.total) * 100 : 0,
    }))

  const workoutTypeDistribution = [...distribution.entries()].map(([name, value]) => ({
    name,
    value,
  }))

  const totalWorkouts = ordered.length
  const completionRate = totalWorkouts ? (completed / totalWorkouts) * 100 : 0
  const skippedRate = totalWorkouts ? (skipped / totalWorkouts) * 100 : 0
  const modifiedRate = totalWorkouts ? (modified / totalWorkouts) * 100 : 0

  let currentStreak = 0
  for (const workout of [...ordered].sort((left, right) => right.date.localeCompare(left.date))) {
    if (workout.status === 'skipped') break
    currentStreak += 1
  }

  const latestWeek = weeklyMetrics.at(-1) ?? null
  const highestVolumeWeek =
    weeklyMetrics.reduce<WeeklyMetric | null>((best, week) => {
      if (!best || week.totalDuration > best.totalDuration) return week
      return best
    }, null) ?? null

  const mostSkippedWorkoutType =
    [...skippedByType.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null

  const recentRpe = weeklyMetrics
    .map((week) => week.avgRpe)
    .filter((value): value is number => value !== null)

  const previousWindow = recentRpe.slice(-6, -3)
  const latestWindow = recentRpe.slice(-3)
  const recentAverage = average(latestWindow)
  const previousAverage = average(previousWindow)

  let rpeTrendDirection: 'rising' | 'stable' | 'falling' = 'stable'
  if (recentAverage !== null && previousAverage !== null) {
    if (recentAverage - previousAverage > 0.35) rpeTrendDirection = 'rising'
    if (recentAverage - previousAverage < -0.35) rpeTrendDirection = 'falling'
  }

  return {
    totalWorkouts,
    completionRate,
    skippedRate,
    modifiedRate,
    currentStreak,
    weeklyVolume: latestWeek?.totalDuration ?? 0,
    averageRpe: average(averageRpeValues),
    totalDistance: totalRunDistance + totalRowDistance + totalSkiDistance,
    totalRunDistance,
    totalRowDistance,
    totalSkiDistance,
    mostSkippedWorkoutType,
    highestVolumeWeek,
    rpeTrendDirection,
    bestWeekday:
      totalWorkouts === 0
        ? null
        : (weekdayMetrics.reduce<WeekdayMetric | null>((best, weekday) => {
            if (!best) return weekday
            if (weekday.adherenceRate > best.adherenceRate) return weekday
            if (weekday.adherenceRate === best.adherenceRate && weekday.total > best.total) {
              return weekday
            }
            return best
          }, null) ?? null),
    workoutTypeDistribution,
    weeklyMetrics,
    completionTrend: weeklyMetrics.map((week) => ({
      weekLabel: week.weekLabel,
      completionRate: Number(week.completionRate.toFixed(1)),
    })),
    weeklyVolumeTrend: weeklyMetrics.map((week) => ({
      weekLabel: week.weekLabel,
      ...week.volumeByType,
    })),
    distanceTrend: weeklyMetrics.map((week) => ({
      weekLabel: week.weekLabel,
      run: week.runDistance,
      row: week.rowDistance,
      ski: week.skiDistance,
    })),
    fatigueScatter: weeklyMetrics
      .filter((week) => week.avgRpe !== null)
      .map((week) => ({
        weekLabel: week.weekLabel,
        volume: week.totalDuration,
        rpe: Number(week.avgRpe!.toFixed(2)),
      })),
    weekdayMetrics,
  }
}
