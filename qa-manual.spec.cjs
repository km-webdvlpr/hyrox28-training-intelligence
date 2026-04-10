const { test, expect } = require('playwright/test')

const baseUrl = 'http://127.0.0.1:4173'
const dbName = 'cadence-execution-intelligence'

async function getDbSnapshot(page) {
  return await page.evaluate(async (name) => {
    function reqToPromise(req) {
      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
    }

    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(name)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    async function getAll(storeName) {
      const tx = db.transaction(storeName, 'readonly')
      return await reqToPromise(tx.objectStore(storeName).getAll())
    }

    const [
      users,
      domains,
      habits,
      routines,
      routineItems,
      routineSessions,
      routineActionLogs,
      scheduledInstances,
      completions,
      eventLogs,
      moodEnergyLogs,
      notifications,
    ] = await Promise.all([
      getAll('users'),
      getAll('domains'),
      getAll('habits'),
      getAll('routines'),
      getAll('routine_items'),
      getAll('routine_sessions'),
      getAll('routine_action_logs'),
      getAll('scheduled_instances'),
      getAll('completions'),
      getAll('event_logs'),
      getAll('mood_energy_logs'),
      getAll('notifications'),
    ])

    db.close()
    return {
      users,
      domains,
      habits,
      routines,
      routineItems,
      routineSessions,
      routineActionLogs,
      scheduledInstances,
      completions,
      eventLogs,
      moodEnergyLogs,
      notifications,
    }
  }, dbName)
}

async function clearDb(page) {
  await page.evaluate(async (name) => {
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(name)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })
    localStorage.clear()
    sessionStorage.clear()
  }, dbName)
}

async function fillHabitForm(page, { title, measurement = 'Binary', targetValue, targetUnit }) {
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Measurement').selectOption({ label: measurement })
  if (measurement !== 'Binary') {
    await page.waitForTimeout(150)
    await page.getByLabel('Target value').fill(String(targetValue))
    await page.waitForTimeout(100)
    await page.getByLabel('Unit').fill(targetUnit)
  }
  await page.getByRole('button', { name: /Add (starter )?habit|Add habit/i }).click()
  await page.waitForTimeout(200)
}

async function fillRoutineForm(page) {
  await page.getByLabel('Title').fill('Evening Reset')
  await page.getByLabel('Estimated duration').fill('15')
  await page.getByRole('button', { name: 'Add habit item' }).click()
  await page.getByRole('button', { name: 'Add action item' }).click()
  await page.getByLabel('Linked habit 1').selectOption({ label: 'Daily Focus' })
  await page.getByLabel('Action label 2').fill('Lay out tomorrow desk')
  await page.getByRole('button', { name: 'Add routine' }).click()
  await page.waitForTimeout(250)
}

