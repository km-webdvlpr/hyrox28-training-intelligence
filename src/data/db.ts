import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { createDefaultUser, createSystemDomains } from './seed.ts'
import {
  addDaysToDate,
  isoNow,
  sortDateAscending,
  todayDateString,
  zonedLocalDateTimeToUtcIso,
} from '../lib/date.ts'
import {
  buildScheduledInstancesForHabit,
  buildRoutineSummaries,
  buildWeeklyReview,
  computeCompletionFields,
  getTodayMoodLog,
  mapTodayItems,
  markPastInstancesMissed,
} from '../lib/execution.ts'
import type {
  AppSnapshot,
  Completion,
  Domain,
  EventLog,
  Habit,
  HabitFormInput,
  LogCompletionInput,
  MoodEnergyLog,
  Notification,
  MoveInstanceInput,
  Routine,
  RoutineActionLog,
  RoutineFormInput,
  RoutineItem,
  RoutineSession,
  ScheduledInstance,
  UserSettings,
} from '../types/execution.ts'

interface AppDbSchema extends DBSchema {
  users: {
    key: string
    value: UserSettings
  }
  domains: {
    key: string
    value: Domain
    indexes: { 'by-user': string }
  }
  habits: {
    key: string
    value: Habit
    indexes: { 'by-user': string; 'by-state': string }
  }
  routines: {
    key: string
    value: Routine
    indexes: { 'by-user': string; 'by-state': string }
  }
  routine_items: {
    key: string
    value: RoutineItem
    indexes: { 'by-routine': string }
  }
  routine_sessions: {
    key: string
    value: RoutineSession
    indexes: { 'by-date': string; 'by-routine': string }
  }
  routine_action_logs: {
    key: string
    value: RoutineActionLog
    indexes: { 'by-session': string }
  }
  scheduled_instances: {
    key: string
    value: ScheduledInstance
    indexes: { 'by-date': string; 'by-source-id': string }
  }
  completions: {
    key: string
    value: Completion
    indexes: { 'by-instance': string; 'by-completed-at': string }
  }
  event_logs: {
    key: string
    value: EventLog
    indexes: { 'by-occurred-at': string }
  }
  mood_energy_logs: {
    key: string
    value: MoodEnergyLog
    indexes: { 'by-date': string }
  }
  notifications: {
    key: string
    value: Notification
    indexes: { 'by-instance': string; 'by-status': string; 'by-scheduled-for': string }
  }
}

const DB_NAME = 'cadence-execution-intelligence'
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase<AppDbSchema>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<AppDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('domains')) {
          const store = db.createObjectStore('domains', { keyPath: 'id' })
          store.createIndex('by-user', 'userId')
        }
        if (!db.objectStoreNames.contains('habits')) {
          const store = db.createObjectStore('habits', { keyPath: 'id' })
          store.createIndex('by-user', 'userId')
          store.createIndex('by-state', 'state')
        }
        if (!db.objectStoreNames.contains('routines')) {
          const store = db.createObjectStore('routines', { keyPath: 'id' })
          store.createIndex('by-user', 'userId')
          store.createIndex('by-state', 'state')
        }
        if (!db.objectStoreNames.contains('routine_items')) {
          const store = db.createObjectStore('routine_items', { keyPath: 'id' })
          store.createIndex('by-routine', 'routineId')
        }
        if (!db.objectStoreNames.contains('routine_sessions')) {
          const store = db.createObjectStore('routine_sessions', { keyPath: 'id' })
          store.createIndex('by-date', 'date')
          store.createIndex('by-routine', 'routineId')
        }
        if (!db.objectStoreNames.contains('routine_action_logs')) {
          const store = db.createObjectStore('routine_action_logs', { keyPath: 'id' })
          store.createIndex('by-session', 'routineSessionId')
        }
        if (!db.objectStoreNames.contains('scheduled_instances')) {
          const store = db.createObjectStore('scheduled_instances', { keyPath: 'id' })
          store.createIndex('by-date', 'date')
          store.createIndex('by-source-id', 'sourceId')
        }
        if (!db.objectStoreNames.contains('completions')) {
          const store = db.createObjectStore('completions', { keyPath: 'id' })
          store.createIndex('by-instance', 'scheduledInstanceId')
          store.createIndex('by-completed-at', 'completedAt')
        }
        if (!db.objectStoreNames.contains('event_logs')) {
          const store = db.createObjectStore('event_logs', { keyPath: 'id' })
          store.createIndex('by-occurred-at', 'occurredAt')
        }
        if (!db.objectStoreNames.contains('mood_energy_logs')) {
          const store = db.createObjectStore('mood_energy_logs', { keyPath: 'id' })
          store.createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains('notifications')) {
          const store = db.createObjectStore('notifications', { keyPath: 'id' })
          store.createIndex('by-instance', 'scheduledInstanceId')
          store.createIndex('by-status', 'status')
          store.createIndex('by-scheduled-for', 'scheduledFor')
        }
      },
    })
  }

  return dbPromise
}

