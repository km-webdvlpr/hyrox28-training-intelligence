export type LoggingMode = 'lite' | 'standard'

export type MeasurementType = 'binary' | 'count' | 'duration'

export type RecurrenceType = 'daily' | 'weekdays' | 'selected_weekdays' | 'every_n_days'

export type InstanceStatus =
  | 'planned'
  | 'done'
  | 'partial'
  | 'skipped'
  | 'moved'
  | 'missed'

export type CompletionStatus = 'done' | 'partial' | 'skipped'

export type EventType =
  | 'habit_created'
  | 'habit_updated'
  | 'domain_created'
  | 'domain_updated'
  | 'routine_created'
  | 'routine_updated'
  | 'routine_launched'
  | 'routine_action_logged'
  | 'instance_generated'
  | 'completion_logged'
  | 'instance_moved'
  | 'instance_marked_missed'
  | 'mood_logged'
  | 'notification_scheduled'
  | 'notification_updated'
  | 'notification_sent'
  | 'settings_updated'
  | 'onboarding_completed'

export type SkipReasonCode =
  | 'time'
  | 'energy'
  | 'forgot'
  | 'disrupted'
  | 'unrealistic'
  | 'not_relevant'
  | 'other'

export interface UserSettings {
  id: string
  email: string
  timezone: string
  loggingMode: LoggingMode
  defaultReminderEnabled: boolean
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface Domain {
  id: string
  userId: string
  name: string
  kind: 'system' | 'custom'
  color: string
  isArchived: boolean
  createdAt: string
}

export interface Goal {
  id: string
  userId: string
  domainId: string
  title: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  targetDate?: string | null
}

export interface RecurrenceRule {
  type: RecurrenceType
  startDate: string
  daysOfWeek?: number[]
  intervalDays?: number
}

export interface Habit {
  id: string
  userId: string
  domainId: string
  goalId?: string | null
  title: string
  measurementType: MeasurementType
  targetValue: number
  targetUnit: string
  recurrenceRule: RecurrenceRule
  windowStart?: string | null
  windowEnd?: string | null
  cue?: string | null
  defaultReminderTime?: string | null
  state: 'active' | 'paused' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface Routine {
  id: string
  userId: string
  domainId: string
  title: string
  estimatedDurationMin: number
  state: 'active' | 'paused' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface RoutineItem {
  id: string
  routineId: string
  position: number
  itemType: 'habit_ref' | 'action'
  label: string
  habitId?: string | null
}

export interface RoutineSession {
  id: string
  userId: string
  routineId: string
  launchedAt: string
  date: string
}

export interface RoutineActionLog {
  id: string
  userId: string
  routineSessionId: string
  routineItemId: string
  completedAt: string
}

export interface ScheduledInstance {
  id: string
  userId: string
  sourceType: 'habit'
  sourceId: string
  date: string
  scheduledStart?: string | null
  scheduledEnd?: string | null
  plannedValue?: number | null
  status: InstanceStatus
  movedToInstanceId?: string | null
  createdFromRuleHash: string
  createdAt: string
}

export interface Completion {
  id: string
  userId: string
  scheduledInstanceId: string
  habitId: string
  status: CompletionStatus
  actualValue?: number | null
  actualDurationMin?: number | null
  percentComplete: number
  skipReasonCode?: SkipReasonCode | null
  mood?: number | null
  energy?: number | null
  effort?: number | null
  note?: string | null
  completedAt: string
  createdAt: string
}

export interface EventLog {
  id: string
  userId: string
  eventType: EventType
  subjectType: 'habit' | 'scheduled_instance' | 'completion' | 'user'
  subjectId: string
  scheduledInstanceId?: string | null
  completionId?: string | null
  payload: Record<string, unknown>
  occurredAt: string
  sourceSurface: 'setup' | 'today' | 'review' | 'settings' | 'system'
}

export interface MoodEnergyLog {
  id: string
  userId: string
  date: string
  loggedAt: string
  mood: number
  energy: number
  note?: string | null
}

export interface Notification {
  id: string
  userId: string
  scheduledInstanceId: string
  habitId: string
  title: string
  body: string
  scheduledFor: string
  timezone: string
  status: 'queued' | 'sent' | 'acted' | 'cancelled'
  channel: 'in_app'
  createdAt: string
  updatedAt: string
  sentAt?: string | null
  actedAt?: string | null
  cancelledAt?: string | null
}

export interface DueReminder {
  notification: Notification
  habit: Habit
  instance: ScheduledInstance
}

export interface RoutineFormInput {
  title: string
  domainId: string
  estimatedDurationMin: number
  items: Array<{
    itemType: 'habit_ref' | 'action'
    label: string
    habitId?: string | null
  }>
}

export interface HabitFormInput {
  title: string
  domainId: string
  measurementType: MeasurementType
  targetValue: number
  targetUnit: string
  recurrenceRule: RecurrenceRule
  windowStart?: string | null
  windowEnd?: string | null
  cue?: string | null
  defaultReminderTime?: string | null
}

export interface LogCompletionInput {
  scheduledInstanceId: string
  status: CompletionStatus
  actualValue?: number | null
  actualDurationMin?: number | null
  percentComplete?: number | null
  skipReasonCode?: SkipReasonCode | null
  mood?: number | null
  energy?: number | null
  effort?: number | null
  note?: string | null
}

export interface MoveInstanceInput {
  scheduledInstanceId: string
  newDate: string
  newTime?: string | null
}

export interface TodayItem {
  instance: ScheduledInstance
  habit: Habit
  domain: Domain
  completion?: Completion
}

export interface HabitWeekStat {
  habitId: string
  habitTitle: string
  domainId: string
  planned: number
  done: number
  partial: number
  skipped: number
  weightedCompletion: number
}

export interface RoutineSummary {
  routine: Routine
  items: RoutineItem[]
  launchedToday: boolean
  launchedTodaySessionId?: string | null
  completedActionItemIds: string[]
}

export interface DomainWeekStat {
  domainId: string
  domainName: string
  planned: number
  weightedCompletion: number
  completionRate: number
}

export interface InsightCardData {
  id: string
  type:
    | 'habit_completion_rate'
    | 'domain_completion_rate'
    | 'planned_vs_actual'
    | 'partial_vs_skipped'
    | 'top_skip_reason'
    | 'weekly_consistency'
    | 'domain_balance'
  title: string
  body: string
}

export interface WeeklyReview {
  startDate: string
  endDate: string
  plannedCount: number
  doneCount: number
  partialCount: number
  skippedCount: number
  movedCount: number
  missedCount: number
  completionRate: number
  plannedVsActualRatio: number
  topSkipReasons: Array<{ reason: SkipReasonCode; count: number }>
  domainStats: DomainWeekStat[]
  habitStats: HabitWeekStat[]
  consistencyTrend: number[]
  insights: InsightCardData[]
  averageMood?: number | null
  averageEnergy?: number | null
  moodLogCount: number
}

export interface AppSnapshot {
  user: UserSettings
  domains: Domain[]
  habits: Habit[]
  routines: RoutineSummary[]
  todayItems: TodayItem[]
  weeklyReview: WeeklyReview
  moodToday?: MoodEnergyLog
  dueReminders: DueReminder[]
}
