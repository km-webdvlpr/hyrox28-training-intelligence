import { PageHeader } from '../components/page-header.tsx'
import { WorkoutForm } from '../components/workout-form.tsx'

export function LogWorkoutPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Log workout"
        title="Capture the session"
        description="Use the same data model the analytics layer reads from: one workout, then clean exercise rows with movement-specific inputs."
      />
      <WorkoutForm />
    </div>
  )
}
