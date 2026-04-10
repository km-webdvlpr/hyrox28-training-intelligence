import { addDaysToDate, getWeekRange, isoNow, isPastDate, listDateRange, sortDateAscending, todayDateString } from './date.ts'
import type {
  Completion,
  CompletionStatus,
  Domain,
  Habit,
  InsightCardData,
  LogCompletionInput,
  MoodEnergyLog,
  RecurrenceRule,
  Routine,
  RoutineActionLog,
  RoutineItem,
  RoutineSummary,
  RoutineSession,
  ScheduledInstance,
  SkipReasonCode,
  TodayItem,
  WeeklyReview,
} from '../types/execution.ts'

export const SKIP_REASON_LABELS: Record<SkipReasonCode, string> = {
  time: 'Time pressure',
  energy: 'Low energy',
  forgot: 'Forgot',
  disrupted: 'Disrupted day',
  unrealistic: 'Target too ambitious',
  not_relevant: 'Not relevant today',
  other: 'Other',
}

export function buildRuleHash(habit: Habit) {
  return JSON.stringify({
    recurrenceRule: habit.recurrenceRule,
    windowStart: habit.windowStart,
    windowEnd: habit.windowEnd,
    targetValue: habit.targetValue,
  })
}

export function habitMatchesDate(rule: RecurrenceRule, date: string) {
  if (sortDateAscending(date, rule.startDate) < 0) return false

  const jsDate = new Date(`${date}T00:00:00`)
  const weekDay = jsDate.getDay()

  if (rule.type === 'daily') return true
  if (rule.type === 'weekdays') return weekDay >= 1 && weekDay <= 5
  if (rule.type === 'selected_weekdays') return rule.daysOfWeek?.includes(weekDay) ?? false
  if (rule.type === 'every_n_days') {
    const start = new Date(`${rule.startDate}T00:00:00`)
    const diffDays = Math.round((jsDate.getTime() - start.getTime()) / 86400000)
    const interval = Math.max(rule.intervalDays ?? 1, 1)
    return diffDays % interval === 0
  }

  return false
}

export function buildScheduledInstancesForHabit(
  habit: Habit,
  startDate: string,
  endDate: string,
  existing: ScheduledInstance[],
) {
  const existingKeys = new Set(
    existing
      .filter((item) => item.sourceId === habit.id)
      .map((item) => `${item.sourceId}:${item.date}:${item.createdFromRuleHash}`),
  )

  const ruleHash = buildRuleHash(habit)

  return listDateRange(startDate, endDate)
    .filter((date) => habitMatchesDate(habit.recurrenceRule, date))
    .filter((date) => !existingKeys.has(`${habit.id}:${date}:${ruleHash}`))
    .map<ScheduledInstance>((date) => ({
      id: crypto.randomUUID(),
      userId: habit.userId,
      sourceType: 'habit',
      sourceId: habit.id,
      date,
      scheduledStart: habit.windowStart ?? null,
      scheduledEnd: habit.windowEnd ?? null,
      plannedValue: habit.targetValue,
      status: 'planned',
      movedToInstanceId: null,
      createdFromRuleHash: ruleHash,
      createdAt: isoNow(),
    }))
}

export function computeCompletionFields(habit: Habit, input: LogCompletionInput) {
  const targetValue = habit.targetValue || 1

  if (input.status === 'skipped') {
    return {
      status: 'skipped' as CompletionStatus,
      actualValue: null,
      actualDurationMin: null,
      percentComplete: 0,
    }
  }

  if (habit.measurementType === 'binary') {
    return {
      status: input.status,
      actualValue: input.status === 'done' ? 1 : null,
      actualDurationMin: null,
      percentComplete: input.status === 'done' ? 100 : Math.max(input.percentComplete ?? 50, 1),
    }
  }

  if (habit.measurementType === 'duration') {
    const actualDuration = input.actualDurationMin ?? input.actualValue ?? null
    const percentComplete = Math.min(
      100,
      Math.max(
        input.percentComplete ??
          Math.round((((actualDuration ?? targetValue) as number) / targetValue) * 100),
        1,
      ),
    )

    return {
      status: percentComplete >= 100 ? ('done' as CompletionStatus) : input.status,
      actualValue: actualDuration,
      actualDurationMin: actualDuration,
      percentComplete,
    }
  }

  const actualValue = input.actualValue ?? targetValue
  const percentComplete = Math.min(
    100,
    Math.max(input.percentComplete ?? Math.round((actualValue / targetValue) * 100), 1),
  )

  return {
    status: percentComplete >= 100 ? ('done' as CompletionStatus) : input.status,
    actualValue,
    actualDurationMin: null,
    percentComplete,
  }
}

