import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as creditsApi from '@/lib/api/credits'
import type { CreditStatus, UUID } from '@/lib/api/credits'

const QUERY_KEYS = {
  credits: (status?: CreditStatus) => ['credits', status] as const,
  credit: (id: UUID) => ['credits', id] as const,
  creditSchedule: (id: UUID) => ['credits', id, 'schedule'] as const,
  creditPayments: (id: UUID) => ['credits', id, 'payments'] as const,
  creditSummary: (id: UUID) => ['credits', id, 'summary'] as const,
  upcomingPayments: (limit: number) => ['credits', 'upcoming', limit] as const,
  allSummary: () => ['credits', 'summary'] as const,
}

/**
 * Hook для получения списка кредитов
 */
export function useCredits(status?: CreditStatus) {
  return useQuery({
    queryKey: QUERY_KEYS.credits(status),
    queryFn: () => creditsApi.getCredits(status),
  })
}

/**
 * Hook для получения конкретного кредита с графиком
 */
export function useCredit(id: UUID) {
  return useQuery({
    queryKey: QUERY_KEYS.credit(id),
    queryFn: () => creditsApi.getCredit(id),
    enabled: !!id,
  })
}

/**
 * Hook для получения графика платежей
 */
export function useCreditSchedule(id: UUID) {
  return useQuery({
    queryKey: QUERY_KEYS.creditSchedule(id),
    queryFn: () => creditsApi.getCreditSchedule(id),
    enabled: !!id,
  })
}

/**
 * Hook для получения истории платежей
 */
export function useCreditPayments(id: UUID) {
  return useQuery({
    queryKey: QUERY_KEYS.creditPayments(id),
    queryFn: () => creditsApi.getCreditPayments(id),
    enabled: !!id,
  })
}

/**
 * Hook для получения сводки по кредиту
 */
export function useCreditSummary(id: UUID) {
  return useQuery({
    queryKey: QUERY_KEYS.creditSummary(id),
    queryFn: () => creditsApi.getCreditSummary(id),
    enabled: !!id,
  })
}

/**
 * Hook для получения ближайших платежей
 */
export function useUpcomingPayments(limit = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.upcomingPayments(limit),
    queryFn: () => creditsApi.getUpcomingPayments(limit),
  })
}

/**
 * Hook для получения общей сводки
 */
export function useAllCreditsSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.allSummary(),
    queryFn: () => creditsApi.getAllCreditsSummary(),
  })
}

/**
 * Hook для создания кредита
 */
export function useCreateCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: creditsApi.createCredit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      toast.success('Кредит успешно создан')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при создании кредита: ${error.message}`)
    },
  })
}

/**
 * Hook для обновления кредита
 */
export function useUpdateCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: creditsApi.UpdateCreditRequest }) =>
      creditsApi.updateCredit(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credit(id) })
      toast.success('Кредит успешно обновлён')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при обновлении кредита: ${error.message}`)
    },
  })
}

/**
 * Hook для удаления кредита
 */
export function useDeleteCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: creditsApi.deleteCredit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      toast.success('Кредит успешно удалён')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при удалении кредита: ${error.message}`)
    },
  })
}

/**
 * Hook для пересчёта графика платежей
 */
export function useRegenerateCreditSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: creditsApi.regenerateCreditSchedule,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credit(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditSchedule(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditSummary(id) })
      toast.success('График платежей пересчитан')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при пересчёте графика: ${error.message}`)
    },
  })
}
