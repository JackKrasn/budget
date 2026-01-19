import { apiClient } from './client'
import type {
  FundDeposit,
  ListFundDepositsParams,
  ListFundDepositsResponse,
  DeleteTransactionResponse,
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
   * Удалить перевод в фонд (возвращает информацию об изменении балансов)
   */
  delete: (id: string) => apiClient.delete<DeleteTransactionResponse | null>(`${ENDPOINT}/${id}`),
}
