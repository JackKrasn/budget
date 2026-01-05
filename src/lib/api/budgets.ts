import { apiClient } from './client'
import type {
  Budget,
  BudgetWithItems,
  BudgetItem,
  BudgetsListResponse,
  BudgetItemsListResponse,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  UpsertBudgetItemRequest,
  BudgetsListParams,
} from './types'

const ENDPOINT = '/budgets'

export const budgetsApi = {
  /**
   * Get list of budgets
   */
  list: (params?: BudgetsListParams) =>
    apiClient.get<BudgetsListResponse>(ENDPOINT, params),

  /**
   * Get budget by ID
   */
  get: (id: string) => apiClient.get<BudgetWithItems>(`${ENDPOINT}/${id}`),

  /**
   * Create new budget
   */
  create: (data: CreateBudgetRequest) =>
    apiClient.post<Budget>(ENDPOINT, data),

  /**
   * Update budget
   */
  update: (id: string, data: UpdateBudgetRequest) =>
    apiClient.patch<Budget>(`${ENDPOINT}/${id}`, data),

  /**
   * Delete budget
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),

  /**
   * Copy budget from another month
   */
  copy: (id: string, targetYear: number, targetMonth: number) =>
    apiClient.post<Budget>(`${ENDPOINT}/${id}/copy`, {
      targetYear,
      targetMonth,
    }),

  /**
   * Get budget items
   */
  getItems: (budgetId: string) =>
    apiClient.get<BudgetItemsListResponse>(`${ENDPOINT}/${budgetId}/items`),

  /**
   * Add or update budget item
   */
  upsertItem: (budgetId: string, data: UpsertBudgetItemRequest) =>
    apiClient.post<BudgetItem>(`${ENDPOINT}/${budgetId}/items`, data),

  /**
   * Delete budget item
   */
  deleteItem: (budgetId: string, itemId: string) =>
    apiClient.delete<void>(`${ENDPOINT}/${budgetId}/items/${itemId}`),

  /**
   * Get current month's budget
   */
  getCurrent: async () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const response = await budgetsApi.list({ year, status: 'active' })
    return response.data.find((b) => b.month === month) ?? null
  },

  /**
   * Generate planned expenses from active recurring templates
   */
  generatePlanned: (budgetId: string) =>
    apiClient.post<{ generated: number }>(`${ENDPOINT}/${budgetId}/generate-planned`, {}),

  /**
   * Generate planned incomes from active recurring templates
   */
  generatePlannedIncomes: (budgetId: string) =>
    apiClient.post<{ generated: number }>(`${ENDPOINT}/${budgetId}/generate-planned-incomes`, {}),

  /**
   * Generate planned expenses from credit payment schedules
   */
  generateCreditPayments: (budgetId: string) =>
    apiClient.post<{ generated: number }>(`${ENDPOINT}/${budgetId}/generate-credit-payments`, {}),
}
