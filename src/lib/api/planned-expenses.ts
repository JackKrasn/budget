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
   * Confirm planned expense (link to actual expense)
   */
  confirm: (id: string, data: ConfirmPlannedExpenseRequest) =>
    apiClient.post<PlannedExpenseWithDetails>(`${ENDPOINT}/${id}/confirm`, data),

  /**
   * Skip planned expense
   */
  skip: (id: string) =>
    apiClient.post<PlannedExpenseWithDetails>(`${ENDPOINT}/${id}/skip`, {}),
}
