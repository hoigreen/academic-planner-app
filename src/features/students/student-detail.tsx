import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { CurriculumBlockAccordion } from '@/components/curriculum/CurriculumBlockAccordion'
import {
  useStudent,
  useStudentAudit,
  useCurriculumStructure,
  useTranscript,
  useEligibleCourses,
} from '@/hooks/use-academic-api'
import { ProgressRing } from './components/progress-ring'

export function StudentDetail({ studentId }: { studentId: string }) {
  const { data: student, isLoading: loadingStudent } = useStudent(studentId)
  const { data: audit, isLoading: loadingAudit } = useStudentAudit(studentId)
  const { data: transcript } = useTranscript(studentId)
  const { data: eligibleData } = useEligibleCourses(studentId)
  const { data: curriculum } = useCurriculumStructure(
    student?.programCode ?? undefined,
    student?.cohortCode ?? undefined
  )

  const completedSet = useMemo(() => {
    const set = new Set<string>()
    if (audit?.missingCourses) {
      // completed = all required courses NOT in missing
      curriculum?.categories.forEach((cat) =>
        cat.courses.forEach((c) => {
          if (!audit.missingCourses.includes(c.courseCode))
            set.add(c.courseCode.toUpperCase())
        })
      )
    }
    return set
  }, [audit, curriculum])

  const eligibleSet = useMemo(
    () => new Set((eligibleData?.eligibleCourses ?? []).map((e) => e.courseCode.toUpperCase())),
    [eligibleData]
  )

  if (loadingStudent || loadingAudit) {
    return (
      <>
        <Header>
          <div className='flex items-center gap-2'>
            <GraduationCap className='h-5 w-5' />
            <h1 className='text-lg font-semibold'>Loading...</h1>
          </div>
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='flex items-center justify-center py-24'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        </Main>
      </>
    )
  }

  if (!student) {
    return (
      <>
        <Header>
          <Link to='/students'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
          </Link>
        </Header>
        <Main>
          <div className='flex flex-col items-center justify-center py-24 text-muted-foreground'>
            <XCircle className='mb-2 h-12 w-12' />
            <p>Student not found</p>
          </div>
        </Main>
      </>
    )
  }

  const summary = audit?.summary

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <Link to='/students'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <GraduationCap className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>
            {student.fullName}{' '}
            <span className='font-mono text-muted-foreground'>({student.studentId})</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <Link to='/planner/$studentId' params={{ studentId }}>
            <Button>
              <BookOpen className='mr-2 h-4 w-4' />
              Plan Next Term
            </Button>
          </Link>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='space-y-6'>
          {/* Student Info Cards */}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Overall Progress</CardTitle>
                <TrendingUp className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-4'>
                  <ProgressRing percent={summary?.overallProgressPercent ?? 0} size={48} />
                  <div>
                    <div className='text-2xl font-bold'>
                      {summary?.overallProgressPercent?.toFixed(1) ?? 0}%
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {summary?.totalCompletedCredits ?? 0} credits completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Required Courses</CardTitle>
                <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {summary?.requiredCoursesCompleted ?? 0}
                  <span className='text-base font-normal text-muted-foreground'>
                    {' '}/ {(summary?.requiredCoursesCompleted ?? 0) + (summary?.requiredCoursesRemaining ?? 0)}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground'>
                  {summary?.requiredCoursesRemaining ?? 0} remaining
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Program / Cohort</CardTitle>
                <GraduationCap className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{student.programCode ?? '—'}</div>
                <p className='text-xs text-muted-foreground'>
                  Cohort: {student.cohortCode ?? '—'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Level 300-400</CardTitle>
                {summary?.eligibility300to400.isEligible ? (
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                ) : (
                  <AlertTriangle className='h-4 w-4 text-amber-500' />
                )}
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {summary?.eligibility300to400.isEligible ? 'Eligible' : 'Not Yet'}
                </div>
                <p className='text-xs text-muted-foreground'>
                  IELTS: {student.ieltsScore ?? '—'} | Eng Level: {student.englishLevel ?? '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Warnings */}
          {summary?.warnings && summary.warnings.length > 0 && (
            <Card className='border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'>
              <CardContent className='pt-4'>
                <div className='flex gap-2'>
                  <AlertTriangle className='h-5 w-5 shrink-0 text-amber-600' />
                  <div className='space-y-1'>
                    {summary.warnings.map((w, i) => (
                      <p key={i} className='text-sm text-amber-800 dark:text-amber-200'>{w}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dynamic Tabs from Knowledge Blocks / Categories */}
          <Tabs defaultValue='progress'>
            <div className='w-full overflow-x-auto pb-2'>
              <TabsList>
                <TabsTrigger value='progress'>Progress by Category</TabsTrigger>
                <TabsTrigger value='curriculum'>Curriculum Structure</TabsTrigger>
                <TabsTrigger value='transcript'>Transcript</TabsTrigger>
                <TabsTrigger value='missing'>Missing Courses</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value='progress' className='space-y-4'>
              {audit?.progressByCategory && audit.progressByCategory.length > 0 ? (
                <Accordion type='multiple' className='w-full'>
                  {audit.progressByCategory.map((cat) => {
                    const percent =
                      cat.requiredCredits > 0
                        ? Math.min(100, (cat.earnedCredits / cat.requiredCredits) * 100)
                        : 0
                    return (
                      <AccordionItem key={cat.categoryId} value={String(cat.categoryId)}>
                        <AccordionTrigger className='hover:no-underline'>
                          <div className='flex w-full items-center justify-between pe-4'>
                            <span className='font-medium'>{cat.categoryName}</span>
                            <div className='flex items-center gap-3'>
                              <div className='hidden w-32 sm:block'>
                                <div className='h-2 w-full rounded-full bg-muted'>
                                  <div
                                    className='h-2 rounded-full bg-primary transition-all'
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                              <Badge variant={percent >= 100 ? 'default' : 'secondary'}>
                                {cat.earnedCredits}/{cat.requiredCredits} credits
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className='grid gap-2 ps-4 text-sm'>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Required courses completed:</span>
                              <span className='font-medium'>
                                {cat.requiredCoursesCompleted}/{cat.requiredCoursesCompleted + cat.requiredCoursesRemaining}
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Credits earned:</span>
                              <span className='font-medium'>{cat.earnedCredits}</span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Credits remaining:</span>
                              <span className='font-medium text-destructive'>{cat.missingCredits}</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              ) : (
                <p className='text-sm text-muted-foreground'>No category data available</p>
              )}
            </TabsContent>

            <TabsContent value='curriculum' className='space-y-4'>
              {curriculum ? (
                <div className='space-y-4'>
                  <div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
                    <span>
                      <span className='font-semibold text-foreground'>{curriculum.programName}</span>{' '}
                      / Cohort{' '}
                      <span className='font-semibold text-foreground'>{curriculum.cohortCode}</span>
                    </span>
                    {curriculum.totalCredits && (
                      <Badge variant='outline'>{curriculum.totalCredits} total credits</Badge>
                    )}
                  </div>
                  <CurriculumBlockAccordion
                    knowledgeBlocks={curriculum.knowledgeBlocks}
                    courseMapping={curriculum.courseMapping}
                    courseDetails={curriculum.categories.flatMap((cat) => cat.courses)}
                    completedCourses={completedSet}
                    eligibleCourses={eligibleSet}
                    defaultOpenBlocks={[curriculum.knowledgeBlocks[0]?.blockName]}
                  />
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No curriculum structure available for this student&apos;s program
                </p>
              )}
            </TabsContent>

            <TabsContent value='transcript' className='space-y-4'>
              {transcript && transcript.length > 0 ? (
                <Card>
                  <CardContent className='pt-4'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Term</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Course Name</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transcript.map((item) => (
                          <TableRow key={item.attemptId}>
                            <TableCell className='font-mono text-sm'>{item.termCode}</TableCell>
                            <TableCell className='font-mono text-sm'>{item.courseCode}</TableCell>
                            <TableCell>{item.courseName ?? '—'}</TableCell>
                            <TableCell>{item.credits ?? '—'}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.gradeLetter && ['A', 'A-', 'B+', 'B', 'B-'].includes(item.gradeLetter)
                                    ? 'default'
                                    : item.gradeLetter === 'F'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {item.gradeLetter ?? '—'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.isCompleted ? (
                                <CheckCircle2 className='h-4 w-4 text-green-500' />
                              ) : (
                                <XCircle className='h-4 w-4 text-muted-foreground' />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <p className='text-sm text-muted-foreground'>No transcript data available</p>
              )}
            </TabsContent>

            <TabsContent value='missing' className='space-y-4'>
              {audit?.missingCourses && audit.missingCourses.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Missing Required Courses</CardTitle>
                    <CardDescription>
                      {audit.missingCourses.length} courses remaining to complete
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='flex flex-wrap gap-2'>
                      {audit.missingCourses.map((code) => (
                        <Badge key={code} variant='destructive' className='font-mono text-sm'>
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className='flex items-center gap-2 pt-4'>
                    <CheckCircle2 className='h-5 w-5 text-green-500' />
                    <span className='text-sm'>All required courses completed!</span>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
