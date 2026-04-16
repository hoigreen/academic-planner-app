import { ShieldCheck } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CourseStatusBadge, type CourseStatus } from './CourseStatusBadge'
import type {
  KnowledgeBlockDto,
  CurriculumCourseDetailDto,
} from '@/lib/api-client'

interface CurriculumBlockAccordionProps {
  /** ORDBMS knowledge_block[] — one accordion per entry */
  knowledgeBlocks: KnowledgeBlockDto[]
  /** JSONB course_mapping: { blockName: courseCode[] } */
  courseMapping: Record<string, string[]>
  /** Optional per-course detail (name, credits, prereq) */
  courseDetails?: CurriculumCourseDetailDto[]
  /** Set of completed course codes for status rendering */
  completedCourses?: Set<string>
  /** Set of eligible course codes */
  eligibleCourses?: Set<string>
  /** Set of planned course codes */
  plannedCourses?: Set<string>
  /** Default open block names */
  defaultOpenBlocks?: string[]
}

function getCourseStatus(
  code: string,
  completed: Set<string>,
  eligible: Set<string>,
  planned: Set<string>
): CourseStatus {
  const upper = code.toUpperCase()
  if (completed.has(upper)) return 'completed'
  if (planned.has(upper)) return 'planned'
  if (eligible.has(upper)) return 'eligible'
  return 'locked'
}

export function CurriculumBlockAccordion({
  knowledgeBlocks,
  courseMapping,
  courseDetails = [],
  completedCourses = new Set(),
  eligibleCourses = new Set(),
  plannedCourses = new Set(),
  defaultOpenBlocks,
}: CurriculumBlockAccordionProps) {
  const detailMap = new Map(
    courseDetails.map((c) => [c.courseCode.toUpperCase(), c])
  )

  const defaultValue =
    defaultOpenBlocks ?? (knowledgeBlocks[0] ? [knowledgeBlocks[0].blockName] : [])

  if (knowledgeBlocks.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
        No curriculum structure available yet.
      </p>
    )
  }

  return (
    <Accordion type='multiple' defaultValue={defaultValue} className='w-full space-y-2'>
      {knowledgeBlocks.map((block) => {
        const courses = courseMapping[block.blockName] ?? []
        const completedCount = courses.filter((c) =>
          completedCourses.has(c.toUpperCase())
        ).length
        const progressPct =
          courses.length > 0 ? Math.round((completedCount / courses.length) * 100) : 0

        return (
          <AccordionItem
            key={block.blockName}
            value={block.blockName}
            className='rounded-lg border bg-card px-4'
          >
            <AccordionTrigger className='hover:no-underline'>
              <div className='flex w-full items-center gap-3 pe-2'>
                <div className='flex-1 text-left'>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold'>{block.blockName}</span>
                    {block.isMandatory && (
                      <Badge
                        variant='secondary'
                        className='flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      >
                        <ShieldCheck className='h-3 w-3' />
                        Mandatory
                      </Badge>
                    )}
                    <Badge variant='outline' className='font-mono text-xs'>
                      {block.minCreditsRequired} cr
                    </Badge>
                  </div>
                  {block.description && (
                    <p className='mt-0.5 text-xs text-muted-foreground'>
                      {block.description}
                    </p>
                  )}
                </div>
                <div className='flex w-36 items-center gap-2 text-xs text-muted-foreground'>
                  <Progress value={progressPct} className='h-1.5 flex-1' />
                  <span className='w-12 text-right'>
                    {completedCount}/{courses.length}
                  </span>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              {courses.length === 0 ? (
                <p className='pb-2 text-xs text-muted-foreground'>
                  No courses mapped to this block yet.
                </p>
              ) : (
                <div className='grid gap-1.5 pb-3 pt-1'>
                  {courses.map((code) => {
                    const upper = code.toUpperCase()
                    const detail = detailMap.get(upper)
                    const status = getCourseStatus(
                      code,
                      completedCourses,
                      eligibleCourses,
                      plannedCourses
                    )

                    return (
                      <div
                        key={code}
                        className='flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50'
                      >
                        <CourseStatusBadge status={status} compact />
                        <span className='w-24 shrink-0 font-mono text-xs font-medium'>
                          {code}
                        </span>
                        <span className='flex-1 truncate text-muted-foreground'>
                          {detail?.courseName ?? code}
                        </span>
                        {detail?.credits != null && (
                          <span className='shrink-0 text-xs text-muted-foreground'>
                            {detail.credits}cr
                          </span>
                        )}
                        {detail?.isRequired === false && (
                          <Badge variant='outline' className='shrink-0 text-xs'>
                            Elective
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
