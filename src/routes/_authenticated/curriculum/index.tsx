import { createFileRoute } from '@tanstack/react-router'
import { CurriculumExplorer } from '@/features/curriculum-explorer'

export const Route = createFileRoute('/_authenticated/curriculum/')({
  component: CurriculumExplorer,
})
