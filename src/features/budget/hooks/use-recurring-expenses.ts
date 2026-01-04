import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recurringExpensesApi } from '@/lib/api'
import type {
  RecurringExpensesListParams,
  CreateRecurringExpenseRequest,
  UpdateRecurringExpenseRequest,
} from '@/lib/api/types'
import { toast } from 'sonner'

export const recurringExpenseKeys = {
  all: ['recurring-expenses'] as const,
  lists: () => [...recurringExpenseKeys.all, 'list'] as const,
  list: (params?: RecurringExpensesListParams) =>
    [...recurringExpenseKeys.lists(), params] as const,
  details: () => [...recurringExpenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurringExpenseKeys.details(), id] as const,
  summary: () => [...recurringExpenseKeys.all, 'summary'] as const,
}

export function useRecurringExpenses(params?: RecurringExpensesListParams) {
  return useQuery({
    queryKey: recurringExpenseKeys.list(params),
    queryFn: () => recurringExpensesApi.list(params),
  })
}

export function useRecurringExpense(id: string) {
  return useQuery({
    queryKey: recurringExpenseKeys.detail(id),
    queryFn: () => recurringExpensesApi.get(id),
    enabled: !!id,
  })
}

export function useRecurringExpensesSummary() {
  return useQuery({
    queryKey: recurringExpenseKeys.summary(),
    queryFn: () => recurringExpensesApi.getSummary(),
  })
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRecurringExpenseRequest) =>
      recurringExpensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.summary() })
      toast.success('Шаблон расхода создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateRecurringExpenseRequest
    }) => recurringExpensesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.summary() })
      toast.success('Шаблон обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => recurringExpensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.summary() })
      toast.success('Шаблон удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
