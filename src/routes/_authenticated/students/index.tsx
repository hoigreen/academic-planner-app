import { createFileRoute } from '@tanstack/react-router'
import { StudentSearch } from '@/features/students'

export const Route = createFileRoute('/_authenticated/students/')({
  component: StudentSearch,
})
