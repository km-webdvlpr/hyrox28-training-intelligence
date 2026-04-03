import { format, parseISO } from 'date-fns'

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

export function formatDuration(minutes: number) {
  if (minutes <= 0) return '0 min'
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (!hours) return `${remainder} min`
  if (!remainder) return `${hours}h`
  return `${hours}h ${remainder}m`
}

export function formatDistance(distanceM: number) {
  if (distanceM >= 1000) return `${(distanceM / 1000).toFixed(distanceM % 1000 === 0 ? 0 : 1)} km`
  return `${distanceM} m`
}

export function formatRpe(value: number | null) {
  if (value === null) return 'N/A'
  return `${value.toFixed(1)} / 10`
}

export function formatWorkoutDate(date: string, pattern = 'EEE, dd MMM') {
  return format(parseISO(date), pattern)
}

export function formatCompactDate(date: string) {
  return format(parseISO(date), 'dd MMM')
}

export function formatLongDate(date: string) {
  return format(parseISO(date), 'EEEE, dd MMM yyyy')
}

export function pluralize(value: number, word: string) {
  return `${value} ${word}${value === 1 ? '' : 's'}`
}
