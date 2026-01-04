import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { plannedIncomesApi, budgetsApi } from '@/lib/api'
import type {
  PlannedIncomesListParams,
  CreatePlannedIncomeRequest,
  UpdatePlannedIncomeRequest,
  ReceivePlannedIncomeRequest,
} from '@/lib/api/types'
import { toast } from 'sonner'
import { budgetKeys } from './use-budgets'

export const plannedIncomeKeys = {
  all: ['planned-incomes'] as const,
  lists: () => [...plannedIncomeKeys.all, 'list'] as const,
  list: (params?: PlannedIncomesListParams) =>
    [...plannedIncomeKeys.lists(), params] as const,
  details: () => [...plannedIncomeKeys.all, 'detail'] as const,
  detail: (id: string) => [...plannedIncomeKeys.details(), id] as const,
  upcoming: (from?: string, to?: string) =>
    [...plannedIncomeKeys.all, 'upcoming', from, to] as const,
}

export function usePlannedIncomes(params?: PlannedIncomesListParams) {
  return useQuery({
    queryKey: plannedIncomeKeys.list(params),
    queryFn: () => plannedIncomesApi.list(params),
    enabled: params?.budgetId !== undefined,
  })
}

export function usePlannedIncome(id: string) {
  return useQuery({
    queryKey: plannedIncomeKeys.detail(id),
    queryFn: () => plannedIncomesApi.get(id),
    enabled: !!id,
  })
}

export function useUpcomingPlannedIncomes(from?: string, to?: string) {
  return useQuery({
    queryKey: plannedIncomeKeys.upcoming(from, to),
    queryFn: () => plannedIncomesApi.getUpcoming({ from, to }),
    enabled: !!from && !!to,
  })
}

export function useCreatePlannedIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePlannedIncomeRequest) =>
      plannedIncomesApi.create(data),
    onSuccess: (_, { budgetId }) => {
      queryClient.invalidateQueries({ queryKey: plannedIncomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(budgetId) })
      toast.success('Запланированный доход создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useUpdatePlannedIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdatePlannedIncomeRequest
    }) => plannedIncomesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: plannedIncomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: plannedIncomeKeys.detail(id) })
      toast.success('Доход обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useDeletePlannedIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => plannedIncomesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannedIncomeKeys.lists() })
      toast.success('Доход удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useReceivePlannedIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: ReceivePlannedIncomeRequest
    }) => plannedIncomesApi.receive(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannedIncomeKeys.lists() })
      toast.success('Доход получен')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useSkipPlannedIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => plannedIncomesApi.skip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannedIncomeKeys.lists() })
      toast.success('Доход пропущен')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useGeneratePlannedIncomes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (budgetId: string) => budgetsApi.generatePlannedIncomes(budgetId),
    onSuccess: (data, budgetId) => {
      queryClient.invalidateQueries({ queryKey: plannedIncomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(budgetId) })
      toast.success(`Создано ${data.generated} запланированных доходов`)
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
