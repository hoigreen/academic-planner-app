import { createFileRoute } from '@tanstack/react-router'
import { StudentDetail } from '@/features/students/student-detail'

export const Route = createFileRoute('/_authenticated/students/$studentId')({
  component: () => {
    const { studentId } = Route.useParams()
    return <StudentDetail studentId={studentId} />
  },
})
