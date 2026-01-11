import { apiClient } from './client'
import type {
  Deposit,
  DepositsListResponse,
  DepositsListParams,
  CreateDepositRequest,
  UpdateDepositRequest,
  DepositAccrualsResponse,
  DepositsSummary,
  MaturingDepositsParams,
} from './types'

const ENDPOINT = '/deposits'

export const depositsApi = {
  /**
   * Получить список всех депозитов
   */
  list: (params?: DepositsListParams) =>
    apiClient.get<DepositsListResponse>(ENDPOINT, params),

  /**
   * Получить депозит по ID
   */
  get: (id: string) => apiClient.get<Deposit>(`${ENDPOINT}/${id}`),

  /**
   * Создать новый депозит
   */
  create: (data: CreateDepositRequest) => apiClient.post<Deposit>(ENDPOINT, data),

  /**
   * Обновить депозит
   */
  update: (id: string, data: UpdateDepositRequest) =>
    apiClient.patch<Deposit>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить депозит
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),

  /**
   * Получить историю начислений депозита
   */
  getAccruals: (id: string) =>
    apiClient.get<DepositAccrualsResponse>(`${ENDPOINT}/${id}/accruals`),

  /**
   * Досрочное закрытие депозита
   */
  closeEarly: (id: string) =>
    apiClient.post<Deposit>(`${ENDPOINT}/${id}/close-early`),

  /**
   * Получить общую статистику по депозитам
   */
  getSummary: () => apiClient.get<DepositsSummary>(`${ENDPOINT}/summary`),

  /**
   * Получить депозиты с истекающим сроком
   */
  getMaturing: (params?: MaturingDepositsParams) =>
    apiClient.get<DepositsListResponse>(`${ENDPOINT}/maturing`, params),

  /**
   * Начислить проценты (административная функция)
   */
  processAccruals: () => apiClient.post<void>(`${ENDPOINT}/process-accruals`),
}
