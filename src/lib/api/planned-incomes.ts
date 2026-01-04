import { apiClient } from './client'
import type {
  PlannedIncome,
  PlannedIncomesListResponse,
  PlannedIncomesListParams,
  CreatePlannedIncomeRequest,
  UpdatePlannedIncomeRequest,
  ReceivePlannedIncomeRequest,
} from './types'

const ENDPOINT = '/planned-incomes'

export const plannedIncomesApi = {
  /**
   * Get list of planned incomes
   */
  list: (params?: PlannedIncomesListParams) =>
    apiClient.get<PlannedIncomesListResponse>(ENDPOINT, params),

  /**
   * Get planned income by ID
   */
  get: (id: string) => apiClient.get<PlannedIncome>(`${ENDPOINT}/${id}`),

  /**
   * Get upcoming planned incomes (by dates)
   */
  getUpcoming: (params?: { from?: string; to?: string }) =>
    apiClient.get<PlannedIncomesListResponse>(`${ENDPOINT}/upcoming`, params),

  /**
   * Create new planned income
   */
  create: (data: CreatePlannedIncomeRequest) =>
    apiClient.post<PlannedIncome>(ENDPOINT, data),

  /**
   * Update planned income
   */
  update: (id: string, data: UpdatePlannedIncomeRequest) =>
    apiClient.patch<PlannedIncome>(`${ENDPOINT}/${id}`, data),

  /**
   * Delete planned income
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),

  /**
   * Mark planned income as received (link to actual income)
   */
  receive: (id: string, data: ReceivePlannedIncomeRequest) =>
    apiClient.post<PlannedIncome>(`${ENDPOINT}/${id}/receive`, data),

  /**
   * Skip planned income
   */
  skip: (id: string) => apiClient.post<PlannedIncome>(`${ENDPOINT}/${id}/skip`),
}