export function mapTodayItems(
  instances: ScheduledInstance[],
  habits: Habit[],
  domains: Domain[],
  completions: Completion[],
) {
  const habitMap = new Map(habits.map((habit) => [habit.id, habit]))
  const domainMap = new Map(domains.map((domain) => [domain.id, domain]))
  const completionMap = new Map(completions.map((completion) => [completion.scheduledInstanceId, completion]))

  return instances
    .filter((instance) => instance.date === todayDateString() && instance.status !== 'moved')
    .sort((left, right) => {
      const leftTime = left.scheduledStart ?? '23:59'
      const rightTime = right.scheduledStart ?? '23:59'
      return leftTime.localeCompare(rightTime)
    })
    .map<TodayItem>((instance) => {
      const habit = habitMap.get(instance.sourceId)
      const domain = habit ? domainMap.get(habit.domainId) : undefined

      if (!habit || !domain) {
        throw new Error('A scheduled instance references a missing habit or domain.')
      }

      return {
        instance,
        habit,
        domain,
        completion: completionMap.get(instance.id),
      }
    })
}

function normalizedTargetValue(habit: Habit, instance: ScheduledInstance) {
  if (habit.measurementType === 'binary') return 1
  return instance.plannedValue ?? habit.targetValue
}

function normalizedActualValue(habit: Habit, completion?: Completion) {
  if (!completion) return 0
  if (completion.status === 'skipped') return 0
  if (habit.measurementType === 'binary') {
    return completion.status === 'done' ? 1 : completion.percentComplete / 100
  }

  if (habit.measurementType === 'duration') {
    return completion.actualDurationMin ?? completion.actualValue ?? 0
  }

  return completion.actualValue ?? 0
}

