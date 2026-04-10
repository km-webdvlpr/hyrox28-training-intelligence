import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/app-shell.tsx'
import { useAppData } from './hooks/use-app-data.ts'
import { HabitsPage } from './pages/habits-page.tsx'
import { ReviewPage } from './pages/review-page.tsx'
import { RoutinesPage } from './pages/routines-page.tsx'
import { SettingsPage } from './pages/settings-page.tsx'
import { SetupPage } from './pages/setup-page.tsx'
import { TodayPage } from './pages/today-page.tsx'

function RootRedirect() {
  const { user } = useAppData()
  return <Navigate to={user.onboardingCompleted ? '/today' : '/setup'} replace />
}

function App() {
  const { isLoading, error } = useAppData()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="panel max-w-md text-center">
          <div className="eyebrow">Loading</div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Preparing your execution system</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="panel max-w-md text-center">
          <div className="eyebrow">Something went wrong</div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Unable to load local data</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route index element={<RootRedirect />} />
      <Route path="setup" element={<SetupPage />} />
      <Route element={<AppShell />}>
        <Route path="today" element={<TodayPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="routines" element={<RoutinesPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
