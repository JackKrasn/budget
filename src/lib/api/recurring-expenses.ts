import { apiClient } from './client'
import type {
  RecurringExpenseWithCategory,
  RecurringExpensesListResponse,
  RecurringExpensesListParams,
  RecurringExpensesSummary,
  CreateRecurringExpenseRequest,
  UpdateRecurringExpenseRequest,
} from './types'

const ENDPOINT = '/recurring-expenses'

export const recurringExpensesApi = {
  /**
   * Get list of recurring expense templates
   */
  list: (params?: RecurringExpensesListParams) =>
    apiClient.get<RecurringExpensesListResponse>(ENDPOINT, params),

  /**
   * Get recurring expense by ID
   */
  get: (id: string) =>
    apiClient.get<RecurringExpenseWithCategory>(`${ENDPOINT}/${id}`),

  /**
   * Get summary of monthly recurring expenses
   */
  getSummary: () =>
    apiClient.get<RecurringExpensesSummary>(`${ENDPOINT}/summary`),

  /**
   * Create new recurring expense template
   */
  create: (data: CreateRecurringExpenseRequest) =>
    apiClient.post<RecurringExpenseWithCategory>(ENDPOINT, data),

  /**
   * Update recurring expense
   */
  update: (id: string, data: UpdateRecurringExpenseRequest) =>
    apiClient.patch<RecurringExpenseWithCategory>(`${ENDPOINT}/${id}`, data),

  /**
   * Delete recurring expense
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),
}
