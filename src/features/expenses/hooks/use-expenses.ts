import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesApi } from '@/lib/api'
import type {
  ExpensesListParams,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from '@/lib/api'
import { toast } from 'sonner'
import { fundKeys } from '@/features/funds/hooks/use-funds'
import { accountKeys } from '@/features/accounts/hooks/use-accounts'

// === Query Keys ===

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (params?: ExpensesListParams) => [...expenseKeys.lists(), params] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
}

// === Hooks ===

/**
 * Получить список расходов с фильтрацией
 */
export function useExpenses(params?: ExpensesListParams) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expensesApi.list(params),
  })
}

/**
 * Получить расход по ID
 */
export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expensesApi.get(id),
    enabled: !!id,
  })
}

/**
 * Создать новый расход
 */
export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expensesApi.create(data),
    onSuccess: async () => {
      // Invalidate and refetch all expense queries
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      // Wait for refetch to complete
      await queryClient.refetchQueries({ queryKey: expenseKeys.lists() })
      // Invalidate all fund data (in case expense was funded from funds)
      await queryClient.invalidateQueries({ queryKey: fundKeys.all })
      // Invalidate accounts to refresh balance
      await queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Расход создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить расход
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseRequest }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      // Invalidate all expense queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      // Invalidate accounts to refresh balance
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Расход обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить расход
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      // Invalidate all expense queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      // Invalidate all fund data in case expense was funded from them
      // (при удалении бэкенд возвращает средства на счета фондов)
      queryClient.invalidateQueries({ queryKey: fundKeys.all })
      // Invalidate accounts to refresh balance
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Расход удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
