import { apiClient } from './client'
import type {
  Fund,
  FundBalance,
  FundsListResponse,
  FundsListParams,
  CreateFundRequest,
  UpdateFundRequest,
  FundAsset,
  FundAssetsListResponse,
  AddFundAssetRequest,
  UpdateFundAssetAmountRequest,
  FundContribution,
  FundContributionsListResponse,
  CreateContributionRequest,
  FundWithdrawal,
  FundWithdrawalsListResponse,
  CreateWithdrawalRequest,
  FundHistoryResponse,
  FundHistoryParams,
} from './types'

const ENDPOINT = '/funds'

export const fundsApi = {
  // === Funds CRUD ===

  /**
   * Получить список всех фондов с балансами
   */
  list: (params?: FundsListParams) =>
    apiClient.get<FundsListResponse>(ENDPOINT, params),

  /**
   * Получить фонд по ID с балансом
   */
  get: (id: string) => apiClient.get<FundBalance>(`${ENDPOINT}/${id}`),

  /**
   * Создать новый фонд
   */
  create: (data: CreateFundRequest) => apiClient.post<Fund>(ENDPOINT, data),

  /**
   * Обновить фонд
   */
  update: (id: string, data: UpdateFundRequest) =>
    apiClient.patch<Fund>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить фонд
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),

  // === Fund Assets ===

  /**
   * Получить список активов в фонде
   */
  listAssets: (fundId: string) =>
    apiClient.get<FundAssetsListResponse>(`${ENDPOINT}/${fundId}/assets`),

  /**
   * Добавить актив в фонд
   */
  addAsset: (fundId: string, data: AddFundAssetRequest) =>
    apiClient.post<FundAsset>(`${ENDPOINT}/${fundId}/assets`, data),

  /**
   * Обновить количество актива в фонде
   */
  updateAssetAmount: (
    fundId: string,
    assetId: string,
    data: UpdateFundAssetAmountRequest
  ) =>
    apiClient.patch<FundAsset>(
      `${ENDPOINT}/${fundId}/assets/${assetId}`,
      data
    ),

  /**
   * Удалить актив из фонда
   */
  removeAsset: (fundId: string, assetId: string) =>
    apiClient.delete<void>(`${ENDPOINT}/${fundId}/assets/${assetId}`),

  // === Fund Contributions ===

  /**
   * Получить список пополнений фонда
   */
  listContributions: (fundId: string) =>
    apiClient.get<FundContributionsListResponse>(
      `${ENDPOINT}/${fundId}/contributions`
    ),

  /**
   * Создать пополнение фонда
   */
  createContribution: (fundId: string, data: CreateContributionRequest) =>
    apiClient.post<FundContribution>(
      `${ENDPOINT}/${fundId}/contributions`,
      data
    ),

  // === Fund Withdrawals ===

  /**
   * Получить список списаний из фонда
   */
  listWithdrawals: (fundId: string) =>
    apiClient.get<FundWithdrawalsListResponse>(
      `${ENDPOINT}/${fundId}/withdrawals`
    ),

  /**
   * Создать списание из фонда
   */
  createWithdrawal: (fundId: string, data: CreateWithdrawalRequest) =>
    apiClient.post<FundWithdrawal>(
      `${ENDPOINT}/${fundId}/withdrawals`,
      data
    ),

  // === Fund History ===

  /**
   * Получить историю операций фонда
   */
  getHistory: (fundId: string, params?: FundHistoryParams) =>
    apiClient.get<FundHistoryResponse>(
      `${ENDPOINT}/${fundId}/history`,
      params
    ),
}
