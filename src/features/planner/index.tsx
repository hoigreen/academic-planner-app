import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Save,
  Loader2,
  Sparkles,
  Info,
  XCircle,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useStudent,
  useEligibleCourses,
  useRecommendations,
  useStudentPlans,
  useValidatePlan,
  useCreatePlan,
  useAddPlanItem,
  useRemovePlanItem,
} from '@/hooks/use-academic-api'
import type { CourseRecommendationDto, EligibleCourseDto } from '@/lib/api-client'

const CURRENT_YEAR = 2026
const DEFAULT_TERM_CODE = CURRENT_YEAR * 10 + 2

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation type → badge display config
// ─────────────────────────────────────────────────────────────────────────────
const REC_LABELS: Record<string, { label: string; color: string }> = {
  required_core:           { label: 'Required Core',        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  concentration_entry:     { label: 'Unlocks Concentration', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  concentration_required:  { label: 'Concentration',         color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  major_core:              { label: 'Major Core',            color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  elective_to_fill_bucket: { label: 'Elective',              color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
}
function getRecLabel(type: string) {
  return REC_LABELS[type] ?? { label: type, color: 'bg-gray-100 text-gray-700' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export function NextTermPlanner({ studentId }: { studentId: string }) {
  const [termCode, setTermCode] = useState<number>(DEFAULT_TERM_CODE)
  // "draft" courses the advisor has selected but not yet saved
  const [draft, setDraft] = useState<Set<string>>(new Set())

  const { data: student } = useStudent(studentId)
  const { data: eligible, isLoading: loadingEligible } = useEligibleCourses(studentId)
  const { data: recommendations, isLoading: loadingRecs } = useRecommendations(
    studentId,
    { targetTermCode: termCode, minCredits: 15, maxCredits: 21 }
  )
  const { data: existingPlan, isLoading: loadingPlan } = useStudentPlans(studentId, termCode)
  const { data: validationResult } = useValidatePlan(
    studentId,
    draft.size > 0 || (existingPlan?.items?.length ?? 0) > 0 ? termCode : undefined
  )

  const createPlanMutation = useCreatePlan()
  const addItemMutation    = useAddPlanItem()
  const removeItemMutation = useRemovePlanItem()

  // Codes that are already saved in DB for this term
  const savedCodes = useMemo(
    () => new Set((existingPlan?.items ?? []).map((i) => i.courseCode)),
    [existingPlan]
  )

  // Final plan = saved ∪ draft
  const finalPlan = useMemo(
    () => new Set([...savedCodes, ...draft]),
    [savedCodes, draft]
  )

  const totalCredits = useMemo(() => {
    let sum = 0
    for (const code of finalPlan) {
      const rec = recommendations?.recommendedCourses.find((r) => r.courseCode === code)
      const eli = eligible?.eligibleCourses.find((e) => e.courseCode === code)
      const saved = existingPlan?.items.find((i) => i.courseCode === code)
      sum += rec?.credits ?? eli?.credits ?? saved?.credits ?? 3
    }
    return sum
  }, [finalPlan, recommendations, eligible, existingPlan])

  const toggleDraft = (code: string) => {
    if (savedCodes.has(code)) return // already in DB; use remove
    setDraft((prev) => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const acceptSuggested = () => {
    const codes = (recommendations?.recommendedCourses ?? [])
      .filter((r) => r.canRegister)
      .map((r) => r.courseCode)
    setDraft(new Set(codes.filter((c) => !savedCodes.has(c))))
    toast.info(`Accepted ${codes.length} suggested courses into draft`)
  }

  const handleSave = async () => {
    const allCodes = [...finalPlan]
    if (allCodes.length === 0) { toast.error('No courses selected'); return }
    try {
      if (existingPlan && existingPlan.items.length > 0) {
        const toAdd = [...draft]
        const toRemove = existingPlan.items.filter((i) => !finalPlan.has(i.courseCode))
        for (const item of toRemove)
          await removeItemMutation.mutateAsync({ studentId, termCode, planId: item.planId })
        for (const code of toAdd)
          await addItemMutation.mutateAsync({ studentId, termCode, courseCode: code })
      } else {
        await createPlanMutation.mutateAsync({ studentId, termCode, courseCodes: allCodes })
      }
      toast.success('Plan saved successfully')
      setDraft(new Set())
    } catch {
      toast.error('Failed to save plan')
    }
  }

  const handleRemoveSaved = async (planId: number) => {
    try {
      await removeItemMutation.mutateAsync({ studentId, termCode, planId })
      toast.success('Course removed from plan')
    } catch {
      toast.error('Failed to remove course')
    }
  }

  const isSaving =
    createPlanMutation.isPending ||
    addItemMutation.isPending ||
    removeItemMutation.isPending

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <Link to='/students/$studentId' params={{ studentId }}>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <BookOpen className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>
            Next-Term Planner
            {student && (
              <span className='ml-2 text-base font-normal text-muted-foreground'>
                — {student.fullName} ({studentId})
              </span>
            )}
          </h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='space-y-4'>
          {/* Top bar: term selector + plan summary */}
          <div className='flex flex-wrap items-end gap-3'>
            <div>
              <label className='mb-1 block text-sm font-medium'>Target Term</label>
              <Input
                type='number'
                value={termCode}
                onChange={(e) => setTermCode(Number(e.target.value))}
                className='w-28'
                min={20000}
                max={29999}
              />
            </div>
            <div className='flex-1'>
              <Card>
                <CardContent className='flex flex-wrap items-center gap-4 py-3'>
                  <span className='text-sm'>
                    <span className='text-muted-foreground'>Selected: </span>
                    <span className='font-bold'>{finalPlan.size} courses</span>
                  </span>
                  <span className='text-sm'>
                    <span className='text-muted-foreground'>Credits: </span>
                    <span className={`font-bold ${totalCredits > 21 ? 'text-destructive' : totalCredits >= 15 ? 'text-green-600' : ''}`}>
                      {totalCredits}
                    </span>
                  </span>
                  {validationResult && !validationResult.isValid && (
                    <Badge variant='destructive' className='gap-1'>
                      <ShieldAlert className='h-3 w-3' />
                      {validationResult.errors.length} validation error(s)
                    </Badge>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || finalPlan.size === 0}
                    className='ms-auto'
                  >
                    {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    <Save className='mr-2 h-4 w-4' />
                    Save Plan
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Validation errors */}
          {validationResult && !validationResult.isValid && (
            <Card className='border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'>
              <CardContent className='pt-4'>
                <div className='flex gap-2'>
                  <XCircle className='h-5 w-5 shrink-0 text-red-600' />
                  <div className='space-y-1'>
                    {validationResult.errors.map((e, i) => (
                      <p key={i} className='text-sm text-red-800 dark:text-red-200'>{e}</p>
                    ))}
                    {validationResult.warnings.map((w, i) => (
                      <p key={`w${i}`} className='text-sm text-amber-700 dark:text-amber-300'>⚠ {w}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blockers + Advisories */}
          {recommendations?.blockers && recommendations.blockers.length > 0 && (
            <Card className='border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'>
              <CardContent className='pt-4'>
                <div className='flex gap-2'>
                  <XCircle className='h-5 w-5 shrink-0 text-red-600' />
                  <div className='space-y-1'>
                    {recommendations.blockers.map((b, i) => (
                      <p key={i} className='text-sm text-red-800 dark:text-red-200'>{b}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {recommendations?.advisoryNotes && recommendations.advisoryNotes.length > 0 && (
            <Card className='border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'>
              <CardContent className='pt-4'>
                <div className='flex gap-2'>
                  <AlertTriangle className='h-5 w-5 shrink-0 text-amber-600' />
                  <div className='space-y-1'>
                    {recommendations.advisoryNotes.map((n, i) => (
                      <p key={i} className='text-sm text-amber-800 dark:text-amber-200'>{n}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Three-column planner grid */}
          <div className='grid gap-4 lg:grid-cols-3'>
            {/* Column 1: Eligible List */}
            <Card className='flex flex-col'>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Brain className='h-4 w-4 text-blue-500' />
                  All Eligible Courses
                  {eligible && (
                    <Badge variant='secondary' className='ms-auto'>
                      {eligible.totalEligible}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Prerequisites met — click + to add to Final Plan
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1 p-0'>
                {loadingEligible ? (
                  <div className='flex items-center justify-center py-12'>
                    <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                  </div>
                ) : (
                  <ScrollArea className='h-[480px]'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-8' />
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className='text-right'>Cr</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(eligible?.eligibleCourses ?? []).map((course) => (
                          <EligibleRow
                            key={course.courseCode}
                            course={course}
                            isInPlan={finalPlan.has(course.courseCode)}
                            onToggle={() => toggleDraft(course.courseCode)}
                          />
                        ))}
                        {!eligible?.eligibleCourses?.length && (
                          <TableRow>
                            <TableCell colSpan={4} className='py-8 text-center text-sm text-muted-foreground'>
                              No eligible courses found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Column 2: Heuristic Suggestions */}
            <Card className='flex flex-col'>
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Sparkles className='h-4 w-4 text-purple-500' />
                    Suggested Plan
                  </CardTitle>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={acceptSuggested}
                    disabled={loadingRecs || !recommendations?.recommendedCourses?.length}
                  >
                    Accept All
                  </Button>
                </div>
                <CardDescription>
                  Heuristic ranking: mandatory · unlock · cohort pace
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1 p-0'>
                {loadingRecs ? (
                  <div className='flex items-center justify-center py-12'>
                    <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                  </div>
                ) : (
                  <ScrollArea className='h-[480px] px-4 pb-4'>
                    <div className='space-y-2 pt-1'>
                      {(recommendations?.recommendedCourses ?? []).map((rec) => (
                        <SuggestionCard
                          key={rec.courseCode}
                          rec={rec}
                          isInPlan={finalPlan.has(rec.courseCode)}
                          onToggle={() => toggleDraft(rec.courseCode)}
                        />
                      ))}
                      {recommendations?.notRecommendedButRelevant &&
                        recommendations.notRecommendedButRelevant.length > 0 && (
                          <>
                            <Separator className='my-3' />
                            <p className='px-1 text-xs font-medium text-muted-foreground'>
                              Also relevant (not auto-selected)
                            </p>
                            {recommendations.notRecommendedButRelevant.slice(0, 5).map((rec) => (
                              <SuggestionCard
                                key={rec.courseCode}
                                rec={rec}
                                isInPlan={finalPlan.has(rec.courseCode)}
                                onToggle={() => toggleDraft(rec.courseCode)}
                                dimmed
                              />
                            ))}
                          </>
                        )}
                      {!recommendations?.recommendedCourses?.length && (
                        <p className='py-8 text-center text-sm text-muted-foreground'>
                          No recommendations available
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Column 3: Final Plan */}
            <Card className='flex flex-col'>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <ClipboardList className='h-4 w-4 text-green-500' />
                  Final Plan
                  <Badge variant={finalPlan.size > 0 ? 'default' : 'secondary'} className='ms-auto'>
                    {finalPlan.size} courses · {totalCredits} cr
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Review and edit. Green = saved to DB, amber = draft.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1'>
                {loadingPlan ? (
                  <div className='flex items-center justify-center py-12'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                  </div>
                ) : finalPlan.size === 0 ? (
                  <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                    <ClipboardList className='mb-2 h-10 w-10 opacity-20' />
                    <p className='text-sm'>
                      Add courses from the Eligible list or accept suggestions
                    </p>
                  </div>
                ) : (
                  <ScrollArea className='h-[420px]'>
                    <div className='space-y-1.5'>
                      {[...finalPlan].map((code) => {
                        const isSaved = savedCodes.has(code)
                        const savedItem = existingPlan?.items.find((i) => i.courseCode === code)
                        const recItem = recommendations?.recommendedCourses.find((r) => r.courseCode === code)
                        const eligibleItem = eligible?.eligibleCourses.find((e) => e.courseCode === code)
                        const credits = recItem?.credits ?? eligibleItem?.credits ?? savedItem?.credits ?? 3

                        return (
                          <div
                            key={code}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                              isSaved
                                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
                                : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'
                            }`}
                          >
                            <span className='flex-1 font-mono text-xs font-medium'>{code}</span>
                            <span className='text-xs text-muted-foreground'>{credits}cr</span>
                            {isSaved && <CheckCircle2 className='h-3.5 w-3.5 shrink-0 text-green-600' />}
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-6 w-6 shrink-0'
                              onClick={() => {
                                if (isSaved && savedItem) {
                                  handleRemoveSaved(savedItem.planId)
                                } else {
                                  toggleDraft(code)
                                }
                              }}
                              disabled={isSaving}
                            >
                              <Minus className='h-3 w-3' />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Validation summary */}
                {validationResult && (
                  <div className='mt-3 space-y-1 rounded-lg border bg-muted/40 px-3 py-2'>
                    <p className='text-xs font-medium'>
                      Plan Validation:{' '}
                      <span
                        className={
                          validationResult.isValid ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {validationResult.isValid ? 'Valid' : `${validationResult.errors.length} error(s)`}
                      </span>
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {validationResult.totalCredits} credits total
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function EligibleRow({
  course,
  isInPlan,
  onToggle,
}: {
  course: EligibleCourseDto
  isInPlan: boolean
  onToggle: () => void
}) {
  return (
    <TableRow className={isInPlan ? 'bg-primary/5' : ''}>
      <TableCell className='px-2'>
        <Button
          variant={isInPlan ? 'default' : 'outline'}
          size='icon'
          className='h-6 w-6'
          onClick={onToggle}
          disabled={!course.prerequisitesMet}
        >
          {isInPlan ? <Minus className='h-3 w-3' /> : <Plus className='h-3 w-3' />}
        </Button>
      </TableCell>
      <TableCell className='font-mono text-xs font-medium'>{course.courseCode}</TableCell>
      <TableCell className='max-w-[130px] truncate text-xs text-muted-foreground'>
        {course.courseName ?? '—'}
      </TableCell>
      <TableCell className='text-right text-xs'>{course.credits ?? '—'}</TableCell>
    </TableRow>
  )
}

function SuggestionCard({
  rec,
  isInPlan,
  onToggle,
  dimmed = false,
}: {
  rec: CourseRecommendationDto
  isInPlan: boolean
  onToggle: () => void
  dimmed?: boolean
}) {
  const { label, color } = getRecLabel(rec.recommendationType)
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-2.5 transition-colors ${
        isInPlan
          ? 'border-primary bg-primary/5'
          : dimmed
            ? 'opacity-60'
            : 'hover:bg-muted/50'
      }`}
    >
      <Button
        variant={isInPlan ? 'default' : 'outline'}
        size='icon'
        className='mt-0.5 h-7 w-7 shrink-0'
        onClick={onToggle}
        disabled={!rec.canRegister}
      >
        {isInPlan ? <Minus className='h-3 w-3' /> : <Plus className='h-3 w-3' />}
      </Button>

      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-1'>
          <span className='font-mono text-xs font-semibold'>{rec.courseCode}</span>
          <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${color}`}>
            {label}
          </span>
          {!rec.canRegister && (
            <Badge variant='destructive' className='text-xs'>Blocked</Badge>
          )}
        </div>
        <p className='truncate text-xs text-muted-foreground'>
          {rec.courseName ?? rec.courseCode} — {rec.credits}cr
        </p>

        {rec.reasons.length > 0 && (
          <div className='mt-0.5 flex flex-wrap gap-1'>
            {rec.reasons.map((r, i) => (
              <TooltipProvider key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='inline-flex cursor-default items-center gap-0.5 text-xs text-muted-foreground'>
                      <Info className='h-2.5 w-2.5' />
                      {r}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{r}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {rec.warnings.length > 0 && (
          <p className='mt-0.5 text-xs text-amber-600'>
            <AlertTriangle className='mr-0.5 inline h-3 w-3' />
            {rec.warnings[0]}
          </p>
        )}
      </div>

      <span className='shrink-0 text-xs font-bold tabular-nums text-muted-foreground'>
        {rec.priorityScore}
      </span>
    </div>
  )
}
