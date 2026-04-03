import { format } from 'date-fns'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/page-header.tsx'
import { QuickStartPanel } from '../components/quick-start-panel.tsx'
import { WorkoutForm } from '../components/workout-form.tsx'
import { useWorkoutData } from '../hooks/use-workout-data.ts'
import { buildWorkoutDraft, createDraftForNewDate } from '../lib/workout-drafts.ts'
import type { WorkoutDraft } from '../types/workouts.ts'

interface LogLocationState {
  workoutId?: string
  intent?: 'plan'
}

function createBlankPlanDraft(): WorkoutDraft {
  const today = new Date()
  return {
    date: format(today, 'yyyy-MM-dd'),
    program_block: 'Race Specific',
    program_week: 12,
    program_day: format(today, 'EEE'),
    title: '',
    workout_type: 'hyrox_sim',
    status: 'planned',
    duration_minutes: 60,
    rpe: null,
    notes: 'Planned session.',
    exercises: [
      {
        exercise_name: '',
        category: 'run',
        sets: null,
        reps: null,
        weight_kg: null,
        distance_m: null,
        time_seconds: null,
        calories: null,
        notes: '',
      },
    ],
  }
}

export function LogWorkoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { workouts } = useWorkoutData()
  const [activeDraft, setActiveDraft] = useState<WorkoutDraft | undefined>(undefined)
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [formVersion, setFormVersion] = useState(0)

  const recentWorkouts = useMemo(
    () => workouts.filter((workout) => workout.status !== 'planned'),
    [workouts],
  )

  const routeSelection = useMemo(() => {
    const state = (location.state as LogLocationState | null) ?? null
    if (!state?.workoutId && state?.intent !== 'plan') return null

    if (state.intent === 'plan') {
      return {
        workoutId: null,
        draft: createBlankPlanDraft(),
        label: 'Planning a new session',
      }
    }

    const sourceWorkout = workouts.find((workout) => workout.id === state.workoutId)
    if (!sourceWorkout) return null

    return {
      workoutId: sourceWorkout.status === 'planned' ? sourceWorkout.id : null,
      draft:
        sourceWorkout.status === 'planned'
          ? buildWorkoutDraft(sourceWorkout, {
              status: 'completed',
              rpe: 7,
              notes: sourceWorkout.notes === 'Planned session.' ? '' : sourceWorkout.notes,
            })
          : createDraftForNewDate(sourceWorkout, 'completed'),
      label:
        sourceWorkout.status === 'planned'
          ? `Completing planned session // ${sourceWorkout.title}`
          : `Duplicated ${sourceWorkout.title}`,
    }
  }, [location.state, workouts])

  useEffect(() => {
    if (!routeSelection) return

    startTransition(() => {
      setActiveWorkoutId(routeSelection.workoutId)
      setActiveDraft(routeSelection.draft)
      setActiveLabel(routeSelection.label)
      setFormVersion((current) => current + 1)
    })
  }, [routeSelection])

  useEffect(() => {
    if (!location.state) return
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const effectiveDraft = activeDraft
  const effectiveWorkoutId = activeWorkoutId
  const effectiveLabel = activeLabel

  const clearSource = () => {
    setActiveWorkoutId(null)
    setActiveDraft(undefined)
    setActiveLabel(null)
    setFormVersion((current) => current + 1)
  }

  const handleSelectDraft = (
    draft: WorkoutDraft,
    options?: { workoutId?: string | null; label?: string },
  ) => {
    setActiveWorkoutId(options?.workoutId ?? null)
    setActiveDraft(draft)
    setActiveLabel(options?.label ?? null)
    setFormVersion((current) => current + 1)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Log workout"
        title="Capture the session"
        description="Plan sessions, duplicate repeated work, and log the actual training day without rebuilding every field from scratch."
      />

      <QuickStartPanel
        activeSourceLabel={effectiveLabel}
        onClearSource={clearSource}
        onSelectDraft={handleSelectDraft}
        recentWorkouts={recentWorkouts}
      />

      <WorkoutForm
        key={`${formVersion}-${effectiveWorkoutId ?? 'new'}-${effectiveLabel ?? 'blank'}`}
        initialDraft={effectiveDraft}
        workoutId={effectiveWorkoutId}
        onSaved={() => {
          if (effectiveDraft || effectiveWorkoutId || effectiveLabel) {
            clearSource()
          }
        }}
        saveLabel={effectiveWorkoutId ? 'Update planned workout' : undefined}
      />
    </div>
  )
}
