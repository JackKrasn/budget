import { apiClient } from './client'
import type {
  BalanceAdjustment,
  BalanceAdjustmentsListResponse,
  BalanceAdjustmentsListParams,
  CreateBalanceAdjustmentRequest,
  SetBalanceRequest,
} from './types'

const ENDPOINT = '/balance-adjustments'

export const balanceAdjustmentsApi = {
  /**
   * Получить список корректировок баланса
   */
  list: (params?: BalanceAdjustmentsListParams) =>
    apiClient.get<BalanceAdjustmentsListResponse>(ENDPOINT, params),

  /**
   * Получить корректировку по ID
   */
  get: (id: string) => apiClient.get<BalanceAdjustment>(`${ENDPOINT}/${id}`),

  /**
   * Создать корректировку баланса (ручной ввод разницы)
   */
  create: (data: CreateBalanceAdjustmentRequest) =>
    apiClient.post<BalanceAdjustment>(ENDPOINT, data),

  /**
   * Установить баланс счёта (автоматический расчёт разницы)
   */
  setBalance: (data: SetBalanceRequest) =>
    apiClient.post<BalanceAdjustment>(`${ENDPOINT}/set-balance`, data),

  /**
   * Удалить корректировку
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),
}
