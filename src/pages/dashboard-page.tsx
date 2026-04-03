import {
  Activity,
  CheckCircle2,
  Flame,
  Gauge,
  Route,
  TimerReset,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard, ChartTooltipCard } from '../components/charts.tsx'
import { InsightCard, KpiCard } from '../components/metric-cards.tsx'
import { PageHeader } from '../components/page-header.tsx'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '../components/states.tsx'
import { useWorkoutData } from '../hooks/use-workout-data.ts'
import {
  formatCompactDate,
  formatDistance,
  formatDuration,
  formatPercent,
  formatRpe,
  pluralize,
} from '../lib/formatters.ts'
import { workoutTypeLabels } from '../lib/workout-options.ts'

const chartPalette = ['#12120f', '#f4c400', '#6b685f', '#dfd7c5', '#8e8573', '#b4aa96', '#3f3f38']

const typeColors = {
  run: '#12120f',
  strength: '#f4c400',
  hyrox_sim: '#5b564d',
  row: '#8e8573',
  ski: '#c6bfae',
  recovery: '#efe7d8',
  mixed: '#968a73',
}

export function DashboardPage() {
  const { analytics, error, isLoading, reload, workouts } = useWorkoutData()

  if (isLoading) return <LoadingPanel title="Loading dashboard telemetry..." />

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

  if (!workouts.length) {
    return (
      <EmptyPanel
        title="No workouts yet"
        description="Once you log a session, the board will start rendering trends, completion rates, and workload patterns."
      />
    )
  }

  const recentWeeks = analytics.weeklyMetrics.slice(-8)
  const recentVolume = analytics.weeklyVolumeTrend.slice(-8)
  const recentDistance = analytics.distanceTrend.slice(-8)
  const rpeTrendCopy =
    analytics.rpeTrendDirection === 'rising'
      ? 'Recent weeks are trending harder.'
      : analytics.rpeTrendDirection === 'falling'
        ? 'Recent weeks are easing off slightly.'
        : 'Recent effort is holding steady.'

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Current state view"
        title="Training dashboard"
        description="A quick read on how the block is behaving right now: adherence, load, effort, and movement mix."
        actions={
          <div className="rounded-[24px] border border-carbon bg-accent px-4 py-3 text-right">
            <div className="data-label">Latest session</div>
            <div className="mt-2 font-display text-2xl uppercase tracking-tight text-carbon">
              {workouts[0]?.title}
            </div>
            <div className="mt-1 text-sm text-carbon/75">{formatCompactDate(workouts[0]!.date)}</div>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total workouts"
          value={String(analytics.totalWorkouts)}
          detail="Seeded training history plus every session you add from the log form."
          icon={Activity}
        />
        <KpiCard
          label="Completion rate"
          value={formatPercent(analytics.completionRate)}
          detail={`${formatPercent(analytics.modifiedRate)} modified and ${formatPercent(analytics.skippedRate)} skipped.`}
          icon={CheckCircle2}
        />
        <KpiCard
          label="Current streak"
          value={pluralize(analytics.currentStreak, 'session')}
          detail="Counts consecutive non-skipped sessions from the latest log backward."
          icon={Flame}
        />
        <KpiCard
          label="Weekly volume"
          value={formatDuration(analytics.weeklyVolume)}
          detail="Current week duration across completed and modified sessions."
          icon={TimerReset}
        />
        <KpiCard
          label="Average RPE"
          value={formatRpe(analytics.averageRpe)}
          detail="Average perceived effort, ignoring skipped days."
          icon={Gauge}
        />
        <KpiCard
          label="Total distance"
          value={formatDistance(analytics.totalDistance)}
          detail={`${formatDistance(analytics.totalRunDistance)} run // ${formatDistance(analytics.totalRowDistance)} row // ${formatDistance(analytics.totalSkiDistance)} ski`}
          icon={Route}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Most skipped workout type"
          value={
            analytics.mostSkippedWorkoutType
              ? workoutTypeLabels[analytics.mostSkippedWorkoutType]
              : 'None yet'
          }
          detail="Useful for spotting the part of the plan that keeps slipping."
        />
        <InsightCard
          label="Highest volume week"
          value={analytics.highestVolumeWeek ? formatDuration(analytics.highestVolumeWeek.totalDuration) : 'N/A'}
          detail={
            analytics.highestVolumeWeek
              ? analytics.highestVolumeWeek.weekLabel
              : 'More data needed before volume spikes show up.'
          }
        />
        <InsightCard
          label="RPE direction"
          value={analytics.rpeTrendDirection}
          detail={rpeTrendCopy}
        />
        <InsightCard
          label="Consistency by weekday"
          value={analytics.bestWeekday ? analytics.bestWeekday.label : 'N/A'}
          detail={
            analytics.bestWeekday
              ? `${formatPercent(analytics.bestWeekday.adherenceRate)} adherence on ${analytics.bestWeekday.label}.`
              : 'Not enough sessions yet.'
          }
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Workouts per week"
          description="Weekly training rhythm across the last eight weeks."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recentWeeks}>
              <CartesianGrid strokeDasharray="4 4" stroke="#d6cfbf" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#6b685f' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b685f' }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label={String(label)}>
                      <div>{payload[0]?.value} workouts</div>
                    </ChartTooltipCard>
                  ) : null
                }
              />
              <Bar dataKey="totalWorkouts" fill="#12120f" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Completion rate over time"
          description="Weekly completion pace across the current dataset."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recentWeeks}>
              <CartesianGrid strokeDasharray="4 4" stroke="#d6cfbf" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#6b685f' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b685f' }} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label={String(label)}>
                      <div>{formatPercent(Number(payload[0]?.value ?? 0))} completed</div>
                    </ChartTooltipCard>
                  ) : null
                }
              />
              <Line
                type="monotone"
                dataKey="completionRate"
                stroke="#f4c400"
                strokeWidth={3}
                dot={{ r: 4, fill: '#12120f' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Weekly training volume"
          description="Stacked duration by workout type, so you can see what is driving the load."
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recentVolume}>
              <CartesianGrid strokeDasharray="4 4" stroke="#d6cfbf" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#6b685f' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b685f' }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label={String(label)}>
                      {payload.map((entry) => (
                        <div key={String(entry.dataKey)}>
                          {workoutTypeLabels[entry.dataKey as keyof typeof typeColors]}: {entry.value} min
                        </div>
                      ))}
                    </ChartTooltipCard>
                  ) : null
                }
              />
              <Legend />
              {Object.entries(typeColors).map(([type, color]) => (
                <Bar
                  key={type}
                  dataKey={type}
                  stackId="volume"
                  fill={color}
                  radius={type === 'mixed' ? [8, 8, 0, 0] : 0}
                  name={workoutTypeLabels[type as keyof typeof typeColors]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Workout type distribution"
          description="How the block currently splits across movement focus."
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label="Distribution">
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
                outerRadius={108}
                dataKey="value"
                nameKey="name"
              >
                {analytics.workoutTypeDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Average RPE trend"
          description="Weekly perceived effort trend across logged training."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recentWeeks}>
              <CartesianGrid strokeDasharray="4 4" stroke="#d6cfbf" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#6b685f' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b685f' }} domain={[0, 10]} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label={String(label)}>
                      <div>{formatRpe(Number(payload[0]?.value ?? 0))}</div>
                    </ChartTooltipCard>
                  ) : null
                }
              />
              <Line
                type="monotone"
                dataKey="avgRpe"
                stroke="#12120f"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f4c400' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Distance trend"
          description="Run, row, and ski distances across the recent weeks."
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recentDistance}>
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
              <Line type="monotone" dataKey="run" stroke="#12120f" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="row" stroke="#f4c400" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="ski" stroke="#8e8573" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  )
}
