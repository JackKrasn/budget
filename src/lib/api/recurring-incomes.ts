import { apiClient } from './client'
import type {
  RecurringIncome,
  RecurringIncomesListResponse,
  RecurringIncomesSummary,
  CreateRecurringIncomeRequest,
  UpdateRecurringIncomeRequest,
} from './types'

const ENDPOINT = '/recurring-incomes'

export const recurringIncomesApi = {
  /**
   * Get list of recurring income templates
   */
  list: () => apiClient.get<RecurringIncomesListResponse>(ENDPOINT),

  /**
   * Get recurring income by ID
   */
  get: (id: string) => apiClient.get<RecurringIncome>(`${ENDPOINT}/${id}`),

  /**
   * Get summary of monthly recurring incomes
   */
  getSummary: () => apiClient.get<RecurringIncomesSummary>(`${ENDPOINT}/summary`),

  /**
   * Create new recurring income template
   */
  create: (data: CreateRecurringIncomeRequest) =>
    apiClient.post<RecurringIncome>(ENDPOINT, data),

  /**
   * Update recurring income
   */
  update: (id: string, data: UpdateRecurringIncomeRequest) =>
    apiClient.patch<RecurringIncome>(`${ENDPOINT}/${id}`, data),

  /**
   * Delete recurring income
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),
}