async function ensureBootstrapData() {
  const db = await getDb()
  const users = await db.getAll('users')
  if (users.length > 0) return users[0]

  const user = createDefaultUser()
  const domains = createSystemDomains(user.id)
  const tx = db.transaction(['users', 'domains'], 'readwrite')
  await tx.objectStore('users').put(user)
  await Promise.all(domains.map((domain) => tx.objectStore('domains').put(domain)))
  await tx.done
  return user
}

async function materializeUpcomingInstances() {
  const db = await getDb()
  const [habits, existingInstances] = await Promise.all([
    db.getAll('habits'),
    db.getAll('scheduled_instances'),
  ])

  const activeHabits = habits.filter((habit) => habit.state === 'active')
  const startDate = todayDateString()
  const endDate = addDaysToDate(startDate, 14)
  const nextInstances = activeHabits.flatMap((habit) =>
    buildScheduledInstancesForHabit(habit, startDate, endDate, existingInstances),
  )

  if (!nextInstances.length) return

  const tx = db.transaction(['scheduled_instances', 'event_logs'], 'readwrite')
  for (const instance of nextInstances) {
    await tx.objectStore('scheduled_instances').put(instance)
    await tx.objectStore('event_logs').put({
      id: crypto.randomUUID(),
      userId: instance.userId,
      eventType: 'instance_generated',
      subjectType: 'scheduled_instance',
      subjectId: instance.id,
      scheduledInstanceId: instance.id,
      completionId: null,
      payload: { date: instance.date, sourceId: instance.sourceId },
      occurredAt: isoNow(),
      sourceSurface: 'system',
    })
  }
  await tx.done
}

async function markHistoricalMisses() {
  const db = await getDb()
  const instances = await db.getAll('scheduled_instances')
  const { changed, nextInstances } = markPastInstancesMissed(instances)
  if (!changed) return

  const tx = db.transaction(['scheduled_instances', 'event_logs'], 'readwrite')
  const previousMap = new Map(instances.map((instance) => [instance.id, instance]))
  for (const instance of nextInstances) {
    await tx.objectStore('scheduled_instances').put(instance)
    const previous = previousMap.get(instance.id)
    if (previous?.status !== 'missed' && instance.status === 'missed') {
      await tx.objectStore('event_logs').put({
        id: crypto.randomUUID(),
        userId: instance.userId,
        eventType: 'instance_marked_missed',
        subjectType: 'scheduled_instance',
        subjectId: instance.id,
        scheduledInstanceId: instance.id,
        completionId: null,
        payload: { date: instance.date },
        occurredAt: isoNow(),
        sourceSurface: 'system',
      })
    }
  }
  await tx.done
}

