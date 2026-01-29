import { apiClient } from './client'
import type {
  PlannedExpenseWithDetails,
  PlannedExpensesListResponse,
  PlannedExpensesListParams,
  CreatePlannedExpenseRequest,
  UpdatePlannedExpenseRequest,
  ConfirmPlannedExpenseRequest,
} from './types'

const ENDPOINT = '/planned-expenses'

export const plannedExpensesApi = {
  /**
   * Get list of planned expenses
   */
  list: (params?: PlannedExpensesListParams) =>
    apiClient.get<PlannedExpensesListResponse>(ENDPOINT, params),

  /**
   * Get planned expense by ID
   */
  get: (id: string) =>
    apiClient.get<PlannedExpenseWithDetails>(`${ENDPOINT}/${id}`),

  /**
   * Get upcoming planned expenses
   */
  getUpcoming: (from: string, to: string) =>
    apiClient.get<PlannedExpensesListResponse>(`${ENDPOINT}/upcoming`, {
      from,
      to,
    }),

  /**
   * Create new planned expense (manual)
   */
  create: (data: CreatePlannedExpenseRequest) =>
    apiClient.post<PlannedExpenseWithDetails>(ENDPOINT, data),

  /**
   * Update planned expense
   */
  update: (id: string, data: UpdatePlannedExpenseRequest) =>
    apiClient.patch<PlannedExpenseWithDetails>(`${ENDPOINT}/${id}`, data),

  /**
   * Delete planned expense
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),

  /**
   * Confirm planned expense (link to actual expense OR create new expense)
   * If actualExpenseId is provided, links to existing expense
   * Otherwise, creates a new expense with the provided details
   */
  confirm: (id: string, data: ConfirmPlannedExpenseRequest) =>
    apiClient.post<PlannedExpenseWithDetails>(`${ENDPOINT}/${id}/confirm`, data),

  /**
   * Confirm planned expense with new expense (creates expense automatically)
   */
  confirmWithExpense: (
    id: string,
    data: { actualAmount?: number; accountId?: string; date?: string; notes?: string; tagIds?: string[]; categoryId?: string }
  ) =>
    apiClient.post<PlannedExpenseWithDetails>(
      `${ENDPOINT}/${id}/confirm-with-expense`,
      data
    ),

  /**
   * Skip planned expense
   */
  skip: (id: string) =>
    apiClient.post<PlannedExpenseWithDetails>(`${ENDPOINT}/${id}/skip`, {}),

  /**
   * Unconfirm planned expense (revert to pending, return money to account, delete linked expense)
   */
  unconfirm: (id: string) =>
    apiClient.post<PlannedExpenseWithDetails>(`${ENDPOINT}/${id}/unconfirm`, {}),
}
