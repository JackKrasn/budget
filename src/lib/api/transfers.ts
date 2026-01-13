import { apiClient } from './client'
import type {
  Transfer,
  TransferWithAccounts,
  TransfersListResponse,
  TransfersListParams,
  CreateTransferRequest,
} from './types'

const ENDPOINT = '/transfers'

export const transfersApi = {
  /**
   * Получить список переводов между счетами
   */
  list: (params?: TransfersListParams) =>
    apiClient.get<TransfersListResponse>(ENDPOINT, params),

  /**
   * Получить перевод по ID
   */
  get: (id: string) => apiClient.get<TransferWithAccounts>(`${ENDPOINT}/${id}`),

  /**
   * Создать перевод между счетами
   */
  create: (data: CreateTransferRequest) =>
    apiClient.post<Transfer>(ENDPOINT, data),

  /**
   * Удалить перевод
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),
}
