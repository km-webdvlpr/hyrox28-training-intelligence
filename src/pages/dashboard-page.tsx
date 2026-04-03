import {
  Activity,
  CalendarCheck2,
  CheckCircle2,
  Flame,
  Gauge,
  Route,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
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
import { useNavigate } from 'react-router-dom'
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
  formatWorkoutDate,
  pluralize,
} from '../lib/formatters.ts'
import { workoutStatusLabels, workoutTypeLabels } from '../lib/workout-options.ts'

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

function statusChipClass(status: keyof typeof workoutStatusLabels) {
  if (status === 'planned') return 'bg-[#efe7d8] text-[#3f3a31]'
  if (status === 'completed') return 'bg-[#e7f5ec] text-[#0f5132]'
  if (status === 'modified') return 'bg-[#fff4d1] text-[#7a5b00]'
  return 'bg-[#ffe0e0] text-[#8f1d1d]'
}

export function DashboardPage() {
  const navigate = useNavigate()
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

  const actualLatest = workouts.find((workout) => workout.status !== 'planned')
  const featuredWorkout = analytics.upcomingPlannedWorkouts[0] ?? actualLatest ?? workouts[0]
  const recentWeeks = analytics.weeklyMetrics.slice(-8)
  const recentVolume = analytics.weeklyVolumeTrend.slice(-8)
  const recentDistance = analytics.distanceTrend.slice(-8)
  const recentPlanTrend = analytics.planAdherenceTrend.slice(-8)
  const recentHyroxProgress = analytics.hyroxProgressTrend.slice(-8)
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
        description="A weekly board for what is planned, what got done, and whether the block is actually moving you toward race readiness."
        actions={
          <div className="space-y-3 rounded-[24px] border border-carbon bg-accent px-4 py-3 text-right">
            <div>
              <div className="data-label">
                {featuredWorkout.status === 'planned' ? 'Next planned session' : 'Latest session'}
              </div>
              <div className="mt-2 font-display text-2xl uppercase tracking-tight text-carbon">
                {featuredWorkout.title}
              </div>
              <div className="mt-1 text-sm text-carbon/75">{formatCompactDate(featuredWorkout.date)}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-carbon bg-carbon px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-shell transition hover:-translate-y-0.5"
                onClick={() => navigate('/log', { state: { intent: 'plan' } })}
              >
                Plan session
              </button>
              <button
                type="button"
                className="rounded-full border border-carbon px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-carbon transition hover:bg-carbon hover:text-shell"
                onClick={() => navigate('/log')}
              >
                Quick log
              </button>
            </div>
          </div>
        }
      />

      <section className="panel-card space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="section-kicker">This week board</div>
            <h3 className="font-display text-3xl uppercase tracking-tight text-carbon">
              Plan vs reality
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
              This is the athlete truth screen: what was scheduled, what got executed, and what is
              still waiting for attention.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[22px] border border-carbon bg-shell px-4 py-3">
              <div className="data-label">Scheduled</div>
              <div className="mt-2 font-display text-4xl uppercase text-carbon">
                {analytics.thisWeekSummary.scheduled}
              </div>
            </div>
            <div className="rounded-[22px] border border-carbon bg-shell px-4 py-3">
              <div className="data-label">Executed</div>
              <div className="mt-2 font-display text-4xl uppercase text-carbon">
                {analytics.thisWeekSummary.executed}
              </div>
            </div>
            <div className="rounded-[22px] border border-carbon bg-shell px-4 py-3">
              <div className="data-label">Still planned</div>
              <div className="mt-2 font-display text-4xl uppercase text-carbon">
                {analytics.thisWeekSummary.planned}
              </div>
            </div>
            <div className="rounded-[22px] border border-carbon bg-shell px-4 py-3">
              <div className="data-label">Plan completion</div>
              <div className="mt-2 font-display text-4xl uppercase text-carbon">
                {formatPercent(analytics.thisWeekSummary.planCompletionRate)}
              </div>
            </div>
          </div>
        </div>

        {analytics.currentWeekWorkouts.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {analytics.currentWeekWorkouts.map((workout) => (
              <article key={workout.id} className="rounded-[24px] border border-line bg-shell p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="data-label">{formatWorkoutDate(workout.date)}</div>
                    <h4 className="mt-2 font-display text-2xl uppercase tracking-tight text-carbon">
                      {workout.title}
                    </h4>
                    <p className="mt-2 text-sm text-muted">
                      {workoutTypeLabels[workout.workout_type]} // {workout.program_block}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusChipClass(workout.status)}`}
                  >
                    {workoutStatusLabels[workout.status]}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {workout.status === 'planned' ? (
                    <button
                      type="button"
                      className="rounded-full border border-carbon bg-carbon px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-shell transition hover:-translate-y-0.5"
                      onClick={() => navigate('/log', { state: { workoutId: workout.id } })}
                    >
                      Log from plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-full border border-carbon px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-carbon transition hover:bg-carbon hover:text-shell"
                      onClick={() => navigate('/log', { state: { workoutId: workout.id } })}
                    >
                      Duplicate session
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-line bg-shell px-5 py-6">
            <div className="font-display text-2xl uppercase text-carbon">No sessions in this week yet</div>
            <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
              Plan the week first or log the session you just finished. The board gets more useful
              as soon as there is a real weekly structure to review.
            </p>
            <button
              type="button"
              className="mt-4 rounded-full border border-carbon bg-carbon px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-shell transition hover:-translate-y-0.5"
              onClick={() => navigate('/log', { state: { intent: 'plan' } })}
            >
              Create planned workout
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Logged workouts"
          value={String(analytics.totalWorkouts)}
          detail={`${analytics.plannedWorkouts} planned sessions are waiting in the queue.`}
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
          detail="Counts consecutive non-skipped logged sessions from the latest actual workout backward."
          icon={Flame}
        />
        <KpiCard
          label="Weekly volume"
          value={formatDuration(analytics.weeklyVolume)}
          detail="Current-week duration across completed and modified sessions."
          icon={CalendarCheck2}
        />
        <KpiCard
          label="Average RPE"
          value={formatRpe(analytics.averageRpe)}
          detail="Average perceived effort, ignoring planned and skipped sessions."
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
          label="Hyrox sims done"
          value={String(analytics.hyroxProgress.hyroxSimulationSessions)}
          detail="Completed or modified race-specific simulation sessions logged so far."
        />
        <InsightCard
          label="Best engine week"
          value={formatDistance(analytics.hyroxProgress.bestEngineWeekDistance)}
          detail="Highest combined run, row, and ski distance in a single week."
        />
        <InsightCard
          label="Heaviest station load"
          value={`${analytics.hyroxProgress.highestStationLoad.toFixed(1)} kg`}
          detail="Best recorded loading from strength and station movements."
        />
        <InsightCard
          label="Best wall ball volume"
          value={`${analytics.hyroxProgress.bestWallBallVolume} reps`}
          detail={`Longest single run session: ${formatDistance(analytics.hyroxProgress.longestRunSessionDistance)}.`}
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
          title="Plan adherence over time"
          description="Scheduled work against what was actually executed, week by week."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recentPlanTrend}>
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
              <Bar dataKey="scheduled" fill="#efe7d8" name="Scheduled" />
              <Bar dataKey="executed" fill="#12120f" name="Executed" />
              <Bar dataKey="skipped" fill="#f4c400" name="Skipped" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Hyrox progress review"
          description="Engine distance trend with simulation exposure layered on top."
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={recentHyroxProgress}>
              <CartesianGrid strokeDasharray="4 4" stroke="#d6cfbf" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#6b685f' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6b685f' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b685f' }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltipCard label={String(label)}>
                      {payload.map((entry) => (
                        <div key={String(entry.dataKey)}>
                          {String(entry.name)}: {entry.dataKey === 'engineDistance' ? formatDistance(Number(entry.value ?? 0)) : entry.value}
                        </div>
                      ))}
                    </ChartTooltipCard>
                  ) : null
                }
              />
              <Legend />
              <Bar yAxisId="left" dataKey="engineDistance" fill="#12120f" name="Engine distance" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="hyroxSimCompleted"
                stroke="#f4c400"
                strokeWidth={3}
                dot={{ r: 4, fill: '#5b564d' }}
                name="Hyrox sims"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

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
                      <div>{payload[0]?.value} actual workouts</div>
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
          title="Distance trend"
          description="Run, row, and ski distances across the recent weeks."
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
