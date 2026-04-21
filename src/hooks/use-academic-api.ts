import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPrograms,
  fetchProgramCohorts,
  fetchStudent,
  fetchStudentProfileSummary,
  fetchTranscript,
  fetchStudentAudit,
  fetchProgressByCategory,
  fetchCurriculumStructure,
  fetchEligibleCourses,
  fetchRecommendations,
  fetchStudentPlans,
  fetchAllStudentPlans,
  createPlan,
  addPlanItem,
  removePlanItem,
  updatePlanItem,
  validatePlan,
  searchStudents,
  fetchProgramConcentrations,
  fetchStudentConcentration,
  assignStudentConcentration,
  updateStudentConcentration,
} from '@/lib/api-client'

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
  })
}

export function useProgramCohorts(programCode: string | undefined) {
  return useQuery({
    queryKey: ['program-cohorts', programCode],
    queryFn: () => fetchProgramCohorts(programCode!),
    enabled: !!programCode,
  })
}

export function useStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchStudent(studentId!),
    enabled: !!studentId,
  })
}

export function useStudentProfileSummary(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-profile-summary', studentId],
    queryFn: () => fetchStudentProfileSummary(studentId!),
    enabled: !!studentId,
  })
}

export function useTranscript(studentId: string | undefined) {
  return useQuery({
    queryKey: ['transcript', studentId],
    queryFn: () => fetchTranscript(studentId!),
    enabled: !!studentId,
  })
}

export function useStudentAudit(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-audit', studentId],
    queryFn: () => fetchStudentAudit(studentId!),
    enabled: !!studentId,
  })
}

export function useProgressByCategory(studentId: string | undefined) {
  return useQuery({
    queryKey: ['progress-by-category', studentId],
    queryFn: () => fetchProgressByCategory(studentId!),
    enabled: !!studentId,
  })
}

export function useCurriculumStructure(
  programCode: string | undefined,
  cohortCode: string | undefined
) {
  return useQuery({
    queryKey: ['curriculum-structure', programCode, cohortCode],
    queryFn: () => fetchCurriculumStructure(programCode!, cohortCode!),
    enabled: !!programCode && !!cohortCode,
  })
}

export function useEligibleCourses(studentId: string | undefined) {
  return useQuery({
    queryKey: ['eligible-courses', studentId],
    queryFn: () => fetchEligibleCourses(studentId!),
    enabled: !!studentId,
  })
}

export function useRecommendations(
  studentId: string | undefined,
  params: { targetTermCode: number; minCredits?: number; maxCredits?: number; strategy?: string },
  enabled = true
) {
  return useQuery({
    queryKey: ['recommendations', studentId, params],
    queryFn: () => fetchRecommendations(studentId!, params),
    enabled: !!studentId && !!params.targetTermCode && enabled,
  })
}

export function useStudentPlans(studentId: string | undefined, termCode: number | undefined) {
  return useQuery({
    queryKey: ['student-plans', studentId, termCode],
    queryFn: () => fetchStudentPlans(studentId!, termCode!),
    enabled: !!studentId && !!termCode,
  })
}

export function useValidatePlan(studentId: string | undefined, termCode: number | undefined) {
  return useQuery({
    queryKey: ['validate-plan', studentId, termCode],
    queryFn: () => validatePlan(studentId!, termCode!),
    enabled: !!studentId && !!termCode,
  })
}

export function useSearchStudents(params: {
  studentId?: string
  programCode?: string
  cohortCode?: string
  keyword?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ['search-students', params],
    queryFn: () => searchStudents(params),
    enabled: !!(params.studentId || params.programCode || params.cohortCode || params.keyword),
    placeholderData: (prev) => prev,
  })
}

export function useAllStudentPlans(studentId: string | undefined) {
  return useQuery({
    queryKey: ['all-student-plans', studentId],
    queryFn: () => fetchAllStudentPlans(studentId!),
    enabled: !!studentId,
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, termCode, courseCodes }: { studentId: string; termCode: number; courseCodes: string[] }) =>
      createPlan(studentId, termCode, courseCodes),
    onSuccess: (_, { studentId, termCode }) => {
      qc.invalidateQueries({ queryKey: ['student-plans', studentId, termCode] })
      qc.invalidateQueries({ queryKey: ['all-student-plans', studentId] })
      qc.invalidateQueries({ queryKey: ['validate-plan', studentId, termCode] })
    },
  })
}

export function useAddPlanItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, termCode, courseCode }: { studentId: string; termCode: number; courseCode: string }) =>
      addPlanItem(studentId, termCode, courseCode),
    onSuccess: (_, { studentId, termCode }) => {
      qc.invalidateQueries({ queryKey: ['student-plans', studentId, termCode] })
      qc.invalidateQueries({ queryKey: ['all-student-plans', studentId] })
      qc.invalidateQueries({ queryKey: ['validate-plan', studentId, termCode] })
    },
  })
}

export function useRemovePlanItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, termCode, planId }: { studentId: string; termCode: number; planId: number }) =>
      removePlanItem(studentId, termCode, planId),
    onSuccess: (_, { studentId, termCode }) => {
      qc.invalidateQueries({ queryKey: ['student-plans', studentId, termCode] })
      qc.invalidateQueries({ queryKey: ['all-student-plans', studentId] })
      qc.invalidateQueries({ queryKey: ['validate-plan', studentId, termCode] })
    },
  })
}

export function useUpdatePlanItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      studentId,
      termCode,
      planId,
      body,
    }: {
      studentId: string
      termCode: number
      planId: number
      body: { status?: string; note?: string }
    }) => updatePlanItem(studentId, termCode, planId, body),
    onSuccess: (_, { studentId, termCode }) => {
      qc.invalidateQueries({ queryKey: ['student-plans', studentId, termCode] })
      qc.invalidateQueries({ queryKey: ['all-student-plans', studentId] })
    },
  })
}

export function useProgramConcentrations(programCode: string | undefined) {
  return useQuery({
    queryKey: ['program-concentrations', programCode],
    queryFn: () => fetchProgramConcentrations(programCode!),
    enabled: !!programCode,
  })
}

export function useStudentConcentration(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-concentration', studentId],
    queryFn: () => fetchStudentConcentration(studentId!),
    enabled: !!studentId,
    retry: false,
  })
}

export function useAssignConcentration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      studentId,
      concentrationId,
      approvedTermCode,
    }: {
      studentId: string
      concentrationId: number
      approvedTermCode?: number
    }) => assignStudentConcentration(studentId, concentrationId, approvedTermCode),
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: ['student-concentration', studentId] })
    },
  })
}

export function useUpdateConcentration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      studentId,
      concentrationId,
      approvedTermCode,
    }: {
      studentId: string
      concentrationId: number
      approvedTermCode?: number
    }) => updateStudentConcentration(studentId, concentrationId, approvedTermCode),
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: ['student-concentration', studentId] })
    },
  })
}
