import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfWeek,
} from 'date-fns'

export function todayDateString() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function isoNow() {
  return new Date().toISOString()
}

export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  }
}

export function listDateRange(startDate: string, endDate: string) {
  return eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map((entry) => format(entry, 'yyyy-MM-dd'))
}

export function addDaysToDate(date: string, amount: number) {
  return format(addDays(parseISO(date), amount), 'yyyy-MM-dd')
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  }
}

export function zonedLocalDateTimeToUtcIso(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const parts = getTimeZoneParts(utcGuess, timeZone)
  const guessAsLocalUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  const desiredLocalUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
  return new Date(utcGuess.getTime() - (guessAsLocalUtc - desiredLocalUtc)).toISOString()
}

export function formatTimeInZone(isoDateTime: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(isoDateTime))
}

export function isPastDate(date: string) {
  return isBefore(parseISO(date), parseISO(todayDateString()))
}

export function sortDateAscending(left: string, right: string) {
  if (left === right) return 0
  return isAfter(parseISO(left), parseISO(right)) ? 1 : -1
}

export function formatDisplayDate(date: string) {
  return format(parseISO(date), 'EEE, d MMM')
}

export function formatWeekLabel(startDate: string, endDate: string) {
  return `${format(parseISO(startDate), 'd MMM')} - ${format(parseISO(endDate), 'd MMM')}`
}

export function isToday(date: string) {
  return isSameDay(parseISO(date), new Date())
}
