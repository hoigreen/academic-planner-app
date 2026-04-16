import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  GraduationCap,
  Users,
  BookOpen,
  Search,
  ArrowRight,
  Loader2,
  Upload,
  LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { CurriculumBlockAccordion } from '@/components/curriculum/CurriculumBlockAccordion'
import { usePrograms, useProgramCohorts, useCurriculumStructure } from '@/hooks/use-academic-api'

export function Dashboard() {
  const navigate = useNavigate()
  const [quickSearchId, setQuickSearchId] = useState('')

  // Curriculum explorer state
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [selectedCohort, setSelectedCohort] = useState<string>('')

  const { data: programs, isLoading: loadingPrograms } = usePrograms()
  const { data: cohorts, isLoading: loadingCohorts } = useProgramCohorts(selectedProgram || undefined)
  const { data: curriculum, isLoading: loadingCurriculum } = useCurriculumStructure(
    selectedProgram || undefined,
    selectedCohort || undefined
  )

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault()
    if (quickSearchId.trim()) {
      navigate({
        to: '/students/$studentId',
        params: { studentId: quickSearchId.trim() },
      })
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <GraduationCap className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>Advisor Dashboard</h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='space-y-6'>
          <div className='mb-2'>
            <h2 className='text-2xl font-bold tracking-tight'>
              Student Learning Roadmap System
            </h2>
            <p className='text-muted-foreground'>
              Manage and consult student academic roadmaps powered by ORDBMS knowledge blocks.
            </p>
          </div>

          {/* Quick Student Lookup */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Search className='h-5 w-5' />
                Quick Student Lookup
              </CardTitle>
              <CardDescription>
                Enter a student ID to jump directly to their academic profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickLookup} className='flex gap-3'>
                <Input
                  placeholder='Enter Student ID (e.g., 2200001234)...'
                  value={quickSearchId}
                  onChange={(e) => setQuickSearchId(e.target.value)}
                  className='max-w-sm'
                />
                <Button type='submit'>
                  <ArrowRight className='mr-2 h-4 w-4' />
                  View Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <Card
              className='cursor-pointer transition-colors hover:bg-muted/50'
              onClick={() => navigate({ to: '/students' })}
            >
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Student Search</CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Search students by ID, name, program, or cohort. View academic progress and audit results.
                </p>
                <Button variant='link' className='mt-2 h-auto p-0 text-sm'>
                  Go to Search <ArrowRight className='ml-1 h-3 w-3' />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Active Programs</CardTitle>
                <BookOpen className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                {loadingPrograms ? (
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                ) : (
                  <>
                    <div className='text-2xl font-bold'>{programs?.length ?? 0}</div>
                    <p className='text-xs text-muted-foreground'>
                      Academic programs available
                    </p>
                    {programs && programs.length > 0 && (
                      <div className='mt-2 flex flex-wrap gap-1'>
                        {programs.slice(0, 5).map((p) => (
                          <span
                            key={p.programCode}
                            className='rounded-md bg-muted px-2 py-0.5 text-xs font-mono'
                          >
                            {p.programCode}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Curriculum Import</CardTitle>
                <Upload className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Upload an Excel (.xlsx) file to import curriculum blocks and courses via the ORDBMS pipeline.
                </p>
                <div className='mt-2 flex flex-wrap gap-1 text-xs'>
                  <span className='rounded-full bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                    knowledge_block[]
                  </span>
                  <span className='rounded-full bg-purple-100 px-2 py-0.5 text-purple-800 dark:bg-purple-900 dark:text-purple-200'>
                    JSONB course_mapping
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dynamic Curriculum Structure Explorer */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <LayoutGrid className='h-5 w-5' />
                Curriculum Structure Explorer
              </CardTitle>
              <CardDescription>
                Select a program and cohort to view the knowledge_block[] structure stored in ORDBMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-4 flex flex-wrap gap-3'>
                <Select
                  value={selectedProgram}
                  onValueChange={(v) => {
                    setSelectedProgram(v)
                    setSelectedCohort('')
                  }}
                >
                  <SelectTrigger className='w-56'>
                    <SelectValue placeholder='Select Program...' />
                  </SelectTrigger>
                  <SelectContent>
                    {programs?.map((p) => (
                      <SelectItem key={p.programCode} value={p.programCode}>
                        {p.programCode} — {p.programName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCohort}
                  onValueChange={setSelectedCohort}
                  disabled={!selectedProgram || loadingCohorts}
                >
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Select Cohort...' />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts?.map((c) => (
                      <SelectItem key={c.cohortCode} value={c.cohortCode}>
                        {c.cohortCode} {c.startYear ? `(${c.startYear})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loadingCurriculum && (
                <div className='flex items-center gap-2 py-4 text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Loading curriculum structure...
                </div>
              )}

              {curriculum && !loadingCurriculum && (
                <Tabs defaultValue='blocks'>
                  <TabsList className='mb-4'>
                    <TabsTrigger value='blocks'>
                      Knowledge Blocks
                      <span className='ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-mono'>
                        {curriculum.knowledgeBlocks.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value='categories'>
                      Categories
                      <span className='ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-mono'>
                        {curriculum.categories.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value='blocks'>
                    <div className='mb-3 flex items-center gap-4 text-sm text-muted-foreground'>
                      <span>
                        <span className='font-medium text-foreground'>
                          {curriculum.programName}
                        </span>{' '}
                        / Cohort{' '}
                        <span className='font-medium text-foreground'>
                          {curriculum.cohortCode}
                        </span>
                      </span>
                      {curriculum.totalCredits && (
                        <span className='rounded-full bg-muted px-2 py-0.5 text-xs'>
                          {curriculum.totalCredits} total credits
                        </span>
                      )}
                    </div>
                    <CurriculumBlockAccordion
                      knowledgeBlocks={curriculum.knowledgeBlocks}
                      courseMapping={curriculum.courseMapping}
                      courseDetails={curriculum.categories.flatMap((cat) => cat.courses)}
                      defaultOpenBlocks={[curriculum.knowledgeBlocks[0]?.blockName]}
                    />
                  </TabsContent>

                  <TabsContent value='categories'>
                    <div className='space-y-3'>
                      {curriculum.categories.map((cat) => (
                        <div
                          key={cat.categoryId}
                          className='rounded-lg border p-4'
                        >
                          <div className='flex items-center justify-between'>
                            <span className='font-semibold'>{cat.categoryName}</span>
                            {cat.minCredits && (
                              <span className='text-sm text-muted-foreground'>
                                Min: {cat.minCredits} cr
                              </span>
                            )}
                          </div>
                          <div className='mt-2 flex flex-wrap gap-1.5'>
                            {cat.courses.map((c) => (
                              <span
                                key={c.courseCode}
                                className='rounded-md bg-muted px-2 py-0.5 font-mono text-xs'
                              >
                                {c.courseCode}
                              </span>
                            ))}
                            {cat.courses.length === 0 && (
                              <span className='text-xs text-muted-foreground'>
                                No courses mapped
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {!curriculum && selectedCohort && !loadingCurriculum && (
                <p className='text-sm text-muted-foreground'>
                  No curriculum structure found. Import one via Excel or sync from requirements.
                </p>
              )}

              {!selectedProgram && (
                <p className='text-sm text-muted-foreground'>
                  Select a program above to explore its curriculum knowledge blocks.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
