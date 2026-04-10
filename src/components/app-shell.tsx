import { CalendarDays, CheckSquare2, Cog, Layers3, LineChart } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppData } from '../hooks/use-app-data.ts'
import { cn } from '../lib/cn.ts'

const navigation = [
  { to: '/today', label: 'Today', icon: CheckSquare2 },
  { to: '/habits', label: 'Habits', icon: CalendarDays },
  { to: '/routines', label: 'Routines', icon: Layers3 },
  { to: '/review', label: 'Review', icon: LineChart },
  { to: '/settings', label: 'Settings', icon: Cog },
]

export function AppShell() {
  const { weeklyReview, habits, todayItems } = useAppData()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(29,78,216,0.08),_transparent_26%),linear-gradient(180deg,#f7f8fb_0%,#eef1f7_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="eyebrow">Execution intelligence</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Cadence
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Planned vs actual, kept honest.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:flex">
              <div className="status-chip">
                <span className="status-chip__label">Active habits</span>
                <span className="status-chip__value">
                  {habits.filter((habit) => habit.state === 'active').length}
                </span>
              </div>
              <div className="status-chip">
                <span className="status-chip__label">Today planned</span>
                <span className="status-chip__value">{todayItems.length}</span>
              </div>
              <div className="status-chip">
                <span className="status-chip__label">Week complete</span>
                <span className="status-chip__value">
                  {Math.round(weeklyReview.completionRate * 100)}%
                </span>
              </div>
            </div>
          </div>

          <nav className="mt-4 grid grid-cols-2 gap-2 sm:flex" aria-label="Primary">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                      isActive
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