async function pruneFuturePlannedInstancesForHabit(habitId: string) {
  const db = await getDb()
  const instances = await db.getAllFromIndex('scheduled_instances', 'by-source-id', habitId)
  // MVP trade-off: remove future planned rows outright on pause/archive so schedule state stays simple
  // and rematerialization stays deterministic. This reduces historical fidelity for "cancelled future plan"
  // analysis, which should be revisited once review history needs richer lifecycle states.
  const deletable = instances.filter(
    (instance) =>
      instance.status === 'planned' && sortDateAscending(instance.date, todayDateString()) >= 0,
  )

  if (!deletable.length) return 0

  const tx = db.transaction('scheduled_instances', 'readwrite')
  await Promise.all(deletable.map((instance) => tx.store.delete(instance.id)))
  await tx.done
  return deletable.length
}

function getReminderTimeForHabit(user: UserSettings, habit: Habit) {
  if (!user.defaultReminderEnabled) return null
  return habit.defaultReminderTime ?? null
}

function buildNotificationCopy(habit: Habit, instance: ScheduledInstance) {
  const windowLabel =
    instance.scheduledStart && instance.scheduledEnd
      ? `${instance.scheduledStart} - ${instance.scheduledEnd}`
      : instance.scheduledStart ?? habit.windowStart ?? 'today'

  return {
    title: habit.title,
    body: `Planned for ${windowLabel}`,
  }
}

async function syncNotificationsQueue() {
  const db = await getDb()
  const [user, habits, instances, existingNotifications] = await Promise.all([
    ensureBootstrapData(),
    db.getAll('habits'),
    db.getAll('scheduled_instances'),
    db.getAll('notifications'),
  ])

  const activeHabits = new Map(
    habits.filter((habit) => habit.state === 'active').map((habit) => [habit.id, habit]),
  )
  const now = isoNow()
  const existingById = new Map(existingNotifications.map((notification) => [notification.id, notification]))
  const notificationsByInstance = new Map(
    existingNotifications.map((notification) => [notification.scheduledInstanceId, notification]),
  )
  const eligibleInstanceIds = new Set<string>()
  const pendingWrites: Notification[] = []

  for (const instance of instances) {
    if (instance.status !== 'planned') continue
    const habit = activeHabits.get(instance.sourceId)
    if (!habit) continue
    const reminderTime = getReminderTimeForHabit(user, habit)
    if (!reminderTime) continue

    eligibleInstanceIds.add(instance.id)
    const existing = notificationsByInstance.get(instance.id)
    const scheduledFor = zonedLocalDateTimeToUtcIso(instance.date, reminderTime, user.timezone)
    const copy = buildNotificationCopy(habit, instance)

    if (existing) {
      const preservedStatus = existing.status === 'acted' ? 'acted' : existing.status
      const nextNotification: Notification = {
        ...existing,
        habitId: habit.id,
        title: copy.title,
        body: copy.body,
        scheduledFor,
        timezone: user.timezone,
        status: preservedStatus,
        updatedAt:
          existing.scheduledFor !== scheduledFor ||
          existing.title !== copy.title ||
          existing.body !== copy.body ||
          existing.timezone !== user.timezone
            ? now
            : existing.updatedAt,
      }
      if (
        existing.scheduledFor !== nextNotification.scheduledFor ||
        existing.title !== nextNotification.title ||
        existing.body !== nextNotification.body ||
        existing.timezone !== nextNotification.timezone ||
        existing.status !== nextNotification.status
      ) {
        pendingWrites.push(nextNotification)
      }
      continue
    }

    const notificationId = crypto.randomUUID()
    pendingWrites.push({
      id: notificationId,
      userId: user.id,
      scheduledInstanceId: instance.id,
      habitId: habit.id,
      title: copy.title,
      body: copy.body,
      scheduledFor,
      timezone: user.timezone,
      status: 'queued',
      channel: 'in_app',
      createdAt: now,
      updatedAt: now,
      sentAt: null,
      actedAt: null,
      cancelledAt: null,
    })
  }

  let changed = false
  for (const notification of existingNotifications) {
    if (eligibleInstanceIds.has(notification.scheduledInstanceId)) continue
    if (
      notification.status === 'acted' ||
      notification.status === 'cancelled'
    ) {
      continue
    }
    pendingWrites.push({
      ...notification,
      status: 'cancelled',
      cancelledAt: notification.cancelledAt ?? now,
      updatedAt: now,
    })
    changed = true
  }

  if (pendingWrites.length) changed = true

  if (!changed) return

  const tx = db.transaction(['notifications', 'event_logs'], 'readwrite')
  for (const notification of pendingWrites) {
    await tx.objectStore('notifications').put(notification)
    const eventType = existingById.has(notification.id) ? 'notification_updated' : 'notification_scheduled'
    await tx.objectStore('event_logs').put({
      id: crypto.randomUUID(),
      userId: notification.userId,
      eventType,
      subjectType: 'scheduled_instance',
      subjectId: notification.scheduledInstanceId,
      scheduledInstanceId: notification.scheduledInstanceId,
      completionId: null,
      payload: {
        status: notification.status,
        scheduledFor: notification.scheduledFor,
        timezone: notification.timezone,
      },
      occurredAt: now,
      sourceSurface: 'system',
    })
  }
  await tx.done
}

