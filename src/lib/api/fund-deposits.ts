import { apiClient } from './client'
import type {
  FundDeposit,
  ListFundDepositsParams,
  ListFundDepositsResponse,
  DeleteTransactionResponse,
  UpdateFundDepositRequest,
  UpdateFundDepositResponse,
  GroupedByAssetResponse,
} from './types'

const ENDPOINT = '/fund-deposits'

export const fundDepositsApi = {
  /**
   * Получить список переводов в фонды
   */
  list: (params?: ListFundDepositsParams) =>
    apiClient.get<ListFundDepositsResponse>(ENDPOINT, params),

  /**
   * Получить перевод по ID
   */
  get: (id: string) => apiClient.get<FundDeposit>(`${ENDPOINT}/${id}`),

  /**
   * Обновить перевод в фонд
   */
  update: (id: string, data: UpdateFundDepositRequest) =>
    apiClient.patch<UpdateFundDepositResponse>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить перевод в фонд (возвращает информацию об изменении балансов)
   */
  delete: (id: string) => apiClient.delete<DeleteTransactionResponse | null>(`${ENDPOINT}/${id}`),

  /**
   * Получить активы, сгруппированные по фондам
   */
  groupedByAsset: () => apiClient.get<GroupedByAssetResponse>(`${ENDPOINT}/by-asset`),
}
