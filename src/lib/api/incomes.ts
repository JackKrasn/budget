import { apiClient } from './client'
import type {
  IncomeWithDistributions,
  IncomeDistribution,
  IncomesListResponse,
  IncomesListParams,
  CreateIncomeRequest,
  UpdateIncomeRequest,
  CreateIncomeDistributionRequest,
  UpdateDistributionRequest,
  ConfirmDistributionRequest,
  CancelDistributionResponse,
} from './types'

const ENDPOINT = '/incomes'

export const incomesApi = {
  /**
   * Get list of incomes
   */
  list: (params?: IncomesListParams) =>
    apiClient.get<IncomesListResponse>(ENDPOINT, params),

  /**
   * Get income by ID with distributions
   */
  get: (id: string) =>
    apiClient.get<IncomeWithDistributions>(`${ENDPOINT}/${id}`),

  /**
   * Create new income (auto-creates distributions based on rules)
   */
  create: (data: CreateIncomeRequest) =>
    apiClient.post<IncomeWithDistributions>(ENDPOINT, data),

  /**
   * Update income
   */
  update: (id: string, data: UpdateIncomeRequest) =>
    apiClient.patch<IncomeWithDistributions>(`${ENDPOINT}/${id}`, data),

  /**
   * Delete income
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),

  /**
   * Create distribution for income (manually add fund distribution)
   */
  createDistribution: (incomeId: string, data: CreateIncomeDistributionRequest) =>
    apiClient.post<IncomeDistribution>(
      `${ENDPOINT}/${incomeId}/distributions`,
      data
    ),

  /**
   * Update distribution planned amount
   */
  updateDistribution: (incomeId: string, fundId: string, data: UpdateDistributionRequest) =>
    apiClient.patch<IncomeDistribution>(
      `${ENDPOINT}/${incomeId}/distributions/${fundId}`,
      data
    ),

  /**
   * Confirm distribution - transfer to fund
   */
  confirmDistribution: (incomeId: string, fundId: string, data: ConfirmDistributionRequest) =>
    apiClient.post<IncomeDistribution>(
      `${ENDPOINT}/${incomeId}/distributions/${fundId}/confirm`,
      data
    ),

  /**
   * Cancel confirmed distribution - rollback transfer
   */
  cancelDistribution: (incomeId: string, fundId: string) =>
    apiClient.post<CancelDistributionResponse>(
      `${ENDPOINT}/${incomeId}/distributions/${fundId}/cancel`
    ),
}
