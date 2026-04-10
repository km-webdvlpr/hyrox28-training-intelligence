import { useMemo, useState } from 'react'
import { PageHeader } from '../components/page-header.tsx'
import { useAppData } from '../hooks/use-app-data.ts'

const fallbackTimezones = ['UTC', 'Africa/Johannesburg', 'Europe/London', 'America/New_York']

export function SettingsPage() {
  const {
    user,
    domains,
    habits,
    routines,
    updateSettings,
    createCustomDomain,
    toggleDomainArchive,
  } = useAppData()
  const [timezoneDraft, setTimezoneDraft] = useState(user.timezone)
  const [domainName, setDomainName] = useState('')
  const [domainColor, setDomainColor] = useState('#4f46e5')

  const timezoneOptions = useMemo(() => {
    if (typeof Intl.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf('timeZone')
    }
    return fallbackTimezones
  }, [])

  const customDomains = domains.filter((domain) => domain.kind === 'custom')
  const usageByDomain = useMemo(() => {
    const counts = new Map<string, number>()
    for (const habit of habits.filter((entry) => entry.state !== 'archived')) {
      counts.set(habit.domainId, (counts.get(habit.domainId) ?? 0) + 1)
    }
    for (const entry of routines.filter((summary) => summary.routine.state !== 'archived')) {
      counts.set(entry.routine.domainId, (counts.get(entry.routine.domainId) ?? 0) + 1)
    }
    return counts
  }, [habits, routines])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Keep the system lean"
        description="Only the settings that affect planning, reminders, and review are included here."
      />

      <section className="panel grid gap-4 lg:grid-cols-2">
        <label className="field">
          <span className="field__label">Timezone</span>
          <input
            className="input"
            list="timezone-options"
            value={timezoneDraft}
            onChange={(event) => setTimezoneDraft(event.target.value)}
          />
          <datalist id="timezone-options">
            {timezoneOptions.map((timezone) => (
              <option key={timezone} value={timezone} />
            ))}
          </datalist>
          <button
            className="secondary-button mt-3"
            disabled={!timezoneDraft.trim() || timezoneDraft === user.timezone}
            onClick={() => void updateSettings({ timezone: timezoneDraft.trim() })}
            type="button"
          >
            Apply timezone
          </button>
        </label>

        <label className="field">
          <span className="field__label">Logging mode</span>
          <div className="grid grid-cols-2 gap-2">
            {(['lite', 'standard'] as const).map((mode) => (
              <button
                key={mode}
                className={user.loggingMode === mode ? 'primary-button' : 'secondary-button'}
                onClick={() => void updateSettings({ loggingMode: mode })}
                type="button"
              >
                {mode === 'lite' ? 'Lite' : 'Standard'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Lite keeps logging one tap first. Standard keeps richer optional detail close by.
          </p>
        </label>

        <div className="field lg:col-span-2">
          <span className="field__label">Default reminders</span>
          <button
            className={user.defaultReminderEnabled ? 'primary-button w-full' : 'secondary-button w-full'}
            onClick={() =>
              void updateSettings({ defaultReminderEnabled: !user.defaultReminderEnabled })
            }
            type="button"
          >
            {user.defaultReminderEnabled ? 'Reminders enabled' : 'Reminders disabled'}
          </button>
          <p className="mt-2 text-sm text-slate-600">
            One queued reminder is maintained per planned instance when the habit has a reminder time.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Custom domains</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Add a new life area</h2>
          </div>
          <label className="field">
            <span className="field__label">Domain name</span>
            <input
              className="input"
              placeholder="Creative work"
              value={domainName}
              onChange={(event) => setDomainName(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Color</span>
            <input
              className="input h-12"
              type="color"
              value={domainColor}
              onChange={(event) => setDomainColor(event.target.value)}
            />
          </label>
          <button
            className="primary-button w-full"
            disabled={!domainName.trim()}
            onClick={async () => {
              await createCustomDomain({ name: domainName.trim(), color: domainColor })
              setDomainName('')
            }}
            type="button"
          >
            Add domain
          </button>
        </div>

        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Domain management</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">What the system is organized around</h2>
          </div>
          <div className="space-y-3">
            {domains.map((domain) => {
              const usageCount = usageByDomain.get(domain.id) ?? 0
              return (
                <article
                  key={domain.id}
                  className="rounded-[22px] border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: domain.color }}
                      />
                      <div>
                        <h3 className="font-semibold text-slate-950">{domain.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {domain.kind} domain • {usageCount} active references
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {domain.kind}
                    </span>
                  </div>

                  {domain.kind === 'custom' ? (
                    <button
                      className="secondary-button mt-4"
                      disabled={usageCount > 0}
                      onClick={() => void toggleDomainArchive(domain.id, true)}
                      type="button"
                    >
                      {usageCount > 0 ? 'Used by active items' : 'Archive domain'}
                    </button>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      System domains stay available so existing behavior history remains legible.
                    </p>
                  )}
                </article>
              )
            })}

            {customDomains.length === 0 ? (
              <p className="text-sm text-slate-600">
                No custom domains yet. Add one only when the current system buckets stop being useful.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