function getWeekBounds(date) {
  const current = new Date(`${date.toISOString().slice(0, 10)}T12:00:00`)
  const day = current.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const start = new Date(current)
  start.setDate(current.getDate() + diffToMonday)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

function computeExpectedReview(snapshot) {
  const now = new Date()
  const { start, end } = getWeekBounds(now)
  const habits = new Map(snapshot.habits.map((habit) => [habit.id, habit]))
  const completions = new Map(
    snapshot.completions.map((completion) => [completion.scheduledInstanceId, completion]),
  )
  const inWeek = snapshot.scheduledInstances.filter(
    (instance) => instance.date >= start && instance.date <= end,
  )
  const reviewable = inWeek.filter((instance) => instance.status !== 'moved')
  const moodLogs = snapshot.moodEnergyLogs.filter((entry) => entry.date >= start && entry.date <= end)

  let done = 0
  let partial = 0
  let skipped = 0
  let moved = 0
  let weighted = 0
  let plannedTotal = 0
  let actualTotal = 0

  for (const instance of inWeek) {
    if (instance.status === 'moved') moved += 1
  }

  for (const instance of reviewable) {
    const habit = habits.get(instance.sourceId)
    const completion = completions.get(instance.id)
    if (!habit) continue

    const plannedValue =
      habit.measurementType === 'binary' ? 1 : instance.plannedValue ?? habit.targetValue
    plannedTotal += plannedValue

    if (completion?.status === 'done') {
      done += 1
      weighted += 1
    } else if (completion?.status === 'partial') {
      partial += 1
      weighted += completion.percentComplete / 100
    } else if (completion?.status === 'skipped') {
      skipped += 1
    }

    if (!completion || completion.status === 'skipped') continue
    if (habit.measurementType === 'binary') {
      actualTotal += completion.status === 'done' ? 1 : completion.percentComplete / 100
    } else if (habit.measurementType === 'duration') {
      actualTotal += completion.actualDurationMin ?? completion.actualValue ?? 0
    } else {
      actualTotal += completion.actualValue ?? 0
    }
  }

  return {
    completionRateLabel: `${Math.round((reviewable.length ? weighted / reviewable.length : 0) * 100)}%`,
    plannedVsActualLabel: `${Math.round((plannedTotal ? actualTotal / plannedTotal : 0) * 100)}%`,
    partialCount: partial,
    skippedCount: skipped,
    averageMoodLabel: moodLogs.length
      ? (moodLogs.reduce((sum, entry) => sum + entry.mood, 0) / moodLogs.length).toFixed(1)
      : null,
    averageEnergyLabel: moodLogs.length
      ? (moodLogs.reduce((sum, entry) => sum + entry.energy, 0) / moodLogs.length).toFixed(1)
      : null,
    moodLogCount: moodLogs.length,
  }
}

async function readPageText(page) {
  return (await page.locator('body').textContent()) || ''
}

function todayHabitCard(page, title) {
  return page
    .locator('article')
    .filter({ hasText: title })
    .filter({ has: page.getByRole('button', { name: 'Partial' }) })
    .first()
}

test('manual qa sweep', async ({ page }) => {
  test.setTimeout(120000)
  const results = []
  const record = (name, passed, details) => results.push({ name, passed, details })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await clearDb(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForURL('**/setup')

  await fillHabitForm(page, { title: 'Daily Focus', measurement: 'Binary' })
  await page.getByRole('button', { name: 'Continue with Lite logging' }).click()
  await page.waitForURL('**/today')
  record('Create habit', (await page.getByText('Daily Focus').count()) > 0, 'Starter habit created and surfaced on Today.')

  let snapshot = await getDbSnapshot(page)
  const focusHabit = snapshot.habits.find((habit) => habit.title === 'Daily Focus')
  const today = new Date().toISOString().slice(0, 10)
  const focusRemindersBeforePause = snapshot.notifications.filter(
    (notification) => notification.habitId === focusHabit.id && notification.status !== 'cancelled',
  )
  record(
    'Reminder scheduling and triggering',
    focusRemindersBeforePause.length > 0 &&
      focusRemindersBeforePause.some((notification) => ['queued', 'sent'].includes(notification.status)),
    JSON.stringify(focusRemindersBeforePause),
  )

  await page.getByRole('link', { name: 'Habits' }).click()
  await page.waitForURL('**/habits')

  const futurePlannedBeforePause = snapshot.scheduledInstances.filter(
    (instance) => instance.sourceId === focusHabit.id && instance.status === 'planned' && instance.date >= today,
  ).length

  let focusCard = page.locator('article').filter({ hasText: 'Daily Focus' }).first()
  await focusCard.getByRole('button', { name: 'Pause' }).click()
  await page.waitForTimeout(250)
  snapshot = await getDbSnapshot(page)
  const futurePlannedAfterPause = snapshot.scheduledInstances.filter(
    (instance) => instance.sourceId === focusHabit.id && instance.status === 'planned' && instance.date >= today,
  ).length
  const activeRemindersAfterPause = snapshot.notifications.filter(
    (notification) => notification.habitId === focusHabit.id && ['queued', 'sent'].includes(notification.status),
  ).length
  record('Pause habit', futurePlannedBeforePause > 0 && futurePlannedAfterPause === 0, `Future planned before pause: ${futurePlannedBeforePause}, after pause: ${futurePlannedAfterPause}`)
  record('Verify future planned instances are pruned on pause', futurePlannedAfterPause === 0, 'Future planned rows removed.')
  record(
    'Pause/resume effect on reminders',
    activeRemindersAfterPause === 0,
    `Active reminders after pause: ${activeRemindersAfterPause}`,
  )

  focusCard = page.locator('article').filter({ hasText: 'Daily Focus' }).first()
  await focusCard.getByRole('button', { name: 'Resume' }).click()
  await page.waitForTimeout(250)
  snapshot = await getDbSnapshot(page)
  const futurePlannedAfterResume = snapshot.scheduledInstances.filter(
    (instance) => instance.sourceId === focusHabit.id && instance.status === 'planned' && instance.date >= today,
  ).length
  const activeRemindersAfterResume = snapshot.notifications.filter(
    (notification) => notification.habitId === focusHabit.id && ['queued', 'sent'].includes(notification.status),
  ).length
  record('Resume habit', futurePlannedAfterResume > 0, `Future planned after resume: ${futurePlannedAfterResume}`)
  record('Verify future planned instances rematerialize correctly on resume', futurePlannedAfterResume >= futurePlannedBeforePause, 'Future planned rows rematerialized.')
  record(
    'Reminder requeue on resume',
    activeRemindersAfterResume > 0,
    `Active reminders after resume: ${activeRemindersAfterResume}`,
  )

  await fillHabitForm(page, { title: 'Read Pages', measurement: 'Count', targetValue: 10, targetUnit: 'pages' })
  await fillHabitForm(page, { title: 'Mobility', measurement: 'Duration', targetValue: 20, targetUnit: 'minutes' })
  await fillHabitForm(page, { title: 'Shutdown', measurement: 'Binary' })

  await page.getByRole('link', { name: 'Routines' }).click()
  await page.waitForURL('**/routines')
  await fillRoutineForm(page)
  snapshot = await getDbSnapshot(page)
  const routine = snapshot.routines.find((entry) => entry.title === 'Evening Reset')
  const routineItems = snapshot.routineItems.filter((item) => item.routineId === routine.id)
  record('Routine creation', Boolean(routine && routineItems.length === 2), JSON.stringify({ routine, routineItems }))

  await page.getByRole('link', { name: 'Today' }).click()
  await page.waitForURL('**/today')

  await page.getByRole('button', { name: 'Save state' }).click()
  await page.waitForTimeout(250)

  await todayHabitCard(page, 'Read Pages').getByRole('button', { name: 'Partial' }).click()
  await page.getByLabel(/Actual pages/i).fill('5')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.waitForTimeout(250)

  await todayHabitCard(page, 'Mobility').getByRole('button', { name: 'Skipped' }).click()
  await page.getByRole('button', { name: 'Time pressure' }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.waitForTimeout(250)

  await todayHabitCard(page, 'Shutdown').getByRole('button', { name: 'Moved' }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.waitForTimeout(250)

  await page.locator('article').filter({ hasText: 'Evening Reset' }).first().getByRole('button', { name: 'Launch routine' }).click()
  await page.locator('.fixed').getByRole('button', { name: 'Launch routine', exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Mark action done' }).click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: 'Mark linked habit done' }).click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: 'Close' }).click()

  snapshot = await getDbSnapshot(page)
  const habitMap = Object.fromEntries(snapshot.habits.map((habit) => [habit.title, habit]))
  const completionsByHabit = Object.fromEntries(snapshot.completions.map((completion) => [completion.habitId, completion]))
  const dailyCompletion = completionsByHabit[habitMap['Daily Focus'].id]
  const readCompletion = completionsByHabit[habitMap['Read Pages'].id]
  const mobilityCompletion = completionsByHabit[habitMap['Mobility'].id]
  const shutdownInstances = snapshot.scheduledInstances.filter((instance) => instance.sourceId === habitMap['Shutdown'].id)
  const movedOriginal = shutdownInstances.find((instance) => instance.status === 'moved')
  const movedReplacement = shutdownInstances.find((instance) => instance.id === (movedOriginal && movedOriginal.movedToInstanceId))
  const movedOriginalReminder = movedOriginal
    ? snapshot.notifications.find((notification) => notification.scheduledInstanceId === movedOriginal.id)
    : null
  const movedReplacementReminder = movedReplacement
    ? snapshot.notifications.find((notification) => notification.scheduledInstanceId === movedReplacement.id)
    : null

  record('Log done', dailyCompletion && dailyCompletion.status === 'done' && dailyCompletion.percentComplete === 100, JSON.stringify(dailyCompletion))
  record('Log partial', readCompletion && readCompletion.status === 'partial' && readCompletion.percentComplete === 50 && readCompletion.actualValue === 5, JSON.stringify(readCompletion))
  record('Log skipped', mobilityCompletion && mobilityCompletion.status === 'skipped' && mobilityCompletion.skipReasonCode === 'time', JSON.stringify(mobilityCompletion))
  record('Move instance', !!(movedOriginal && movedReplacement && movedReplacement.status === 'planned'), JSON.stringify({ movedOriginal, movedReplacement }))
  record(
    'Moved instance reminder updates',
    Boolean(
      movedOriginalReminder &&
        movedReplacementReminder &&
        movedOriginalReminder.status === 'cancelled' &&
        ['queued', 'sent'].includes(movedReplacementReminder.status),
    ),
    JSON.stringify({ movedOriginalReminder, movedReplacementReminder }),
  )

  const routineSession = snapshot.routineSessions.find((entry) => entry.routineId === routine.id && entry.date === today)
  const actionItem = routineItems.find((item) => item.itemType === 'action')
  record('Routine launch', Boolean(routineSession), JSON.stringify(routineSession))
  record('Routine action completion', Boolean(actionItem && snapshot.routineActionLogs.some((log) => log.routineSessionId === routineSession.id && log.routineItemId === actionItem.id)), JSON.stringify(snapshot.routineActionLogs))
  record('Routine + habit interaction', Boolean(dailyCompletion && dailyCompletion.status === 'done' && movedReplacement && movedReplacement.status === 'planned'), JSON.stringify({ dailyCompletion, movedReplacement }))

  const visibleTodayTitles = await page.locator('article h3').allTextContents()
  record('Confirm Today only shows the correct active instance', visibleTodayTitles.includes('Daily Focus') && visibleTodayTitles.includes('Read Pages') && visibleTodayTitles.includes('Mobility') && !visibleTodayTitles.includes('Shutdown'), `Visible Today cards: ${visibleTodayTitles.join(', ')}`)

  const moodLog = snapshot.moodEnergyLogs.find((entry) => entry.date === today)
  record('Mood/energy logging', Boolean(moodLog && moodLog.mood === 3 && moodLog.energy === 3), JSON.stringify(moodLog))
  record(
    'Same-day logging speed and correctness',
    snapshot.completions.length === 3 && snapshot.eventLogs.filter((event) => event.eventType === 'completion_logged').length === 3,
    `Completions: ${snapshot.completions.length}, completion events: ${snapshot.eventLogs.filter((event) => event.eventType === 'completion_logged').length}`,
  )

  await page.getByRole('link', { name: 'Settings' }).click()
  await page.waitForURL('**/settings')
  const futureFocusInstance = snapshot.scheduledInstances
    .filter((instance) => instance.sourceId === focusHabit.id && instance.status === 'planned' && instance.date > today)
    .sort((left, right) => left.date.localeCompare(right.date))[0]
  const futureFocusReminderBefore = futureFocusInstance
    ? snapshot.notifications.find((notification) => notification.scheduledInstanceId === futureFocusInstance.id)
    : null
  await page.getByLabel('Timezone').fill('UTC')
  await page.getByRole('button', { name: 'Apply timezone' }).click()
  await page.waitForTimeout(300)
  snapshot = await getDbSnapshot(page)
  const futureFocusReminderAfterUtc = futureFocusInstance
    ? snapshot.notifications.find((notification) => notification.scheduledInstanceId === futureFocusInstance.id)
    : null
  const timezoneShiftPass =
    snapshot.users[0].timezone === 'UTC' &&
    futureFocusReminderBefore &&
    futureFocusReminderAfterUtc &&
    futureFocusReminderBefore.scheduledFor !== futureFocusReminderAfterUtc.scheduledFor &&
    /T07:15:00/.test(futureFocusReminderAfterUtc.scheduledFor)

  record(
    'Timezone correctness',
    Boolean(timezoneShiftPass),
    JSON.stringify({
      before: futureFocusReminderBefore,
      after: futureFocusReminderAfterUtc,
      timezone: snapshot.users[0].timezone,
    }),
  )

  await page.getByLabel('Timezone').fill('Africa/Johannesburg')
  await page.getByRole('button', { name: 'Apply timezone' }).click()
  await page.waitForTimeout(300)
  snapshot = await getDbSnapshot(page)

  await page.getByRole('link', { name: 'Review' }).click()
  await page.waitForURL('**/review')

  const expectedReview = computeExpectedReview(snapshot)
  const reviewText = await readPageText(page)
  const reviewPass =
    reviewText.includes(expectedReview.completionRateLabel) &&
    reviewText.includes(expectedReview.plannedVsActualLabel) &&
    reviewText.includes(String(expectedReview.partialCount)) &&
    reviewText.includes(String(expectedReview.skippedCount)) &&
    reviewText.includes(expectedReview.averageMoodLabel ?? '') &&
    reviewText.includes(expectedReview.averageEnergyLabel ?? '') &&
    reviewText.includes(String(expectedReview.moodLogCount))

  record(
    'Confirm weekly review reconciles correctly after new flows',
    reviewPass,
    JSON.stringify({
      expectedReview,
      reviewText,
    }),
  )

  console.log('QA_RESULTS_START')
  console.log(JSON.stringify(results, null, 2))
  console.log('QA_RESULTS_END')

  expect(results.every((result) => result.passed)).toBeTruthy()
})