async function markNotificationStatusForInstance(
  scheduledInstanceId: string,
  status: Notification['status'],
) {
  const db = await getDb()
  const notifications = await db.getAllFromIndex('notifications', 'by-instance', scheduledInstanceId)
  if (!notifications.length) return

  const timestamp = isoNow()
  const tx = db.transaction(['notifications', 'event_logs'], 'readwrite')
  for (const notification of notifications) {
    if (notification.status === status) continue
    await tx.objectStore('notifications').put({
      ...notification,
      status,
      updatedAt: timestamp,
      sentAt: status === 'sent' ? timestamp : notification.sentAt ?? null,
      actedAt: status === 'acted' ? timestamp : notification.actedAt ?? null,
      cancelledAt: status === 'cancelled' ? timestamp : notification.cancelledAt ?? null,
    })
    await tx.objectStore('event_logs').put({
      id: crypto.randomUUID(),
      userId: notification.userId,
      eventType: status === 'sent' ? 'notification_sent' : 'notification_updated',
      subjectType: 'scheduled_instance',
      subjectId: scheduledInstanceId,
      scheduledInstanceId,
      completionId: null,
      payload: { status },
      occurredAt: timestamp,
      sourceSurface: 'system',
    })
  }
  await tx.done
}

export async function loadAppSnapshot(): Promise<AppSnapshot> {
  const user = await ensureBootstrapData()
  await materializeUpcomingInstances()
  await markHistoricalMisses()
  await syncNotificationsQueue()

  const db = await getDb()
  const [
    domains,
    habits,
    routines,
    routineItems,
    routineSessions,
    routineActionLogs,
    instances,
    completions,
    moodLogs,
    notifications,
  ] = await Promise.all([
    db.getAll('domains'),
    db.getAll('habits'),
    db.getAll('routines'),
    db.getAll('routine_items'),
    db.getAll('routine_sessions'),
    db.getAll('routine_action_logs'),
    db.getAll('scheduled_instances'),
    db.getAll('completions'),
    db.getAll('mood_energy_logs'),
    db.getAll('notifications'),
  ])

  const activeDomains = domains.filter((domain) => !domain.isArchived)
  const activeHabits = habits.filter((habit) => habit.state !== 'archived')
  const activeTodayItems = mapTodayItems(instances, activeHabits, activeDomains, completions)
  const instanceMap = new Map(instances.map((instance) => [instance.id, instance]))
  const habitMap = new Map(activeHabits.map((habit) => [habit.id, habit]))
  const dueReminders = notifications
    .filter((notification) => {
      if (notification.status !== 'queued' && notification.status !== 'sent') return false
      return notification.scheduledFor <= isoNow()
    })
    .map((notification) => {
      const instance = instanceMap.get(notification.scheduledInstanceId)
      const habit = habitMap.get(notification.habitId)
      if (!instance || !habit || instance.status !== 'planned') return null
      return {
        notification,
        habit,
        instance,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

  return {
    user,
    domains: activeDomains,
    habits: activeHabits,
    routines: buildRoutineSummaries(routines, routineItems, routineSessions, routineActionLogs),
    todayItems: activeTodayItems,
    weeklyReview: buildWeeklyReview(
      new Date(),
      activeHabits,
      activeDomains,
      instances,
      completions,
      moodLogs,
    ),
    moodToday: getTodayMoodLog(moodLogs),
    dueReminders,
  }
}

export async function completeOnboarding({
  loggingMode,
}: {
  loggingMode: UserSettings['loggingMode']
}) {
  const db = await getDb()
  const user = await ensureBootstrapData()
  const nextUser = {
    ...user,
    loggingMode,
    onboardingCompleted: true,
    updatedAt: isoNow(),
  }

  const tx = db.transaction(['users', 'event_logs'], 'readwrite')
  await tx.objectStore('users').put(nextUser)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: user.id,
    eventType: 'onboarding_completed',
    subjectType: 'user',
    subjectId: user.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: { loggingMode },
    occurredAt: isoNow(),
    sourceSurface: 'setup',
  })
  await tx.done
}

export async function createHabit(input: HabitFormInput) {
  const db = await getDb()
  const user = await ensureBootstrapData()
  const timestamp = isoNow()
  const habit: Habit = {
    id: crypto.randomUUID(),
    userId: user.id,
    domainId: input.domainId,
    goalId: null,
    title: input.title,
    measurementType: input.measurementType,
    targetValue: input.targetValue,
    targetUnit: input.targetUnit,
    recurrenceRule: input.recurrenceRule,
    windowStart: input.windowStart ?? null,
    windowEnd: input.windowEnd ?? null,
    cue: input.cue ?? null,
    defaultReminderTime: input.defaultReminderTime ?? null,
    state: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const tx = db.transaction(['habits', 'event_logs'], 'readwrite')
  await tx.objectStore('habits').put(habit)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: user.id,
    eventType: 'habit_created',
    subjectType: 'habit',
    subjectId: habit.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: { title: habit.title, measurementType: habit.measurementType },
    occurredAt: timestamp,
    sourceSurface: 'setup',
  })
  await tx.done
  await materializeUpcomingInstances()
  await syncNotificationsQueue()
}

