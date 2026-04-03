import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/app-shell.tsx'
import { AnalyticsPage } from './pages/analytics-page.tsx'
import { DashboardPage } from './pages/dashboard-page.tsx'
import { HistoryPage } from './pages/history-page.tsx'
import { LogWorkoutPage } from './pages/log-workout-page.tsx'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="log" element={<LogWorkoutPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
