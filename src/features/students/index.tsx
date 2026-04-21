import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Search,
  GraduationCap,
  Users,
  ChevronRight,
  Loader2,
  X,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useSearchStudents, usePrograms, useProgramCohorts } from '@/hooks/use-academic-api'

export function StudentSearch() {
  const navigate = useNavigate()
  const [searchId, setSearchId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [programCode, setProgramCode] = useState<string>('')
  const [cohortCode, setCohortCode] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data: programs } = usePrograms()
  const { data: cohorts } = useProgramCohorts(programCode || undefined)

  const { data: searchResult, isLoading } = useSearchStudents({
    studentId: searchId || undefined,
    keyword: keyword || undefined,
    programCode: programCode || undefined,
    cohortCode: cohortCode || undefined,
    page,
    pageSize: 20,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <GraduationCap className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>Student Search</h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Search className='h-5 w-5' />
                Search Students
              </CardTitle>
              <CardDescription>
                Find students by ID, name, or program to view their academic progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className='flex flex-wrap gap-3'>
                <Input
                  placeholder='Student ID...'
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className='w-40'
                />
                <Input
                  placeholder='Name keyword...'
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className='w-44'
                />
                <Select
                  value={programCode}
                  onValueChange={(v) => {
                    setProgramCode(v === 'all' ? '' : v)
                    setCohortCode('')
                  }}
                >
                  <SelectTrigger className='w-44'>
                    <SelectValue placeholder='All Programs' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Programs</SelectItem>
                    {programs?.map((p) => (
                      <SelectItem key={p.programCode} value={p.programCode}>
                        {p.programCode} — {p.programName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {programCode && (
                  <Select
                    value={cohortCode}
                    onValueChange={(v) => setCohortCode(v === 'all' ? '' : v)}
                  >
                    <SelectTrigger className='w-36'>
                      <SelectValue placeholder='All Cohorts' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Cohorts</SelectItem>
                      {cohorts?.map((c) => (
                        <SelectItem key={c.cohortCode} value={c.cohortCode}>
                          {c.cohortCode}
                          {c.startYear ? ` (${c.startYear})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button type='submit' disabled={isLoading}>
                  {isLoading
                    ? <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    : <Search className='mr-2 h-4 w-4' />
                  }
                  Search
                </Button>

                {(searchId || keyword || programCode || cohortCode) && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => {
                      setSearchId('')
                      setKeyword('')
                      setProgramCode('')
                      setCohortCode('')
                      setPage(1)
                    }}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Students
                {searchResult && (
                  <Badge variant='secondary'>{searchResult.totalCount} found</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
              ) : searchResult && searchResult.students.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Cohort</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IELTS</TableHead>
                        <TableHead className='w-10' />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResult.students.map((student) => (
                        <TableRow
                          key={student.studentId}
                          className='cursor-pointer hover:bg-muted/50'
                          onClick={() =>
                            navigate({
                              to: '/students/$studentId',
                              params: { studentId: student.studentId },
                            })
                          }
                        >
                          <TableCell className='font-mono font-medium'>
                            {student.studentId}
                          </TableCell>
                          <TableCell>{student.fullName}</TableCell>
                          <TableCell>
                            <Badge variant='outline'>{student.programCode ?? '—'}</Badge>
                          </TableCell>
                          <TableCell>{student.cohortCode ?? '—'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={student.status === 'active' ? 'default' : 'secondary'}
                            >
                              {student.status ?? 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{student.ieltsScore ?? '—'}</TableCell>
                          <TableCell>
                            <ChevronRight className='h-4 w-4 text-muted-foreground' />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {searchResult.totalCount > 20 && (
                    <div className='mt-4 flex items-center justify-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className='text-sm text-muted-foreground'>
                        Page {page} of {Math.ceil(searchResult.totalCount / 20)}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={page * 20 >= searchResult.totalCount}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                  <Users className='mb-2 h-12 w-12 opacity-30' />
                  <p>No students found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
