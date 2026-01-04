import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseTagsApi } from '@/lib/api'
import type { CreateExpenseTagRequest, UpdateExpenseTagRequest } from '@/lib/api'
import { toast } from 'sonner'

// === Query Keys ===

export const expenseTagKeys = {
  all: ['expense-tags'] as const,
  lists: () => [...expenseTagKeys.all, 'list'] as const,
}

// === Hooks ===

/**
 * Получить список всех тегов расходов
 */
export function useExpenseTags() {
  return useQuery({
    queryKey: expenseTagKeys.lists(),
    queryFn: () => expenseTagsApi.list(),
  })
}

/**
 * Создать новый тег
 */
export function useCreateExpenseTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExpenseTagRequest) => expenseTagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseTagKeys.lists() })
      toast.success('Тег создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить тег
 */
export function useUpdateExpenseTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseTagRequest }) =>
      expenseTagsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseTagKeys.lists() })
      toast.success('Тег обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить тег
 */
export function useDeleteExpenseTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => expenseTagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseTagKeys.lists() })
      toast.success('Тег удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