export async function createRoutine(input: RoutineFormInput) {
  const db = await getDb()
  const user = await ensureBootstrapData()
  const timestamp = isoNow()
  const routine: Routine = {
    id: crypto.randomUUID(),
    userId: user.id,
    domainId: input.domainId,
    title: input.title,
    estimatedDurationMin: input.estimatedDurationMin,
    state: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const items: RoutineItem[] = input.items.map((item, index) => ({
    id: crypto.randomUUID(),
    routineId: routine.id,
    position: index,
    itemType: item.itemType,
    label: item.label,
    habitId: item.habitId ?? null,
  }))

  const tx = db.transaction(['routines', 'routine_items', 'event_logs'], 'readwrite')
  await tx.objectStore('routines').put(routine)
  await Promise.all(items.map((item) => tx.objectStore('routine_items').put(item)))
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: user.id,
    eventType: 'routine_created',
    subjectType: 'user',
    subjectId: routine.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: { title: routine.title, itemCount: items.length },
    occurredAt: timestamp,
    sourceSurface: 'setup',
  })
  await tx.done
}

export async function createCustomDomain(input: { name: string; color: string }) {
  const db = await getDb()
  const user = await ensureBootstrapData()
  const timestamp = isoNow()
  const domain: Domain = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: input.name.trim(),
    kind: 'custom',
    color: input.color,
    isArchived: false,
    createdAt: timestamp,
  }

  const tx = db.transaction(['domains', 'event_logs'], 'readwrite')
  await tx.objectStore('domains').put(domain)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: user.id,
    eventType: 'domain_created',
    subjectType: 'user',
    subjectId: domain.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: { name: domain.name },
    occurredAt: timestamp,
    sourceSurface: 'settings',
  })
  await tx.done
}

