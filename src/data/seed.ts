import { isoNow } from '../lib/date.ts'
import type { Domain, UserSettings } from '../types/execution.ts'

export const SYSTEM_DOMAINS = [
  { name: 'Health', color: '#2d6a4f' },
  { name: 'Work', color: '#1d3557' },
  { name: 'Study', color: '#6d597a' },
  { name: 'Recovery', color: '#6c757d' },
  { name: 'Admin', color: '#9c6644' },
] as const

export function createDefaultUser(): UserSettings {
  const now = isoNow()
  return {
    id: 'user_local',
    email: 'local@cadence.app',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    loggingMode: 'lite',
    defaultReminderEnabled: true,
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function createSystemDomains(userId: string): Domain[] {
  const now = isoNow()
  return SYSTEM_DOMAINS.map((domain) => ({
    id: crypto.randomUUID(),
    userId,
    name: domain.name,
    kind: 'system' as const,
    color: domain.color,
    isArchived: false,
    createdAt: now,
  }))
}
