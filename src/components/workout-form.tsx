import { zodResolver } from '@hookform/resolvers/zod'
import { addDays, format, parseISO } from 'date-fns'
import { useEffect, useState, type ReactNode } from 'react'
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFieldArrayRemove,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form'
import { z } from 'zod'
import { useWorkoutData } from '../hooks/use-workout-data.ts'
import { cn } from '../lib/cn.ts'
import {
  exerciseCategoryLabels,
  exerciseCategoryOptions,
  exerciseFieldMap,
  workoutStatusOptions,
  workoutTypeOptions,
} from '../lib/workout-options.ts'
import {
  exerciseCategories,
  workoutStatuses,
  workoutTypes,
  type ExerciseCategory,
} from '../types/workouts.ts'

const optionalMetric = z.number().nullable()
const exerciseMetricFields = [
  'sets',
  'reps',
  'weight_kg',
  'distance_m',
  'time_seconds',
  'calories',
] as const

const exerciseSchema = z
  .object({
    exercise_name: z.string().min(2, 'Exercise name is required.'),
    category: z.enum(exerciseCategories),
    sets: optionalMetric,
    reps: optionalMetric,
    weight_kg: optionalMetric,
    distance_m: optionalMetric,
    time_seconds: optionalMetric,
    calories: optionalMetric,
    notes: z.string().max(240, 'Keep notes short.'),
  })
  .superRefine((value, ctx) => {
    const requiredFields = exerciseFieldMap[value.category]

    for (const field of requiredFields) {
      if (value[field] === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${field.replace('_', ' ')} is required for ${exerciseCategoryLabels[value.category]}.`,
        })
      }
    }
  })

const workoutFormSchema = z
  .object({
    date: z.string().min(1, 'Date is required.'),
    program_block: z.string().min(2, 'Program block is required.'),
    program_week: z.number().int().min(1).max(52),
    program_day: z.string().min(2, 'Program day is required.'),
    title: z.string().min(3, 'Workout title is required.'),
    workout_type: z.enum(workoutTypes),
    status: z.enum(workoutStatuses),
    duration_minutes: z.number().int().min(0).max(300),
    rpe: z.number().min(1).max(10).nullable(),
    notes: z.string().max(500, 'Keep notes to 500 characters or less.'),
    exercises: z.array(exerciseSchema).min(1, 'Add at least one exercise row.'),
  })
  .superRefine((value, ctx) => {
    if (value.status === 'planned' && value.rpe !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rpe'],
        message: 'Planned sessions should not carry an RPE yet.',
      })
    }

    if (value.status === 'skipped' && value.duration_minutes !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['duration_minutes'],
        message: 'Skipped sessions should use zero duration.',
      })
    }

    if (value.status === 'skipped' && value.rpe !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rpe'],
        message: 'Skipped sessions should not carry an RPE.',
      })
    }

    if (value.status !== 'skipped' && value.duration_minutes <= 0) {
      if (value.status === 'planned') return
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['duration_minutes'],
        message: 'Completed or modified sessions need a duration.',
      })
    }
  })

type WorkoutFormValues = z.infer<typeof workoutFormSchema>
type ExerciseRowError = NonNullable<FieldErrors<WorkoutFormValues>['exercises']>[number]

const numberFromInput = (value: string) => {
  if (value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function createExerciseRow(category: ExerciseCategory = 'strength'): WorkoutFormValues['exercises'][number] {
  return {
    exercise_name: '',
    category,
    sets: category === 'strength' ? 4 : null,
    reps: category === 'strength' ? 6 : null,
    weight_kg: category === 'strength' ? 40 : null,
    distance_m: null,
    time_seconds: null,
    calories: null,
    notes: '',
  }
}

function MetricInput({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="field-shell">
      <span className="data-label">{label}</span>
      {children}
      {error ? <span className="mt-2 text-xs text-red-700">{error}</span> : null}
    </label>
  )
}

function ExerciseRowFields({
  control,
  error,
  index,
  register,
  remove,
  rowCount,
  setValue,
}: {
  control: Control<WorkoutFormValues>
  error: ExerciseRowError | undefined
  index: number
  register: UseFormRegister<WorkoutFormValues>
  remove: UseFieldArrayRemove
  rowCount: number
  setValue: UseFormSetValue<WorkoutFormValues>
}) {
  const category = useWatch({
    control,
    name: `exercises.${index}.category`,
  })

  const visibleMetrics = exerciseFieldMap[category]

  return (
    <article className="rounded-[24px] border border-line bg-shell px-4 py-4 md:px-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="data-label">Exercise {index + 1}</div>
          <div className="mt-2 text-sm text-muted">
            Inputs adapt to the movement category. No kitchen-sink form fields.
          </div>
        </div>
        <button
          type="button"
          className="rounded-full border border-carbon px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-carbon transition hover:bg-carbon hover:text-shell disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => remove(index)}
          disabled={rowCount === 1}
        >
          Remove
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricInput label="Exercise name" error={error?.exercise_name?.message}>
          <input
            type="text"
            className="input-shell"
            placeholder="Sled Push"
            {...register(`exercises.${index}.exercise_name`)}
          />
        </MetricInput>

        <MetricInput label="Category" error={error?.category?.message}>
          <select
            className="select-shell"
            {...register(`exercises.${index}.category`, {
              onChange: (event) => {
                const nextCategory = event.target.value as ExerciseCategory
                const allowedFields = exerciseFieldMap[nextCategory]
                exerciseMetricFields.forEach((fieldName) => {
                  if (!allowedFields.includes(fieldName)) {
                    setValue(`exercises.${index}.${fieldName}`, null)
                  }
                })
              },
            })}
          >
            {exerciseCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </MetricInput>

        {visibleMetrics.includes('sets') ? (
          <MetricInput label="Sets" error={error?.sets?.message}>
            <input
              type="number"
              className="input-shell"
              min={0}
              {...register(`exercises.${index}.sets`, { setValueAs: numberFromInput })}
            />
          </MetricInput>
        ) : null}

        {visibleMetrics.includes('reps') ? (
          <MetricInput label="Reps" error={error?.reps?.message}>
            <input
              type="number"
              className="input-shell"
              min={0}
              {...register(`exercises.${index}.reps`, { setValueAs: numberFromInput })}
            />
          </MetricInput>
        ) : null}

        {visibleMetrics.includes('weight_kg') ? (
          <MetricInput label="Weight kg" error={error?.weight_kg?.message}>
            <input
              type="number"
              className="input-shell"
              min={0}
              step="0.5"
              {...register(`exercises.${index}.weight_kg`, {
                setValueAs: numberFromInput,
              })}
            />
          </MetricInput>
        ) : null}

        {visibleMetrics.includes('distance_m') ? (
          <MetricInput label="Distance m" error={error?.distance_m?.message}>
            <input
              type="number"
              className="input-shell"
              min={0}
              {...register(`exercises.${index}.distance_m`, {
                setValueAs: numberFromInput,
              })}
            />
          </MetricInput>
        ) : null}

        {visibleMetrics.includes('time_seconds') ? (
          <MetricInput label="Time seconds" error={error?.time_seconds?.message}>
            <input
              type="number"
              className="input-shell"
              min={0}
              {...register(`exercises.${index}.time_seconds`, {
                setValueAs: numberFromInput,
              })}
            />
          </MetricInput>
        ) : null}

        {visibleMetrics.includes('calories') ? (
          <MetricInput label="Calories" error={error?.calories?.message}>
            <input
              type="number"
              className="input-shell"
              min={0}
              {...register(`exercises.${index}.calories`, {
                setValueAs: numberFromInput,
              })}
            />
          </MetricInput>
        ) : null}

        <label
          className={cn(
            'field-shell',
            visibleMetrics.length < 2 && 'md:col-span-2 xl:col-span-2',
          )}
        >
          <span className="data-label">
            Movement notes
            {category === 'mobility' ? ' // minimal detail mode' : ''}
          </span>
          <textarea
            className="textarea-shell min-h-24"
            placeholder="Cue, split, or quality note."
            {...register(`exercises.${index}.notes`)}
          />
        </label>
      </div>
    </article>
  )
}

function createBaseDefaults(): WorkoutFormValues {
  return {
    date: format(new Date(), 'yyyy-MM-dd'),
    program_block: 'Race Specific',
    program_week: 10,
    program_day: format(new Date(), 'EEE'),
    title: '',
    workout_type: 'hyrox_sim',
    status: 'completed',
    duration_minutes: 60,
    rpe: 7,
    notes: '',
    exercises: [createExerciseRow()],
  }
}

interface WorkoutFormProps {
  initialDraft?: WorkoutFormValues
  workoutId?: string | null
  onSaved?: () => void
  saveLabel?: string
}

export function WorkoutForm({
  initialDraft,
  workoutId,
  onSaved,
  saveLabel,
}: WorkoutFormProps) {
  const { saveWorkout } = useWorkoutData()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const defaultValues = initialDraft ?? createBaseDefaults()

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues,
  })

  const { control, formState, handleSubmit, register, reset, setValue } = form
  const { errors, isSubmitting } = formState
  const status = useWatch({ control, name: 'status' })

  useEffect(() => {
    if (status === 'skipped') {
      setValue('duration_minutes', 0)
      setValue('rpe', null)
    }
    if (status === 'planned') {
      setValue('rpe', null)
    }
  }, [setValue, status])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'exercises',
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null)
      setSubmitSuccess(null)
      await saveWorkout(values, workoutId ?? undefined)

      reset({
        date: format(addDays(parseISO(values.date), 1), 'yyyy-MM-dd'),
        program_block: values.program_block,
        program_week: values.program_week,
        program_day: format(addDays(parseISO(values.date), 1), 'EEE'),
        title: '',
        workout_type: initialDraft?.workout_type ?? values.workout_type,
        status: 'completed',
        duration_minutes: 60,
        rpe: 7,
        notes: '',
        exercises: [createExerciseRow(initialDraft?.workout_type === 'strength' ? 'strength' : 'run')],
      })

      setSubmitSuccess(
        workoutId ? 'Planned workout updated and saved.' : `Saved ${values.title} successfully.`,
      )
      onSaved?.()
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : 'Unable to save this workout.',
      )
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="panel-card grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricInput label="Date" error={errors.date?.message}>
          <input type="date" className="input-shell" {...register('date')} />
        </MetricInput>

        <MetricInput label="Program block" error={errors.program_block?.message}>
          <input
            type="text"
            className="input-shell"
            placeholder="Race Specific"
            {...register('program_block')}
          />
        </MetricInput>

        <MetricInput label="Program week" error={errors.program_week?.message}>
          <input
            type="number"
            className="input-shell"
            min={1}
            max={52}
            {...register('program_week', { setValueAs: (value) => Number(value) })}
          />
        </MetricInput>

        <MetricInput label="Program day" error={errors.program_day?.message}>
          <input type="text" className="input-shell" placeholder="Thu" {...register('program_day')} />
        </MetricInput>

        <MetricInput label="Workout title" error={errors.title?.message}>
          <input
            type="text"
            className="input-shell"
            placeholder="Half Hyrox Simulation"
            {...register('title')}
          />
        </MetricInput>

        <MetricInput label="Workout type" error={errors.workout_type?.message}>
          <select className="select-shell" {...register('workout_type')}>
            {workoutTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </MetricInput>

        <MetricInput label="Status" error={errors.status?.message}>
          <select className="select-shell" {...register('status')}>
            {workoutStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </MetricInput>

        <MetricInput label="Duration minutes" error={errors.duration_minutes?.message}>
          <input
            type="number"
            className="input-shell"
            min={0}
            max={300}
            {...register('duration_minutes', { setValueAs: (value) => Number(value) })}
          />
        </MetricInput>

        <MetricInput label="RPE" error={errors.rpe?.message}>
          <input
            type="number"
            className="input-shell"
            min={1}
            max={10}
            step="0.1"
            placeholder="7.5"
            {...register('rpe', { setValueAs: numberFromInput })}
          />
        </MetricInput>

        <label className="field-shell md:col-span-2 xl:col-span-3">
          <span className="data-label">Session notes</span>
          <textarea
            className="textarea-shell min-h-30"
            placeholder="How did the session feel? What changed? What should carry into the next one?"
            {...register('notes')}
          />
          {errors.notes?.message ? (
            <span className="mt-2 text-xs text-red-700">{errors.notes.message}</span>
          ) : null}
        </label>
      </section>

      <section className="panel-card space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="section-kicker">Exercise rows</div>
            <h3 className="font-display text-3xl uppercase tracking-tight text-carbon">
              Station details
            </h3>
          </div>
          <button
            type="button"
            className="rounded-full border border-carbon px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-carbon transition hover:bg-carbon hover:text-shell"
            onClick={() => append(createExerciseRow('run'))}
          >
            Add row
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <ExerciseRowFields
              key={field.id}
              control={control}
              error={errors.exercises?.[index]}
              index={index}
              register={register}
              remove={remove}
              rowCount={fields.length}
              setValue={setValue}
            />
          ))}
        </div>
      </section>

      {submitError ? (
        <div className="rounded-3xl border border-red-800 bg-red-100 px-4 py-3 text-sm text-red-900">
          {submitError}
        </div>
      ) : null}

      {submitSuccess ? (
        <div className="rounded-3xl border border-carbon bg-accent-soft px-4 py-3 text-sm text-carbon">
          {submitSuccess}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Saves locally in your browser and updates the dashboard and analytics immediately.
        </p>
        <button
          type="submit"
          className="rounded-full border border-carbon bg-carbon px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-shell transition hover:-translate-y-0.5 hover:bg-carbon/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving session...' : saveLabel ?? (workoutId ? 'Update workout' : 'Save workout')}
        </button>
      </div>
    </form>
  )
}
