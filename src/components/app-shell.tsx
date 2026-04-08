import { Database, Flame, Gauge, PlusSquare } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useWorkoutData } from '../hooks/use-workout-data.ts'
import { formatDuration, pluralize } from '../lib/formatters.ts'
import { cn } from '../lib/cn.ts'

const navigation = [
  { to: '/', label: 'Dashboard' },
  { to: '/log', label: 'Log Workout' },
  { to: '/history', label: 'History' },
  { to: '/analytics', label: 'Analytics' },
]

export function AppShell() {
  const { workouts, analytics } = useWorkoutData()
  const latestWorkout = workouts[0]

  return (
    <div className="min-h-screen bg-shell text-ink">
      <div className="app-grid-bg pointer-events-none fixed inset-0 -z-10 opacity-60" />

      <header className="relative z-40 border-b border-line/80 bg-shell/95 md:sticky md:top-0 md:backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="section-kicker">Hyrox28 // Training Intelligence</div>
              <div className="flex flex-wrap items-end gap-3">
                <h1 className="font-display text-4xl uppercase tracking-tight text-carbon sm:text-5xl lg:text-6xl">
                  Race Ops Board
                </h1>
                <span className="rounded-full border border-carbon bg-accent px-3 py-1 font-mono text-[11px] uppercase tracking-[0.28em] text-carbon">
                  Local First
                </span>
              </div>
              <p className="page-lead max-w-xl">
                Personal Hyrox tracking with bright race-day energy, clean signal, and no
                bloated SaaS styling.
              </p>
            </div>

            <nav className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap" aria-label="Primary">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn('nav-link justify-center text-center', isActive && 'nav-link-active')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="status-chip">
              <Database className="h-4 w-4" />
              <div>
                <div className="status-chip__label">Data mode</div>
                <div className="status-chip__value">IndexedDB session vault</div>
              </div>
            </div>

            <div className="status-chip">
              <PlusSquare className="h-4 w-4" />
              <div>
                <div className="status-chip__label">Latest block</div>
                <div className="status-chip__value">
                  {latestWorkout?.program_block ?? 'Seed data loading'}
                </div>
              </div>
            </div>

            <div className="status-chip">
              <Flame className="h-4 w-4" />
              <div>
                <div className="status-chip__label">Current streak</div>
                <div className="status-chip__value">
                  {pluralize(analytics.currentStreak, 'session')}
                </div>
              </div>
            </div>

            <div className="status-chip">
              <Gauge className="h-4 w-4" />
              <div>
                <div className="status-chip__label">This week</div>
                <div className="status-chip__value">{formatDuration(analytics.weeklyVolume)}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-carbon bg-carbon text-shell">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-shell/80 md:flex-row md:items-center md:justify-between md:px-6">
          <span>Signal clean // dashboard live // single-user mode</span>
          <span>Built for GitHub Pages // browser data persists locally</span>
        </div>
      </footer>
    </div>
  )
}
