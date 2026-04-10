import { useState } from 'react'
import type { Domain, Habit, RoutineFormInput } from '../types/execution.ts'

type DraftItem = {
  id: string
  itemType: 'habit_ref' | 'action'
  label: string
  habitId?: string | null
}

export function RoutineForm({
  domains,
  habits,
  onSubmit,
}: {
  domains: Domain[]
  habits: Habit[]
  onSubmit: (input: RoutineFormInput) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [domainId, setDomainId] = useState(domains[0]?.id ?? '')
  const [estimatedDurationMin, setEstimatedDurationMin] = useState(20)
  const [items, setItems] = useState<DraftItem[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const addActionItem = () =>
    setItems((current) => [
      ...current,
      { id: crypto.randomUUID(), itemType: 'action', label: '' },
    ])

  const addHabitItem = () => {
    const habit = habits[0]
    setItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        itemType: 'habit_ref',
        label: habit?.title ?? '',
        habitId: habit?.id ?? null,
      },
    ])
  }

  const updateItem = (id: string, next: Partial<DraftItem>) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...next } : item)))

  const removeItem = (id: string) =>
    setItems((current) => current.filter((item) => item.id !== id))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const filteredItems = items
      .map((item) => ({
        itemType: item.itemType,
        label: item.label.trim(),
        habitId: item.itemType === 'habit_ref' ? item.habitId ?? null : null,
      }))
      .filter((item) => item.label.length > 0)

    if (!title.trim() || !domainId || filteredItems.length === 0) return

    setIsSaving(true)
    try {
      await onSubmit({
        title: title.trim(),
        domainId,
        estimatedDurationMin,
        items: filteredItems,
      })
      setTitle('')
      setEstimatedDurationMin(20)
      setItems([])
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="panel space-y-4" onSubmit={handleSubmit}>
      <div>
        <div className="eyebrow">Create routine</div>
        <div className="mt-2 text-sm text-slate-600">
          Keep routines simple: ordered actions or linked habits, launched manually when needed.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="field">
          <span className="field__label">Title</span>
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Domain</span>
          <select className="input" value={domainId} onChange={(event) => setDomainId(event.target.value)}>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field__label">Estimated duration</span>
        <input
          className="input"
          min={1}
          type="number"
          value={estimatedDurationMin}
          onChange={(event) => setEstimatedDurationMin(Number(event.target.value))}
        />
      </label>

      <div className="space-y-3">
        <div className="flex gap-2">
          <button className="secondary-button" onClick={addHabitItem} type="button">
            Add habit item
          </button>
          <button className="secondary-button" onClick={addActionItem} type="button">
            Add action item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white p-4">
            <div className="field__label">Step {index + 1}</div>
            <div className="mt-3 grid gap-3 md:grid-cols-[0.9fr_1.1fr_auto]">
              <select
                className="input"
                value={item.itemType}
                onChange={(event) =>
                  updateItem(item.id, {
                    itemType: event.target.value as 'habit_ref' | 'action',
                    habitId: event.target.value === 'habit_ref' ? habits[0]?.id ?? null : null,
                    label:
                      event.target.value === 'habit_ref'
                        ? habits[0]?.title ?? item.label
                        : item.label,
                  })
                }
              >
                <option value="habit_ref">Habit reference</option>
                <option value="action">Action</option>
              </select>

              {item.itemType === 'habit_ref' ? (
                <select
                  aria-label={`Linked habit ${index + 1}`}
                  className="input"
                  value={item.habitId ?? habits[0]?.id ?? ''}
                  onChange={(event) => {
                    const habit = habits.find((entry) => entry.id === event.target.value)
                    updateItem(item.id, {
                      habitId: event.target.value,
                      label: habit?.title ?? item.label,
                    })
                  }}
                >
                  {habits.map((habit) => (
                    <option key={habit.id} value={habit.id}>
                      {habit.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  aria-label={`Action label ${index + 1}`}
                  className="input"
                  placeholder="Quick desk reset"
                  value={item.label}
                  onChange={(event) => updateItem(item.id, { label: event.target.value })}
                />
              )}

              <button className="secondary-button" onClick={() => removeItem(item.id)} type="button">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="primary-button w-full" disabled={isSaving} type="submit">
        {isSaving ? 'Saving...' : 'Add routine'}
      </button>
    </form>
  )
}
