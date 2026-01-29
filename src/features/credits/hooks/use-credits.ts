import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as creditsApi from '@/lib/api/credits'
import type { CreditStatus, UUID } from '@/lib/api/credits'
import type { Budget } from '@/lib/api/types'
import { budgetsApi } from '@/lib/api'
import { plannedExpenseKeys } from '@/features/budget/hooks/use-planned-expenses'

const QUERY_KEYS = {
  credits: (status?: CreditStatus) => ['credits', status] as const,
  credit: (id: UUID) => ['credits', id] as const,
  creditSchedule: (id: UUID) => ['credits', id, 'schedule'] as const,
  creditPayments: (id: UUID) => ['credits', id, 'payments'] as const,
  creditSummary: (id: UUID) => ['credits', id, 'summary'] as const,
  earlyPayments: (id: UUID) => ['credits', id, 'early-payments'] as const,
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
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] })

      // Генерируем запланированные расходы из графика платежей
      try {
        // Получаем текущий бюджет напрямую
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        // Ищем любые бюджеты (включая черновики)
        const response = await budgetsApi.list({ year })

        // Сначала пробуем найти бюджет для текущего месяца
        let targetBudget = response.data.find((b: Budget) => b.month === month)

        // Если нет бюджета для текущего месяца, берём первый доступный бюджет
        if (!targetBudget && response.data.length > 0) {
          targetBudget = response.data[0]
        }

        if (targetBudget?.id) {
          const result = await budgetsApi.generateCreditPayments(targetBudget.id)
          queryClient.invalidateQueries({ queryKey: plannedExpenseKeys.lists() })

          const budgetMonth = new Date(year, targetBudget.month - 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
          toast.success(`Кредит создан. Добавлено ${result.generated} запланированных платежей в бюджет ${budgetMonth}`)
        } else {
          toast.success('Кредит успешно создан. Создайте бюджет для генерации запланированных платежей.')
        }
      } catch (error) {
        toast.error(`Кредит создан, но не удалось создать запланированные платежи: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      }
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

/**
 * Hook для обновления платежа в графике (ручная корректировка)
 */
export function useUpdateScheduleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      creditId,
      scheduleId,
      data,
    }: {
      creditId: UUID
      scheduleId: UUID
      data: creditsApi.UpdateScheduleItemRequest
    }) => creditsApi.updateScheduleItem(creditId, scheduleId, data),
    onSuccess: (_, { creditId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credit(creditId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditSchedule(creditId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditSummary(creditId) })
      toast.success('Платёж обновлён')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при обновлении платежа: ${error.message}`)
    },
  })
}

/**
 * Hook для получения списка частично-досрочных платежей
 */
export function useEarlyPayments(creditId: UUID) {
  return useQuery({
    queryKey: QUERY_KEYS.earlyPayments(creditId),
    queryFn: () => creditsApi.getEarlyPayments(creditId),
    enabled: !!creditId,
  })
}

/**
 * Hook для создания частично-досрочного платежа
 */
export function useCreateEarlyPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      creditId,
      data,
    }: {
      creditId: UUID
      data: creditsApi.CreateEarlyPaymentRequest
    }) => creditsApi.createEarlyPayment(creditId, data),
    onSuccess: (_, { creditId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credit(creditId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditSchedule(creditId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditSummary(creditId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.earlyPayments(creditId) })
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      toast.success('Частично-досрочный платёж внесён')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при внесении ЧДП: ${error.message}`)
    },
  })
}

/**
 * Hook для удаления частично-досрочного платежа
 */
export function useDeleteEarlyPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      creditId,
      earlyPaymentId,
    }: {
      creditId: UUID
      earlyPaymentId: UUID
    }) => creditsApi.deleteEarlyPayment(creditId, earlyPaymentId),
    onSuccess: (_, { creditId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credit(creditId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.earlyPayments(creditId) })
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      toast.success('Частично-досрочный платёж удалён. Не забудьте пересчитать график.')
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при удалении ЧДП: ${error.message}`)
    },
  })
}
