import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { plannedExpensesApi, budgetsApi } from '@/lib/api'
import type {
  PlannedExpensesListParams,
  CreatePlannedExpenseRequest,
  UpdatePlannedExpenseRequest,
  ConfirmPlannedExpenseRequest,
} from '@/lib/api/types'
import { toast } from 'sonner'
import { budgetKeys } from './use-budgets'

export const plannedExpenseKeys = {
  all: ['planned-expenses'] as const,
  lists: () => [...plannedExpenseKeys.all, 'list'] as const,
  list: (params?: PlannedExpensesListParams) =>
    [...plannedExpenseKeys.lists(), params] as const,
  details: () => [...plannedExpenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...plannedExpenseKeys.details(), id] as const,
  upcoming: (from: string, to: string) =>
    [...plannedExpenseKeys.all, 'upcoming', from, to] as const,
}

export function usePlannedExpenses(params?: PlannedExpensesListParams) {
  return useQuery({
    queryKey: plannedExpenseKeys.list(params),
    queryFn: () => plannedExpensesApi.list(params),
    enabled: !!params?.budgetId, // Не выполнять запрос без budgetId
  })
}

export function usePlannedExpense(id: string) {
  return useQuery({
    queryKey: plannedExpenseKeys.detail(id),
    queryFn: () => plannedExpensesApi.get(id),
    enabled: !!id,
  })
}

export function useUpcomingPlannedExpenses(from: string, to: string) {
  return useQuery({
    queryKey: plannedExpenseKeys.upcoming(from, to),
    queryFn: () => plannedExpensesApi.getUpcoming(from, to),
    enabled: !!from && !!to,
  })
}

export function useCreatePlannedExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePlannedExpenseRequest) =>
      plannedExpensesApi.create(data),
    onSuccess: (_, { budgetId }) => {
      queryClient.invalidateQueries({ queryKey: plannedExpenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(budgetId) })
      toast.success('Запланированный расход создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useUpdatePlannedExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdatePlannedExpenseRequest
    }) => plannedExpensesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: plannedExpenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: plannedExpenseKeys.detail(id) })
      toast.success('Расход обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useDeletePlannedExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => plannedExpensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannedExpenseKeys.lists() })
      toast.success('Расход удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useConfirmPlannedExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: ConfirmPlannedExpenseRequest
    }) => plannedExpensesApi.confirm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannedExpenseKeys.lists() })
      toast.success('Расход подтверждён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useSkipPlannedExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => plannedExpensesApi.skip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannedExpenseKeys.lists() })
      toast.success('Расход пропущен')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useGeneratePlannedExpenses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (budgetId: string) => budgetsApi.generatePlanned(budgetId),
    onSuccess: (data, budgetId) => {
      queryClient.invalidateQueries({ queryKey: plannedExpenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(budgetId) })
      toast.success(`Создано ${data.generated} запланированных расходов`)
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
