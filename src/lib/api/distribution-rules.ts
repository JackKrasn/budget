import { apiClient } from './client'
import type {
  DistributionRule,
  DistributionRulesListResponse,
  DistributionRulesListParams,
  CreateDistributionRuleRequest,
  UpdateDistributionRuleRequest,
} from './types'

const ENDPOINT = '/distribution-rules'

export const distributionRulesApi = {
  /**
   * Получить список всех правил распределения
   * @param params - фильтры (fundId, active)
   */
  list: (params?: DistributionRulesListParams) =>
    apiClient.get<DistributionRulesListResponse>(ENDPOINT, params),

  /**
   * Получить правило по ID
   */
  get: (id: string) =>
    apiClient.get<DistributionRule>(`${ENDPOINT}/${id}`),

  /**
   * Создать новое правило распределения
   */
  create: (data: CreateDistributionRuleRequest) =>
    apiClient.post<DistributionRule>(ENDPOINT, data),

  /**
   * Обновить правило распределения
   */
  update: (id: string, data: UpdateDistributionRuleRequest) =>
    apiClient.patch<DistributionRule>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить правило распределения
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),
}
