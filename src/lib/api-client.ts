import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token getter injected at app startup by the Keycloak provider wrapper
// (see `src/main.tsx`). It should return a fresh access token from
// `keycloak-js`, silently refreshing it if close to expiry.
// Falls back to localStorage for dev/testing without Keycloak.
let _tokenGetter: (() => Promise<string | null>) | null = null

export function setTokenGetter(getter: () => Promise<string | null>) {
  _tokenGetter = getter
}

apiClient.interceptors.request.use(async (config) => {
  let token: string | null = null
  if (_tokenGetter) {
    token = await _tokenGetter()
  } else {
    token = localStorage.getItem('auth_token')
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  errors: string[]
}

// Programs & Cohorts
export interface ProgramDto {
  programId: number
  programCode: string
  programName: string
  degreeLevel: string | null
  defaultTargetCredits: number | null
}

export interface CohortDto {
  cohortId: number
  cohortCode: string
  startYear: number | null
}

// Students
export interface StudentDto {
  studentId: string
  fullName: string
  programId: number | null
  programCode: string | null
  cohortId: number | null
  cohortCode: string | null
  status: string | null
  englishLevel: number | null
  ieltsScore: number | null
}

export interface StudentProfileSummaryDto {
  studentId: string
  programCode: string | null
  cohortCode: string | null
  totalCompletedCredits: number
  gpa: number | null
  englishLevel: number | null
  ieltsScore: number | null
  lastTermCode: number | null
}

export interface TranscriptItemDto {
  attemptId: number
  courseCode: string
  courseName: string | null
  termCode: number
  attemptNo: number
  credits: number | null
  gradeLetter: string | null
  isCompleted: boolean
}

// Audit
export interface ConcentrationInfoDto {
  code: string | null
  name: string | null
  isSelected: boolean
}

export interface Eligibility300To400Dto {
  isEligible: boolean
  missingReasons: string[]
}

export interface CategoryProgressDto {
  categoryId: number
  categoryName: string
  requiredCredits: number
  earnedCredits: number
  missingCredits: number
  requiredCoursesCompleted: number
  requiredCoursesRemaining: number
}

export interface StudentAuditSummaryDto {
  studentId: string
  programCode: string | null
  cohortCode: string | null
  totalCompletedCredits: number
  completedCredits100to200: number
  completedCredits300to400: number
  requiredCoursesCompleted: number
  requiredCoursesRemaining: number
  electiveCreditsCompleted: number
  electiveCreditsRemaining: number
  concentration: ConcentrationInfoDto
  eligibility300to400: Eligibility300To400Dto
  overallProgressPercent: number
  warnings: string[]
}

export interface StudentAuditDto {
  summary: StudentAuditSummaryDto
  progressByCategory: CategoryProgressDto[]
  missingCourses: string[]
}

// Curriculum Structure
export interface KnowledgeBlockDto {
  blockName: string
  minCreditsRequired: number
  isMandatory: boolean
  description: string | null
}

export interface CurriculumCourseDetailDto {
  courseCode: string
  courseName: string | null
  credits: number | null
  isRequired: boolean
  prereqRule: string | null
}

export interface CurriculumCategoryDetailDto {
  categoryId: number
  categoryName: string
  minCredits: number | null
  sortOrder: number | null
  courses: CurriculumCourseDetailDto[]
}

export interface CurriculumStructureDto {
  curriculumId: number
  programCode: string
  programName: string
  cohortCode: string
  totalCredits: number | null
  knowledgeBlocks: KnowledgeBlockDto[]
  courseMapping: Record<string, string[]>
  categories: CurriculumCategoryDetailDto[]
}

// Eligible Courses
export interface EligibleCourseDto {
  courseCode: string
  courseName: string | null
  credits: number | null
  categoryName: string | null
  isRequired: boolean
  prerequisitesMet: boolean
  blockingReasons: string[]
}

export interface EligibleCoursesResponseDto {
  studentId: string
  eligibleCourses: EligibleCourseDto[]
  totalEligible: number
}

// Recommendations
export interface CourseRecommendationDto {
  courseCode: string
  courseName: string | null
  credits: number
  recommendationType: string
  priorityScore: number
  reasons: string[]
  warnings: string[]
  registrationChannel: string
  canRegister: boolean
}

export interface RecommendationResponseDto {
  studentId: string
  targetTermCode: number
  strategy: string
  recommendedCredits: number
  recommendedCourses: CourseRecommendationDto[]
  notRecommendedButRelevant: CourseRecommendationDto[]
  blockers: string[]
  advisoryNotes: string[]
}

// Plans
export interface PlanItemDto {
  planId: number
  courseCode: string
  termCode: number
  status: string
  note: string | null
  credits: number | null
}

export interface PlanByTermDto {
  studentId: string
  termCode: number
  items: PlanItemDto[]
}

export interface PlanValidationResultDto {
  isValid: boolean
  totalCredits: number
  errors: string[]
  warnings: string[]
}

// Search
export interface StudentSearchResultDto {
  students: StudentDto[]
  totalCount: number
  page: number
  pageSize: number
}

// ==================== API Functions ====================

export async function fetchPrograms() {
  const { data } = await apiClient.get<ApiEnvelope<ProgramDto[]>>('/programs')
  return data.data
}

export async function fetchProgramCohorts(programCode: string) {
  const { data } = await apiClient.get<ApiEnvelope<CohortDto[]>>(`/programs/${programCode}/cohorts`)
  return data.data
}

export async function fetchStudent(studentId: string) {
  const { data } = await apiClient.get<ApiEnvelope<StudentDto>>(`/students/${studentId}`)
  return data.data
}

export async function fetchStudentProfileSummary(studentId: string) {
  const { data } = await apiClient.get<ApiEnvelope<StudentProfileSummaryDto>>(`/students/${studentId}/profile-summary`)
  return data.data
}

export async function fetchTranscript(studentId: string) {
  const { data } = await apiClient.get<ApiEnvelope<TranscriptItemDto[]>>(`/students/${studentId}/transcript`)
  return data.data
}

export async function fetchStudentAudit(studentId: string) {
  const { data } = await apiClient.get<ApiEnvelope<StudentAuditDto>>(`/students/${studentId}/audit`)
  return data.data
}

export async function fetchAuditSummary(studentId: string) {
  const { data } = await apiClient.get<ApiEnvelope<StudentAuditSummaryDto>>(`/students/${studentId}/audit/summary`)
  return data.data
}

export async function fetchProgressByCategory(studentId: string) {
  const { data } = await apiClient.get<ApiEnvelope<CategoryProgressDto[]>>(`/students/${studentId}/audit/progress-by-category`)
  return data.data
}

export async function fetchCurriculumStructure(programCode: string, cohortCode: string) {
  const { data } = await apiClient.get<ApiEnvelope<CurriculumStructureDto>>(`/curriculum/${programCode}/${cohortCode}`)
  return data.data
}

export async function fetchEligibleCourses(studentId: string) {
  const { data } = await apiClient.get<ApiEnvelope<EligibleCoursesResponseDto>>(`/curriculum/students/${studentId}/eligible-courses`)
  return data.data
}

export async function fetchRecommendations(
  studentId: string,
  params: { targetTermCode: number; minCredits?: number; maxCredits?: number; strategy?: string }
) {
  const { data } = await apiClient.get<ApiEnvelope<RecommendationResponseDto>>(
    `/students/${studentId}/recommendations/next-term`,
    { params }
  )
  return data.data
}

export async function fetchStudentPlans(studentId: string, termCode: number) {
  const { data } = await apiClient.get<ApiEnvelope<PlanByTermDto>>(`/students/${studentId}/plans/${termCode}`)
  return data.data
}

export async function createPlan(studentId: string, termCode: number, courseCodes: string[]) {
  const { data } = await apiClient.post<ApiEnvelope<PlanByTermDto>>(
    `/students/${studentId}/plans`,
    { termCode, courseCodes }
  )
  return data.data
}

export async function addPlanItem(studentId: string, termCode: number, courseCode: string) {
  const { data } = await apiClient.post<ApiEnvelope<PlanItemDto>>(
    `/students/${studentId}/plans/${termCode}/items`,
    { courseCode }
  )
  return data.data
}

export async function removePlanItem(studentId: string, termCode: number, planId: number) {
  await apiClient.delete(`/students/${studentId}/plans/${termCode}/items/${planId}`)
}

export async function validatePlan(studentId: string, termCode: number) {
  const { data } = await apiClient.get<ApiEnvelope<PlanValidationResultDto>>(
    `/students/${studentId}/plans/${termCode}/validate`
  )
  return data.data
}

export async function searchStudents(params: {
  studentId?: string
  programCode?: string
  cohortCode?: string
  keyword?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await apiClient.get<ApiEnvelope<StudentSearchResultDto>>(
    '/curriculum/students/search',
    { params }
  )
  return data.data
}