export async function toggleDomainArchive(domainId: string, isArchived: boolean) {
  const db = await getDb()
  const [domain, habits, routines] = await Promise.all([
    db.get('domains', domainId),
    db.getAll('habits'),
    db.getAll('routines'),
  ])

  if (!domain) throw new Error('Domain not found.')
  if (domain.kind === 'system' && isArchived) {
    throw new Error('System domains cannot be archived.')
  }

  const hasActiveUsage =
    habits.some((habit) => habit.domainId === domainId && habit.state !== 'archived') ||
    routines.some((routine) => routine.domainId === domainId && routine.state !== 'archived')
  if (isArchived && hasActiveUsage) {
    throw new Error('Archive or move the habits and routines in this domain first.')
  }

  const nextDomain: Domain = {
    ...domain,
    isArchived,
  }

  const tx = db.transaction(['domains', 'event_logs'], 'readwrite')
  await tx.objectStore('domains').put(nextDomain)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: domain.userId,
    eventType: 'domain_updated',
    subjectType: 'user',
    subjectId: domain.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: { isArchived },
    occurredAt: isoNow(),
    sourceSurface: 'settings',
  })
  await tx.done
}

export async function updateUserSettings(
  input: Partial<Pick<UserSettings, 'timezone' | 'loggingMode' | 'defaultReminderEnabled'>>,
) {
  const db = await getDb()
  const user = await ensureBootstrapData()
  const nextUser: UserSettings = {
    ...user,
    ...input,
    updatedAt: isoNow(),
  }

  const tx = db.transaction(['users', 'event_logs'], 'readwrite')
  await tx.objectStore('users').put(nextUser)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: user.id,
    eventType: 'settings_updated',
    subjectType: 'user',
    subjectId: user.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: input,
    occurredAt: isoNow(),
    sourceSurface: 'settings',
  })
  await tx.done
  if (input.timezone || input.defaultReminderEnabled !== undefined) {
    await syncNotificationsQueue()
  }
}

export async function toggleHabitState(habitId: string, nextState: Habit['state']) {
  const db = await getDb()
  const habit = await db.get('habits', habitId)
  if (!habit) throw new Error('Habit not found.')

  const updatedHabit = {
    ...habit,
    state: nextState,
    updatedAt: isoNow(),
  }

  const tx = db.transaction(['habits', 'event_logs'], 'readwrite')
  await tx.objectStore('habits').put(updatedHabit)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: habit.userId,
    eventType: 'habit_updated',
    subjectType: 'habit',
    subjectId: habit.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: { state: nextState },
    occurredAt: isoNow(),
    sourceSurface: 'settings',
  })
  await tx.done

  let prunedCount = 0
  if (nextState === 'paused' || nextState === 'archived') {
    prunedCount = await pruneFuturePlannedInstancesForHabit(habitId)
  }

  if (nextState === 'active') {
    await materializeUpcomingInstances()
  }
  await syncNotificationsQueue()

  if (prunedCount > 0) {
    const followUpTx = db.transaction('event_logs', 'readwrite')
    await followUpTx.store.put({
      id: crypto.randomUUID(),
      userId: habit.userId,
      eventType: 'habit_updated',
      subjectType: 'habit',
      subjectId: habit.id,
      scheduledInstanceId: null,
      completionId: null,
      payload: { state: nextState, prunedFuturePlannedInstances: prunedCount },
      occurredAt: isoNow(),
      sourceSurface: 'settings',
    })
    await followUpTx.done
  }
}

export async function toggleRoutineState(routineId: string, nextState: Routine['state']) {
  const db = await getDb()
  const routine = await db.get('routines', routineId)
  if (!routine) throw new Error('Routine not found.')

  const updatedRoutine: Routine = {
    ...routine,
    state: nextState,
    updatedAt: isoNow(),
  }

  const tx = db.transaction(['routines', 'event_logs'], 'readwrite')
  await tx.objectStore('routines').put(updatedRoutine)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: routine.userId,
    eventType: 'routine_updated',
    subjectType: 'user',
    subjectId: routine.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: { state: nextState },
    occurredAt: isoNow(),
    sourceSurface: 'settings',
  })
  await tx.done
}