export function buildWeeklyReview(
  date: Date,
  habits: Habit[],
  domains: Domain[],
  instances: ScheduledInstance[],
  completions: Completion[],
  moodLogs: MoodEnergyLog[],
): WeeklyReview {
  const { startDate, endDate } = getWeekRange(date)
  const weekInstances = instances.filter(
    (instance) =>
      sortDateAscending(instance.date, startDate) >= 0 && sortDateAscending(instance.date, endDate) <= 0,
  )
  const reviewableInstances = weekInstances.filter((instance) => instance.status !== 'moved')

  const completionMap = new Map(completions.map((completion) => [completion.scheduledInstanceId, completion]))
  const habitMap = new Map(habits.map((habit) => [habit.id, habit]))
  const domainMap = new Map(domains.map((domain) => [domain.id, domain]))

  let doneCount = 0
  let partialCount = 0
  let skippedCount = 0
  let movedCount = 0
  let missedCount = 0
  let weightedCompletion = 0
  let plannedTotal = 0
  let actualTotal = 0
  const skipReasonBuckets = new Map<SkipReasonCode, number>()
  const habitStatMap = new Map<string, WeeklyReview['habitStats'][number]>()
  const domainStatMap = new Map<string, WeeklyReview['domainStats'][number]>()

  for (const instance of weekInstances) {
    const habit = habitMap.get(instance.sourceId)
    if (!habit) continue

    const domain = domainMap.get(habit.domainId)
    if (!domain) continue

    const completion = completionMap.get(instance.id)

    if (instance.status === 'moved') {
      movedCount += 1
      continue
    }

    const habitBucket = habitStatMap.get(habit.id) ?? {
      habitId: habit.id,
      habitTitle: habit.title,
      domainId: domain.id,
      planned: 0,
      done: 0,
      partial: 0,
      skipped: 0,
      weightedCompletion: 0,
    }

    const domainBucket = domainStatMap.get(domain.id) ?? {
      domainId: domain.id,
      domainName: domain.name,
      planned: 0,
      weightedCompletion: 0,
      completionRate: 0,
    }

    habitBucket.planned += 1
    domainBucket.planned += 1
    plannedTotal += normalizedTargetValue(habit, instance)

    if (instance.status === 'missed') missedCount += 1

    if (completion?.status === 'done') {
      doneCount += 1
      habitBucket.done += 1
      habitBucket.weightedCompletion += 1
      domainBucket.weightedCompletion += 1
      weightedCompletion += 1
    } else if (completion?.status === 'partial') {
      partialCount += 1
      const partialWeight = completion.percentComplete / 100
      habitBucket.partial += 1
      habitBucket.weightedCompletion += partialWeight
      domainBucket.weightedCompletion += partialWeight
      weightedCompletion += partialWeight
    } else if (completion?.status === 'skipped') {
      skippedCount += 1
      habitBucket.skipped += 1
      if (completion.skipReasonCode) {
        skipReasonBuckets.set(
          completion.skipReasonCode,
          (skipReasonBuckets.get(completion.skipReasonCode) ?? 0) + 1,
        )
      }
    }

    actualTotal += normalizedActualValue(habit, completion)
    habitStatMap.set(habit.id, habitBucket)
    domainStatMap.set(domain.id, domainBucket)
  }

  const domainStats = [...domainStatMap.values()].map((entry) => ({
    ...entry,
    completionRate: entry.planned ? entry.weightedCompletion / entry.planned : 0,
  }))

  const weekMoodLogs = moodLogs.filter(
    (entry) => sortDateAscending(entry.date, startDate) >= 0 && sortDateAscending(entry.date, endDate) <= 0,
  )

  const review: WeeklyReview = {
    startDate,
    endDate,
    plannedCount: reviewableInstances.length,
    doneCount,
    partialCount,
    skippedCount,
    movedCount,
    missedCount,
    completionRate: reviewableInstances.length
      ? weightedCompletion / reviewableInstances.length
      : 0,
    plannedVsActualRatio: plannedTotal ? actualTotal / plannedTotal : 0,
    topSkipReasons: [...skipReasonBuckets.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count })),
    domainStats,
    habitStats: [...habitStatMap.values()].sort(
      (left, right) => right.weightedCompletion - left.weightedCompletion,
    ),
    consistencyTrend: buildConsistencyTrend(startDate, habits, instances, completions),
    insights: [],
    averageMood: weekMoodLogs.length
      ? weekMoodLogs.reduce((sum, entry) => sum + entry.mood, 0) / weekMoodLogs.length
      : null,
    averageEnergy: weekMoodLogs.length
      ? weekMoodLogs.reduce((sum, entry) => sum + entry.energy, 0) / weekMoodLogs.length
      : null,
    moodLogCount: weekMoodLogs.length,
  }

  review.insights = buildInsights(review)
  return review
}

function buildConsistencyTrend(
  weekStartDate: string,
  habits: Habit[],
  instances: ScheduledInstance[],
  completions: Completion[],
) {
  const completionMap = new Map(completions.map((completion) => [completion.scheduledInstanceId, completion]))
  const habitMap = new Map(habits.map((habit) => [habit.id, habit]))

  return Array.from({ length: 7 }, (_, index) => {
    const currentDate = addDaysToDate(weekStartDate, index)
    const dayInstances = instances.filter(
      (instance) => instance.date === currentDate && instance.status !== 'moved',
    )
    if (!dayInstances.length) return 0

    let weighted = 0
    for (const instance of dayInstances) {
      const completion = completionMap.get(instance.id)
      const habit = habitMap.get(instance.sourceId)
      if (!habit) continue
      if (completion?.status === 'done') weighted += 1
      if (completion?.status === 'partial') weighted += completion.percentComplete / 100
    }

    return weighted / dayInstances.length
  })
}

