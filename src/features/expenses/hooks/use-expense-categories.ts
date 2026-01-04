import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseCategoriesApi } from '@/lib/api'
import type {
  ExpenseCategoriesListParams,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
} from '@/lib/api'
import { toast } from 'sonner'
import { expenseTagKeys } from './use-expense-tags'

// === Query Keys ===

export const expenseCategoryKeys = {
  all: ['expense-categories'] as const,
  lists: () => [...expenseCategoryKeys.all, 'list'] as const,
  list: (params?: ExpenseCategoriesListParams) =>
    [...expenseCategoryKeys.lists(), params] as const,
  details: () => [...expenseCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseCategoryKeys.details(), id] as const,
}

// === Hooks ===

/**
 * Получить список категорий расходов
 */
export function useExpenseCategories(params?: ExpenseCategoriesListParams) {
  return useQuery({
    queryKey: expenseCategoryKeys.list(params),
    queryFn: () => expenseCategoriesApi.list(params),
  })
}

/**
 * Получить категорию по ID
 */
export function useExpenseCategory(id: string) {
  return useQuery({
    queryKey: expenseCategoryKeys.detail(id),
    queryFn: () => expenseCategoriesApi.get(id),
    enabled: !!id,
  })
}

/**
 * Создать новую категорию
 */
export function useCreateExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExpenseCategoryRequest) =>
      expenseCategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
      toast.success('Категория создана')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить категорию
 */
export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateExpenseCategoryRequest
    }) => expenseCategoriesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: expenseCategoryKeys.detail(variables.id),
      })
      toast.success('Категория обновлена')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить категорию
 */
export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => expenseCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
      toast.success('Категория удалена')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Добавить тег к категории
 */
export function useAddCategoryTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, tagId }: { categoryId: string; tagId: string }) =>
      expenseCategoriesApi.addTag(categoryId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: expenseCategoryKeys.detail(variables.categoryId),
      })
      queryClient.invalidateQueries({ queryKey: expenseTagKeys.lists() })
      toast.success('Тег добавлен к категории')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить тег у категории
 */
export function useRemoveCategoryTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, tagId }: { categoryId: string; tagId: string }) =>
      expenseCategoriesApi.removeTag(categoryId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: expenseCategoryKeys.detail(variables.categoryId),
      })
      toast.success('Тег удалён у категории')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
