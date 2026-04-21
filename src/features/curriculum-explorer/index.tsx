import { useState } from 'react'
import {
  BookOpen,
  Loader2,
  LayoutGrid,
} from 'lucide-react'
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

export function CurriculumExplorer() {
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [selectedCohort, setSelectedCohort] = useState<string>('')

  const { data: programs, isLoading: loadingPrograms } = usePrograms()
  const { data: cohorts, isLoading: loadingCohorts } = useProgramCohorts(selectedProgram || undefined)
  const { data: curriculum, isLoading: loadingCurriculum } = useCurriculumStructure(
    selectedProgram || undefined,
    selectedCohort || undefined
  )

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <BookOpen className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>Curriculum Explorer</h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='space-y-6'>
          <div className='mb-2'>
            <h2 className='text-2xl font-bold tracking-tight'>Curriculum Explorer</h2>
            <p className='text-muted-foreground'>
              Browse and explore knowledge block structures across programs and cohorts.
            </p>
          </div>

          {/* Program & Cohort Selection */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <LayoutGrid className='h-5 w-5' />
                Curriculum Structure
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
                  disabled={loadingPrograms}
                >
                  <SelectTrigger className='w-64'>
                    <SelectValue placeholder={loadingPrograms ? 'Loading programs...' : 'Select Program...'} />
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
                  <SelectTrigger className='w-44'>
                    <SelectValue placeholder={loadingCohorts ? 'Loading...' : 'Select Cohort...'} />
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

              {!selectedProgram && (
                <div className='rounded-lg border border-dashed py-12 text-center'>
                  <BookOpen className='mx-auto mb-3 h-10 w-10 text-muted-foreground/50' />
                  <p className='text-sm font-medium text-muted-foreground'>
                    Select a program to explore its curriculum knowledge blocks
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground/70'>
                    {programs?.length ?? 0} programs available
                  </p>
                </div>
              )}

              {selectedProgram && !selectedCohort && !loadingCohorts && (
                <div className='rounded-lg border border-dashed py-12 text-center'>
                  <LayoutGrid className='mx-auto mb-3 h-10 w-10 text-muted-foreground/50' />
                  <p className='text-sm font-medium text-muted-foreground'>
                    Now select a cohort to load the curriculum structure
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground/70'>
                    {cohorts?.length ?? 0} cohorts available for this program
                  </p>
                </div>
              )}

              {loadingCurriculum && (
                <div className='flex items-center gap-2 py-8 text-sm text-muted-foreground'>
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
                    <div className='mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
                      <span>
                        <span className='font-medium text-foreground'>{curriculum.programName}</span>
                        {' / Cohort '}
                        <span className='font-medium text-foreground'>{curriculum.cohortCode}</span>
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
                        <div key={cat.categoryId} className='rounded-lg border p-4'>
                          <div className='flex items-center justify-between'>
                            <span className='font-semibold'>{cat.categoryName}</span>
                            <div className='flex items-center gap-3'>
                              {cat.minCredits && (
                                <span className='text-sm text-muted-foreground'>
                                  Min: {cat.minCredits} cr
                                </span>
                              )}
                              <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-mono'>
                                {cat.courses.length} courses
                              </span>
                            </div>
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
                              <span className='text-xs text-muted-foreground'>No courses mapped</span>
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
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
