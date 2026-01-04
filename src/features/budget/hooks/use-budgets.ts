import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { budgetsApi } from '@/lib/api'
import type {
  BudgetsListParams,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  UpsertBudgetItemRequest,
} from '@/lib/api/types'

export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: (params?: BudgetsListParams) =>
    [...budgetKeys.lists(), params] as const,
  details: () => [...budgetKeys.all, 'detail'] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
  items: (budgetId: string) => [...budgetKeys.detail(budgetId), 'items'] as const,
  current: () => [...budgetKeys.all, 'current'] as const,
  byMonth: (year: number, month: number) => [...budgetKeys.all, 'month', year, month] as const,
}

export function useBudgets(params?: BudgetsListParams) {
  return useQuery({
    queryKey: budgetKeys.list(params),
    queryFn: () => budgetsApi.list(params),
  })
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: () => budgetsApi.get(id),
    enabled: !!id,
  })
}

export function useCurrentBudget() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  return useQuery({
    queryKey: budgetKeys.current(),
    queryFn: async () => {
      const response = await budgetsApi.list({ year, status: 'active' })
      const budget = response.data.find((b) => b.month === month)
      if (!budget) return null
      return budgetsApi.get(budget.id)
    },
  })
}

export function useBudgetItems(budgetId: string) {
  return useQuery({
    queryKey: budgetKeys.items(budgetId),
    queryFn: () => budgetsApi.getItems(budgetId),
    enabled: !!budgetId,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBudgetRequest) => budgetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.current() })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetRequest }) =>
      budgetsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: budgetKeys.current() })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.current() })
    },
  })
}

export function useUpsertBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      budgetId,
      data,
    }: {
      budgetId: string
      data: UpsertBudgetItemRequest
    }) => budgetsApi.upsertItem(budgetId, data),
    onSuccess: () => {
      // Инвалидируем все запросы бюджетов
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    },
  })
}

export function useDeleteBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ budgetId, itemId }: { budgetId: string; itemId: string }) =>
      budgetsApi.deleteItem(budgetId, itemId),
    onSuccess: (_, { budgetId }) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(budgetId) })
      queryClient.invalidateQueries({ queryKey: budgetKeys.items(budgetId) })
      queryClient.invalidateQueries({ queryKey: budgetKeys.current() })
    },
  })
}

export function useCopyBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      targetYear,
      targetMonth,
    }: {
      id: string
      targetYear: number
      targetMonth: number
    }) => budgetsApi.copy(id, targetYear, targetMonth),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.current() })
    },
  })
}

export function useBudgetByMonth(year: number, month: number) {
  return useQuery({
    queryKey: budgetKeys.byMonth(year, month),
    queryFn: async () => {
      const response = await budgetsApi.list({ year })
      const budget = response.data.find((b) => b.month === month)
      if (!budget) return null

      // Бэкенд возвращает items прямо в ответе /budgets/{id}
      return budgetsApi.get(budget.id)
    },
  })
}
