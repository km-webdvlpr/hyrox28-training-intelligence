import { endOfWeek, format, parseISO, startOfWeek, subDays } from 'date-fns'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartCard,
  ChartTooltipCard,
  RangePill,
  WeekdayHeatmap,
} from '../components/charts.tsx'
import { InsightCard } from '../components/metric-cards.tsx'
import { PageHeader } from '../components/page-header.tsx'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '../components/states.tsx'
import { useWorkoutData } from '../hooks/use-workout-data.ts'
import { buildAnalyticsBundle, filterWorkoutsByDateRange } from '../lib/analytics.ts'
import { formatDistance, formatDuration, formatPercent, formatRpe } from '../lib/formatters.ts'
import { workoutTypeLabels } from '../lib/workout-options.ts'

type RangeKey = 'week' | 'month' | 'quarter' | 'custom'

const piePalette = ['#12120f', '#f4c400', '#8e8573', '#d8d1c0', '#6b685f', '#b4aa96', '#efe7d8']

export function AnalyticsPage() {
  const { error, isLoading, reload, workouts } = useWorkoutData()
  const [range, setRange] = useState<RangeKey>('quarter')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const activeWindow = useMemo(() => {
    const anchorDate = workouts[0]?.date ? parseISO(workouts[0].date) : new Date()

    if (range === 'custom') {
      return {
        start: customStart || undefined,
        end: customEnd || undefined,
      }
    }

    if (range === 'week') {
      return {
        start: format(startOfWeek(anchorDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(anchorDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      }
    }

    const days = range === 'month' ? 29 : 89
    return {
      start: format(subDays(anchorDate, days), 'yyyy-MM-dd'),
      end: format(anchorDate, 'yyyy-MM-dd'),
    }
  }, [customEnd, customStart, range, workouts])

  const filteredWorkouts = useMemo(
    () => filterWorkoutsByDateRange(workouts, activeWindow.start, activeWindow.end),
    [activeWindow.end, activeWindow.start, workouts],
  )

  const analytics = useMemo(() => buildAnalyticsBundle(filteredWorkouts), [filteredWorkouts])

  if (isLoading) return <LoadingPanel title="Loading deep-dive analytics..." />

  if (error) {
    return (
      <ErrorPanel
        message={error}
        action={
          <button className="nav-link nav-link-active" onClick={() => void reload()} type="button">
            Reload
          </button>
        }
      />
    )
  }

  if (!filteredWorkouts.length) {
    return (
      <EmptyPanel
        title="Nothing in this window"
        description="Pick a wider time range or add more sessions so the trend analysis has something real to read."
      />
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Deep-dive analytics"
        title="Read the block"
        description="Filter the time window, then inspect adherence pressure, load mix, fatigue patterns, and weekday consistency without duplicating the dashboard."
        actions={
          <div className="flex flex-wrap gap-2">
            <RangePill active={range === 'week'} onClick={() => setRange('week')}>
              Week
            </RangePill>
            <RangePill active={range === 'month'} onClick={() => setRange('month')}>
              Month
            </RangePill>
            <RangePill active={range === 'quarter'} onClick={() => setRange('quarter')}>
              Quarter
            </RangePill>
            <RangePill active={range === 'custom'} onClick={() => setRange('custom')}>
              Custom
            </RangePill>
          </div>
        }
      />

      {range === 'custom' ? (
        <section className="panel-card grid gap-4 md:grid-cols-2">
          <label className="field-shell">
            <span className="data-label">Custom start</span>
            <input
              type="date"
              className="input-shell"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
            />
          </label>

          <label className="field-shell">
            <span className="data-label">Custom end</span>
            <input
              type="date"
              className="input-shell"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
            />
          </label>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Adherence"
          value={formatPercent(100 - analytics.skippedRate)}
          detail={`${formatPercent(analytics.completionRate)} completed // ${formatPercent(analytics.modifiedRate)} modified`}
        />
        <InsightCard
          label="Workload"
          value={formatDuration(analytics.weeklyVolume)}
          detail="Latest week inside the selected window."
        />
        <InsightCard
          label="Distance"
          value={formatDistance(analytics.totalDistance)}
          detail={`${formatDistance(analytics.totalRunDistance)} run + ${formatDistance(analytics.totalRowDistance)} row + ${formatDistance(analytics.totalSkiDistance)} ski`}
        />
        <InsightCard
          label="Effort"
          value={formatRpe(analytics.averageRpe)}
          detail="Average RPE across non-skipped sessions in this range."
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Adherence analysis"
          description="Completed, modified, and skipped sessions broken down week by week."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.weeklyMetrics}>
              <CartesianGrid strokeDasharray="4 4" stroke="#d6cfbf" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#6b685f' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b685f' }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label={String(label)}>
                      {payload.map((entry) => (
                        <div key={String(entry.dataKey)}>
                          {String(entry.name)}: {entry.value}
                        </div>
                      ))}
                    </ChartTooltipCard>
                  ) : null
                }
              />
              <Legend />
              <Bar dataKey="completed" stackId="adherence" fill="#12120f" name="Completed" />
              <Bar dataKey="modified" stackId="adherence" fill="#f4c400" name="Modified" />
              <Bar dataKey="skipped" stackId="adherence" fill="#c7bfae" name="Skipped" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Workout type breakdown"
          description="Movement mix inside the active filter window."
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label="Workout split">
                      <div>
                        {workoutTypeLabels[payload[0].name as keyof typeof workoutTypeLabels]}: {payload[0].value}
                      </div>
                    </ChartTooltipCard>
                  ) : null
                }
              />
              <Pie
                data={analytics.workoutTypeDistribution}
                cx="50%"
                cy="50%"
                dataKey="value"
                nameKey="name"
                outerRadius={110}
              >
                {analytics.workoutTypeDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={piePalette[index % piePalette.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Weekly load by workout type"
          description="Which session types are actually creating volume over time."
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.weeklyVolumeTrend}>
              <CartesianGrid strokeDasharray="4 4" stroke="#d6cfbf" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#6b685f' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b685f' }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label={String(label)}>
                      {payload.map((entry) => (
                        <div key={String(entry.dataKey)}>
                          {workoutTypeLabels[entry.dataKey as keyof typeof workoutTypeLabels]}: {entry.value} min
                        </div>
                      ))}
                    </ChartTooltipCard>
                  ) : null
                }
              />
              <Legend />
              <Bar dataKey="run" stackId="volume" fill="#12120f" name="Run" />
              <Bar dataKey="strength" stackId="volume" fill="#f4c400" name="Strength" />
              <Bar dataKey="hyrox_sim" stackId="volume" fill="#6b685f" name="Hyrox Sim" />
              <Bar dataKey="row" stackId="volume" fill="#b4aa96" name="Row" />
              <Bar dataKey="ski" stackId="volume" fill="#d8d1c0" name="Ski" />
              <Bar dataKey="recovery" stackId="volume" fill="#efe7d8" name="Recovery" />
              <Bar dataKey="mixed" stackId="volume" fill="#8e8573" name="Mixed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Fatigue vs volume"
          description="Weekly duration plotted against average RPE to surface fatigue-load coupling."
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="4 4" stroke="#d6cfbf" />
              <XAxis
                type="number"
                dataKey="volume"
                name="Volume"
                tick={{ fontSize: 11, fill: '#6b685f' }}
              />
              <YAxis
                type="number"
                dataKey="rpe"
                name="RPE"
                domain={[0, 10]}
                tick={{ fontSize: 11, fill: '#6b685f' }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '4 4' }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label={String(payload[0]?.payload.weekLabel ?? '')}>
                      <div>Volume: {payload[0]?.payload.volume} min</div>
                      <div>RPE: {payload[0]?.payload.rpe}</div>
                    </ChartTooltipCard>
                  ) : null
                }
              />
              <Scatter data={analytics.fatigueScatter} fill="#12120f" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Distance trend"
          description="Run, row, and ski output inside the selected time window."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.distanceTrend}>
              <CartesianGrid strokeDasharray="4 4" stroke="#d6cfbf" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#6b685f' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b685f' }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label={String(label)}>
                      {payload.map((entry) => (
                        <div key={String(entry.dataKey)}>
                          {String(entry.dataKey)}: {formatDistance(Number(entry.value ?? 0))}
                        </div>
                      ))}
                    </ChartTooltipCard>
                  ) : null
                }
              />
              <Legend />
              <Bar dataKey="run" fill="#12120f" name="Run" />
              <Bar dataKey="row" fill="#f4c400" name="Row" />
              <Bar dataKey="ski" fill="#8e8573" name="Ski" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="panel-card space-y-5">
        <div>
          <div className="section-kicker">Consistency view</div>
          <h3 className="font-display text-3xl uppercase tracking-tight text-carbon">
            Weekday adherence heatmap
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            This view reads which weekdays are dependable and which ones keep absorbing skipped
            sessions.
          </p>
        </div>

        <WeekdayHeatmap
          days={analytics.weekdayMetrics.map((day) => ({
            label: day.label,
            adherenceRate: day.adherenceRate,
            total: day.total,
          }))}
        />
      </section>
    </div>
  )
}
