import { PageHeader } from '../components/page-header.tsx'
import { useAppData } from '../hooks/use-app-data.ts'
import { formatWeekLabel } from '../lib/date.ts'
import { SKIP_REASON_LABELS } from '../lib/execution.ts'

export function ReviewPage() {
  const { weeklyReview } = useAppData()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Weekly review"
        title="Review the gap between plan and reality"
        description="These metrics are meant to help you change the system, not feel judged by it."
        actions={
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="field__label">Week</div>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {formatWeekLabel(weeklyReview.startDate, weeklyReview.endDate)}
            </div>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Completion rate" value={`${Math.round(weeklyReview.completionRate * 100)}%`} />
        <Metric label="Planned vs actual" value={`${Math.round(weeklyReview.plannedVsActualRatio * 100)}%`} />
        <Metric label="Partials" value={String(weeklyReview.partialCount)} />
        <Metric label="Skips" value={String(weeklyReview.skippedCount)} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel">
          <div className="eyebrow">Mood and energy</div>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Weekly state check</h2>
          {weeklyReview.moodLogCount > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Metric label="Average mood" value={weeklyReview.averageMood ? weeklyReview.averageMood.toFixed(1) : '0.0'} />
              <Metric label="Average energy" value={weeklyReview.averageEnergy ? weeklyReview.averageEnergy.toFixed(1) : '0.0'} />
              <Metric label="Entries logged" value={String(weeklyReview.moodLogCount)} />
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate-600">
              No mood or energy entries were logged this week yet. The review keeps this lightweight on purpose.
            </p>
          )}
        </div>

        <div className="panel">
          <div className="eyebrow">Reading guide</div>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">How to read this review</h2>
          <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
            <p>Completion rate uses weighted partials, so a half-finished measurable habit counts as half completed.</p>
            <p>Moved items are tracked separately so they do not inflate planned totals or drag down adherence unfairly.</p>
            <p>Planned vs actual compares what you intended to do against the value you actually logged, using the current week schedule.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="panel space-y-4">
          <div>
            <div className="eyebrow">Domain balance</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Where execution held up</h2>
          </div>
          <div className="space-y-3">
            {weeklyReview.domainStats.map((domain) => (
              <div key={domain.domainId} className="rounded-[22px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">{domain.domainName}</span>
                  <span className="text-sm text-slate-600">{Math.round(domain.completionRate * 100)}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${Math.max(6, domain.completionRate * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel space-y-4">
          <div>
            <div className="eyebrow">Skip reasoning</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">What got in the way</h2>
          </div>
          {weeklyReview.topSkipReasons.length === 0 ? (
            <p className="text-sm leading-7 text-slate-600">
              No skip reason pattern is visible yet. The app only surfaces this once the data is real enough.
            </p>
          ) : (
            <div className="space-y-3">
              {weeklyReview.topSkipReasons.map((reason) => (
                <div key={reason.reason} className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900">{SKIP_REASON_LABELS[reason.reason]}</span>
                    <span className="text-sm text-slate-600">{reason.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="panel space-y-4">
          <div>
            <div className="eyebrow">Habit detail</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Consistency by habit</h2>
          </div>
          <div className="space-y-3">
            {weeklyReview.habitStats.map((stat) => (
              <div key={stat.habitId} className="rounded-[22px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">{stat.habitTitle}</span>
                  <span className="text-sm text-slate-600">
                    {Math.round((stat.weightedCompletion / Math.max(stat.planned, 1)) * 100)}%
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {stat.done} done | {stat.partial} partial | {stat.skipped} skipped
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel space-y-4">
          <div>
            <div className="eyebrow">Insights</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Only what the data supports</h2>
          </div>
          <div className="space-y-3">
            {weeklyReview.insights.map((insight) => (
              <div key={insight.id} className="rounded-[22px] border border-slate-200 bg-white p-4">
                <div className="font-medium text-slate-900">{insight.title}</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">{insight.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <div className="field__label">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
    </div>
  )
}
