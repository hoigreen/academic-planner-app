import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueries } from '@tanstack/react-query'
import {
  GraduationCap,
  Users,
  BookOpen,
  Search,
  ArrowRight,
  Loader2,
  LayoutGrid,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { usePrograms } from '@/hooks/use-academic-api'
import { fetchProgramCohorts } from '@/lib/api-client'

const CHART_COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(262, 83%, 58%)',
  'hsl(32, 95%, 44%)',
  'hsl(346, 84%, 61%)',
  'hsl(187, 85%, 43%)',
]

export function Dashboard() {
  const navigate = useNavigate()
  const [quickSearchId, setQuickSearchId] = useState('')

  const { data: programs, isLoading: loadingPrograms } = usePrograms()

  // Fetch cohorts for every program in parallel to build chart data
  const cohortQueries = useQueries({
    queries: (programs ?? []).map((p) => ({
      queryKey: ['program-cohorts', p.programCode],
      queryFn: () => fetchProgramCohorts(p.programCode),
      enabled: !!programs,
    })),
  })

  const allCohortsFetched = cohortQueries.every((q) => !q.isLoading)

  const cohortsPerProgram = (programs ?? []).map((p, i) => ({
    program: p.programCode,
    programName: p.programName,
    cohorts: cohortQueries[i]?.data?.length ?? 0,
  }))

  const totalCohorts = cohortsPerProgram.reduce((sum, p) => sum + p.cohorts, 0)

  // Pie chart data — share of cohorts per program
  const pieData = cohortsPerProgram
    .filter((p) => p.cohorts > 0)
    .map((p, i) => ({
      name: p.program,
      value: p.cohorts,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))

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
            <h2 className='text-2xl font-bold tracking-tight'>Overview</h2>
            <p className='text-muted-foreground'>
              Academic programs summary and key metrics at a glance.
            </p>
          </div>

          {/* Summary Stat Cards */}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {/* Active Programs */}
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
                    <div className='text-3xl font-bold'>{programs?.length ?? 0}</div>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Academic programs registered
                    </p>
                    {programs && programs.length > 0 && (
                      <div className='mt-2 flex flex-wrap gap-1'>
                        {programs.slice(0, 4).map((p) => (
                          <span
                            key={p.programCode}
                            className='rounded-md bg-muted px-2 py-0.5 font-mono text-xs'
                          >
                            {p.programCode}
                          </span>
                        ))}
                        {programs.length > 4 && (
                          <span className='rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                            +{programs.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Total Cohorts */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Total Cohorts</CardTitle>
                <TrendingUp className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                {!allCohortsFetched ? (
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                ) : (
                  <>
                    <div className='text-3xl font-bold'>{totalCohorts}</div>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Cohorts across all programs
                    </p>
                    <p className='mt-2 text-xs text-muted-foreground'>
                      Avg{' '}
                      <span className='font-medium text-foreground'>
                        {programs?.length
                          ? (totalCohorts / programs.length).toFixed(1)
                          : '0'}
                      </span>{' '}
                      cohorts per program
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Students Quick Access */}
            <Card
              className='cursor-pointer transition-colors hover:bg-muted/50'
              onClick={() => navigate({ to: '/students' })}
            >
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Students</CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Search by ID, name, program, or cohort. View academic progress and audit results.
                </p>
                <Button variant='link' className='mt-2 h-auto p-0 text-sm'>
                  Browse Students <ArrowRight className='ml-1 h-3 w-3' />
                </Button>
              </CardContent>
            </Card>
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

          {/* Charts Row */}
          <div className='grid gap-4 lg:grid-cols-5'>
            {/* Cohorts per Program — Bar Chart */}
            <Card className='lg:col-span-3'>
              <CardHeader>
                <CardTitle>Cohorts per Program</CardTitle>
                <CardDescription>
                  Number of cohorts registered under each academic program
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!allCohortsFetched || loadingPrograms ? (
                  <div className='flex h-48 items-center justify-center'>
                    <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                  </div>
                ) : cohortsPerProgram.length === 0 ? (
                  <div className='flex h-48 items-center justify-center text-sm text-muted-foreground'>
                    No program data available
                  </div>
                ) : (
                  <ResponsiveContainer width='100%' height={220}>
                    <BarChart
                      data={cohortsPerProgram}
                      margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                      <XAxis
                        dataKey='program'
                        tick={{ fontSize: 12 }}
                        className='fill-muted-foreground'
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                        className='fill-muted-foreground'
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, _name: string, props) => [
                          `${value} cohort${value !== 1 ? 's' : ''}`,
                          props.payload.programName,
                        ]}
                      />
                      <Bar dataKey='cohorts' radius={[4, 4, 0, 0]}>
                        {cohortsPerProgram.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Cohort Distribution — Pie Chart */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle>Cohort Distribution</CardTitle>
                <CardDescription>Share of cohorts by program</CardDescription>
              </CardHeader>
              <CardContent>
                {!allCohortsFetched || loadingPrograms ? (
                  <div className='flex h-48 items-center justify-center'>
                    <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                  </div>
                ) : pieData.length === 0 ? (
                  <div className='flex h-48 items-center justify-center text-sm text-muted-foreground'>
                    No cohort data yet
                  </div>
                ) : (
                  <ResponsiveContainer width='100%' height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx='50%'
                        cy='45%'
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey='value'
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: '8px' }}
                        formatter={(value: number) => [
                          `${value} cohort${value !== 1 ? 's' : ''}`,
                        ]}
                      />
                      <Legend
                        iconType='circle'
                        iconSize={8}
                        formatter={(value) => (
                          <span style={{ fontSize: 11 }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Navigation */}
          <div className='grid gap-4 sm:grid-cols-2'>
            <Card
              className='cursor-pointer transition-colors hover:bg-muted/50'
              onClick={() => navigate({ to: '/curriculum' })}
            >
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Curriculum Explorer</CardTitle>
                <LayoutGrid className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Browse knowledge block structures, categories, and course mappings for any program and cohort.
                </p>
                <Button variant='link' className='mt-2 h-auto p-0 text-sm'>
                  Explore Curriculum <ArrowRight className='ml-1 h-3 w-3' />
                </Button>
              </CardContent>
            </Card>

            <Card
              className='cursor-pointer transition-colors hover:bg-muted/50'
              onClick={() => navigate({ to: '/students' })}
            >
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Student Roster</CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  View all students, filter by program or cohort, and access individual academic roadmaps.
                </p>
                <Button variant='link' className='mt-2 h-auto p-0 text-sm'>
                  View Students <ArrowRight className='ml-1 h-3 w-3' />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