export async function launchRoutine(routineId: string) {
  const db = await getDb()
  const routine = await db.get('routines', routineId)
  if (!routine) throw new Error('Routine not found.')

  const today = todayDateString()
  const existingSessions = await db.getAllFromIndex('routine_sessions', 'by-routine', routineId)
  const existingTodaySession = existingSessions.find((session) => session.date === today)
  if (existingTodaySession) return existingTodaySession

  const session: RoutineSession = {
    id: crypto.randomUUID(),
    userId: routine.userId,
    routineId: routine.id,
    launchedAt: isoNow(),
    date: today,
  }

  const tx = db.transaction(['routine_sessions', 'event_logs'], 'readwrite')
  await tx.objectStore('routine_sessions').put(session)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: routine.userId,
    eventType: 'routine_launched',
    subjectType: 'user',
    subjectId: routine.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: { routineSessionId: session.id, date: today },
    occurredAt: session.launchedAt,
    sourceSurface: 'today',
  })
  await tx.done
  return session
}

export async function completeRoutineActionItem(input: {
  routineSessionId: string
  routineItemId: string
}) {
  const db = await getDb()
  const session = await db.get('routine_sessions', input.routineSessionId)
  const item = await db.get('routine_items', input.routineItemId)
  if (!session || !item) throw new Error('Routine session or item not found.')

  const existingLogs = await db.getAllFromIndex('routine_action_logs', 'by-session', input.routineSessionId)
  const existing = existingLogs.find((entry) => entry.routineItemId === input.routineItemId)
  if (existing) return existing

  const actionLog: RoutineActionLog = {
    id: crypto.randomUUID(),
    userId: session.userId,
    routineSessionId: input.routineSessionId,
    routineItemId: input.routineItemId,
    completedAt: isoNow(),
  }

  const tx = db.transaction(['routine_action_logs', 'event_logs'], 'readwrite')
  await tx.objectStore('routine_action_logs').put(actionLog)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: session.userId,
    eventType: 'routine_action_logged',
    subjectType: 'user',
    subjectId: item.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: { routineSessionId: input.routineSessionId, routineItemId: input.routineItemId },
    occurredAt: actionLog.completedAt,
    sourceSurface: 'today',
  })
  await tx.done
  return actionLog
}

export async function logCompletion(input: LogCompletionInput) {
  const db = await getDb()
  const instance = await db.get('scheduled_instances', input.scheduledInstanceId)
  if (!instance) throw new Error('Scheduled instance not found.')
  if (instance.status !== 'planned') throw new Error('This item has already been resolved.')

  const habit = await db.get('habits', instance.sourceId)
  if (!habit) throw new Error('Habit not found for scheduled instance.')

  const computed = computeCompletionFields(habit, input)
  const timestamp = isoNow()
  const completion: Completion = {
    id: crypto.randomUUID(),
    userId: habit.userId,
    scheduledInstanceId: instance.id,
    habitId: habit.id,
    status: computed.status,
    actualValue: computed.actualValue,
    actualDurationMin: computed.actualDurationMin,
    percentComplete: computed.percentComplete,
    skipReasonCode: input.skipReasonCode ?? null,
    mood: input.mood ?? null,
    energy: input.energy ?? null,
    effort: input.effort ?? null,
    note: input.note ?? null,
    completedAt: timestamp,
    createdAt: timestamp,
  }

  const nextInstance: ScheduledInstance = {
    ...instance,
    status: completion.status,
  }

  const tx = db.transaction(['scheduled_instances', 'completions', 'event_logs'], 'readwrite')
  await tx.objectStore('scheduled_instances').put(nextInstance)
  await tx.objectStore('completions').put(completion)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: habit.userId,
    eventType: 'completion_logged',
    subjectType: 'completion',
    subjectId: completion.id,
    scheduledInstanceId: instance.id,
    completionId: completion.id,
    payload: {
      status: completion.status,
      percentComplete: completion.percentComplete,
      skipReasonCode: completion.skipReasonCode,
    },
    occurredAt: timestamp,
    sourceSurface: 'today',
  })
  await tx.done
  await markNotificationStatusForInstance(instance.id, 'acted')
}