function buildInsights(review: WeeklyReview) {
  const insights: InsightCardData[] = []

  if (review.plannedCount >= 3) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'planned_vs_actual',
      title: 'Planned vs actual',
      body: `You delivered ${Math.round(review.plannedVsActualRatio * 100)}% of the value you planned this week.`,
    })
  }

  if (review.partialCount + review.skippedCount >= 3) {
    const dominant = review.partialCount >= review.skippedCount ? 'partials' : 'skips'
    insights.push({
      id: crypto.randomUUID(),
      type: 'partial_vs_skipped',
      title: 'Where the plan slipped',
      body: `Most non-completions became ${dominant}, which shows whether your plan is recoverable or simply not landing.`,
    })
  }

  if (review.topSkipReasons.length >= 1 && review.skippedCount >= 3) {
    const topReason = review.topSkipReasons[0]
    insights.push({
      id: crypto.randomUUID(),
      type: 'top_skip_reason',
      title: 'Top skip reason',
      body: `${SKIP_REASON_LABELS[topReason.reason]} accounted for ${topReason.count} skips this week.`,
    })
  }

  if (review.domainStats.length >= 2) {
    const strongest = [...review.domainStats].sort(
      (left, right) => right.completionRate - left.completionRate,
    )[0]
    const weakest = [...review.domainStats].sort(
      (left, right) => left.completionRate - right.completionRate,
    )[0]

    if (strongest && weakest && strongest.domainId !== weakest.domainId) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'domain_balance',
        title: 'Domain balance',
        body: `${strongest.domainName} held strongest while ${weakest.domainName} had the weakest follow-through.`,
      })
    }
  }

  if (review.habitStats.length >= 1 && review.habitStats[0].planned >= 3) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'habit_completion_rate',
      title: 'Best-held habit',
      body: `${review.habitStats[0].habitTitle} was your steadiest behavior this week.`,
    })
  }

  return insights
}

export function markPastInstancesMissed(instances: ScheduledInstance[]) {
  let changed = false
  const nextInstances = instances.map((instance) => {
    if (instance.status === 'planned' && isPastDate(instance.date)) {
      changed = true
      return {
        ...instance,
        status: 'missed' as const,
      }
    }

    return instance
  })

  return { changed, nextInstances }
}

export function buildDefaultCompletionPayload(
  habit: Habit,
  status: CompletionStatus,
): Pick<LogCompletionInput, 'actualValue' | 'actualDurationMin' | 'percentComplete'> {
  if (status === 'skipped') {
    return { actualValue: null, actualDurationMin: null, percentComplete: 0 }
  }

  if (habit.measurementType === 'binary') {
    return { actualValue: 1, actualDurationMin: null, percentComplete: 100 }
  }

  if (habit.measurementType === 'duration') {
    return {
      actualValue: habit.targetValue,
      actualDurationMin: habit.targetValue,
      percentComplete: 100,
    }
  }

  return { actualValue: habit.targetValue, actualDurationMin: null, percentComplete: 100 }
}

export function getTodayMoodLog(logs: MoodEnergyLog[]) {
  return logs.find((entry) => entry.date === todayDateString())
}

export function buildRoutineSummaries(
  routines: Routine[],
  routineItems: RoutineItem[],
  routineSessions: RoutineSession[],
  routineActionLogs: RoutineActionLog[],
) {
  const today = todayDateString()
  const itemMap = new Map<string, RoutineItem[]>()
  const todaySessionIds = new Set(
    routineSessions.filter((session) => session.date === today).map((session) => session.id),
  )
  const sessionMap = new Map(routineSessions.map((session) => [session.id, session]))

  for (const item of routineItems) {
    const bucket = itemMap.get(item.routineId) ?? []
    bucket.push(item)
    itemMap.set(item.routineId, bucket.sort((left, right) => left.position - right.position))
  }

  return routines
    .filter((routine) => routine.state !== 'archived')
    .map<RoutineSummary>((routine) => {
      const todaySession = routineSessions.find(
        (session) => session.routineId === routine.id && session.date === today,
      )

      return {
        routine,
        items: itemMap.get(routine.id) ?? [],
        launchedToday: Boolean(todaySession),
        launchedTodaySessionId: todaySession?.id ?? null,
        completedActionItemIds: routineActionLogs
          .filter((log) => {
            const session = sessionMap.get(log.routineSessionId)
            return session?.routineId === routine.id && todaySessionIds.has(log.routineSessionId)
          })
          .map((log) => log.routineItemId),
      }
    })
}
