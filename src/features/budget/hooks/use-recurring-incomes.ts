import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recurringIncomesApi } from '@/lib/api'
import type {
  CreateRecurringIncomeRequest,
  UpdateRecurringIncomeRequest,
} from '@/lib/api/types'
import { toast } from 'sonner'

export const recurringIncomeKeys = {
  all: ['recurring-incomes'] as const,
  lists: () => [...recurringIncomeKeys.all, 'list'] as const,
  list: () => [...recurringIncomeKeys.lists()] as const,
  details: () => [...recurringIncomeKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurringIncomeKeys.details(), id] as const,
  summary: () => [...recurringIncomeKeys.all, 'summary'] as const,
}

export function useRecurringIncomes() {
  return useQuery({
    queryKey: recurringIncomeKeys.list(),
    queryFn: () => recurringIncomesApi.list(),
  })
}

export function useRecurringIncome(id: string) {
  return useQuery({
    queryKey: recurringIncomeKeys.detail(id),
    queryFn: () => recurringIncomesApi.get(id),
    enabled: !!id,
  })
}

export function useRecurringIncomesSummary() {
  return useQuery({
    queryKey: recurringIncomeKeys.summary(),
    queryFn: () => recurringIncomesApi.getSummary(),
  })
}

export function useCreateRecurringIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRecurringIncomeRequest) =>
      recurringIncomesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringIncomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recurringIncomeKeys.summary() })
      toast.success('Шаблон дохода создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useUpdateRecurringIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateRecurringIncomeRequest
    }) => recurringIncomesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: recurringIncomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recurringIncomeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: recurringIncomeKeys.summary() })
      toast.success('Шаблон дохода обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

export function useDeleteRecurringIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => recurringIncomesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringIncomeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recurringIncomeKeys.summary() })
      toast.success('Шаблон дохода удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
