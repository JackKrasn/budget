import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { incomesApi, plannedIncomesApi } from '@/lib/api'
import type {
  IncomesListParams,
  CreateIncomeRequest,
  UpdateIncomeRequest,
} from '@/lib/api/types'
import { toast } from 'sonner'
import { plannedIncomeKeys } from './use-planned-incomes'

export const incomeKeys = {
  all: ['incomes'] as const,
  lists: () => [...incomeKeys.all, 'list'] as const,
  list: (params?: IncomesListParams) => [...incomeKeys.lists(), params] as const,
  details: () => [...incomeKeys.all, 'detail'] as const,
  detail: (id: string) => [...incomeKeys.details(), id] as const,
}

export function useIncomes(params?: IncomesListParams) {
  return useQuery({
    queryKey: incomeKeys.list(params),
    queryFn: () => incomesApi.list(params),
  })
}

export function useIncome(id: string) {
  return useQuery({
    queryKey: incomeKeys.detail(id),
    queryFn: () => incomesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIncomeRequest) => incomesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      toast.success('Доход создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useUpdateIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncomeRequest }) =>
      incomesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: incomeKeys.detail(id) })
      toast.success('Доход обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useDeleteIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => incomesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      toast.success('Доход удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Создать доход и связать с запланированным доходом
 */
export function useCreateIncomeAndReceive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      incomeData,
      plannedIncomeId,
    }: {
      incomeData: CreateIncomeRequest
      plannedIncomeId: string
    }) => {
      // 1. Создаём фактический доход
      const income = await incomesApi.create(incomeData)

      // 2. Связываем с запланированным доходом
      await plannedIncomesApi.receive(plannedIncomeId, {
        actualIncomeId: income.id,
      })

      return income
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: plannedIncomeKeys.lists() })
      toast.success('Доход получен')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
