import { createFileRoute } from '@tanstack/react-router'
import { NextTermPlanner } from '@/features/planner'

export const Route = createFileRoute('/_authenticated/planner/$studentId')({
  component: () => {
    const { studentId } = Route.useParams()
    return <NextTermPlanner studentId={studentId} />
  },
})