export async function moveScheduledInstance(input: MoveInstanceInput) {
  const db = await getDb()
  const instance = await db.get('scheduled_instances', input.scheduledInstanceId)
  if (!instance) throw new Error('Scheduled instance not found.')
  if (instance.status !== 'planned') throw new Error('Only planned items can be moved.')

  const replacement: ScheduledInstance = {
    ...instance,
    id: crypto.randomUUID(),
    date: input.newDate,
    scheduledStart: input.newTime ?? instance.scheduledStart ?? null,
    status: 'planned',
    movedToInstanceId: null,
    createdAt: isoNow(),
  }

  const movedInstance: ScheduledInstance = {
    ...instance,
    status: 'moved',
    movedToInstanceId: replacement.id,
  }

  const tx = db.transaction(['scheduled_instances', 'event_logs'], 'readwrite')
  await tx.objectStore('scheduled_instances').put(movedInstance)
  await tx.objectStore('scheduled_instances').put(replacement)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: instance.userId,
    eventType: 'instance_moved',
    subjectType: 'scheduled_instance',
    subjectId: instance.id,
    scheduledInstanceId: instance.id,
    completionId: null,
    payload: {
      newDate: replacement.date,
      newTime: replacement.scheduledStart,
      replacementId: replacement.id,
    },
    occurredAt: isoNow(),
    sourceSurface: 'today',
  })
  await tx.done
  await markNotificationStatusForInstance(instance.id, 'cancelled')
  await syncNotificationsQueue()
}

export async function saveMoodEnergyLog(input: { mood: number; energy: number; note?: string }) {
  const db = await getDb()
  const user = await ensureBootstrapData()
  const today = todayDateString()
  const existingLogs = await db.getAllFromIndex('mood_energy_logs', 'by-date', today)
  const existing = existingLogs.find((entry) => entry.userId === user.id)
  const log: MoodEnergyLog = {
    id: existing?.id ?? crypto.randomUUID(),
    userId: user.id,
    date: today,
    loggedAt: isoNow(),
    mood: input.mood,
    energy: input.energy,
    note: input.note ?? null,
  }

  const tx = db.transaction(['mood_energy_logs', 'event_logs'], 'readwrite')
  await tx.objectStore('mood_energy_logs').put(log)
  await tx.objectStore('event_logs').put({
    id: crypto.randomUUID(),
    userId: user.id,
    eventType: 'mood_logged',
    subjectType: 'user',
    subjectId: user.id,
    scheduledInstanceId: null,
    completionId: null,
    payload: { mood: input.mood, energy: input.energy, date: today },
    occurredAt: isoNow(),
    sourceSurface: 'today',
  })
  await tx.done
}

export async function markDueNotificationsSent(notificationIds: string[]) {
  if (!notificationIds.length) return
  const db = await getDb()
  const timestamp = isoNow()
  const tx = db.transaction(['notifications', 'event_logs'], 'readwrite')

  for (const notificationId of notificationIds) {
    const notification = await tx.objectStore('notifications').get(notificationId)
    if (!notification || notification.status !== 'queued') continue

    await tx.objectStore('notifications').put({
      ...notification,
      status: 'sent',
      sentAt: timestamp,
      updatedAt: timestamp,
    })
    await tx.objectStore('event_logs').put({
      id: crypto.randomUUID(),
      userId: notification.userId,
      eventType: 'notification_sent',
      subjectType: 'scheduled_instance',
      subjectId: notification.scheduledInstanceId,
      scheduledInstanceId: notification.scheduledInstanceId,
      completionId: null,
      payload: { notificationId },
      occurredAt: timestamp,
      sourceSurface: 'system',
    })
  }

  await tx.done
}
