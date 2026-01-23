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
  BuyAssetRequest,
  BuyAssetResponse,
  DepositToFundRequest,
  DepositToFundResponse,
  TransferAssetRequest,
  TransferAssetResponse,
  FundTransactionsListResponse,
  FundTransactionsListParams,
  FundCurrencyAssetsResponse,
  DeleteContributionResponse,
  DeleteTransactionResponse,
  UpdateFundTransactionRequest,
  FundTransaction,
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

  /**
   * Удалить пополнение фонда (возвращает информацию об изменении балансов)
   */
  deleteContribution: (fundId: string, contributionId: string) =>
    apiClient.delete<DeleteContributionResponse>(
      `${ENDPOINT}/${fundId}/contributions/${contributionId}`
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

  // === Fund Asset Operations ===

  /**
   * Получить валютные активы фонда
   */
  listCurrencyAssets: (fundId: string) =>
    apiClient.get<FundCurrencyAssetsResponse>(
      `${ENDPOINT}/${fundId}/assets/currency`
    ),

  /**
   * Купить актив за валюту фонда
   */
  buyAsset: (fundId: string, data: BuyAssetRequest) =>
    apiClient.post<BuyAssetResponse>(`${ENDPOINT}/${fundId}/buy-asset`, data),

  /**
   * Пополнить валюту фонда с банковского счёта
   */
  depositFromAccount: (fundId: string, data: DepositToFundRequest) =>
    apiClient.post<DepositToFundResponse>(`${ENDPOINT}/${fundId}/deposit`, data),

  /**
   * Перевести актив в другой фонд
   */
  transferAsset: (fundId: string, data: TransferAssetRequest) =>
    apiClient.post<TransferAssetResponse>(
      `${ENDPOINT}/${fundId}/transfer-asset`,
      data
    ),

  /**
   * Получить историю транзакций фонда
   */
  listTransactions: (fundId: string, params?: FundTransactionsListParams) =>
    apiClient.get<FundTransactionsListResponse>(
      `${ENDPOINT}/${fundId}/transactions`,
      params
    ),

  /**
   * Обновить транзакцию фонда
   */
  updateTransaction: (fundId: string, transactionId: string, data: UpdateFundTransactionRequest) =>
    apiClient.patch<FundTransaction>(`${ENDPOINT}/${fundId}/transactions/${transactionId}`, data),

  /**
   * Удалить транзакцию (для покупок, продаж, переводов)
   */
  deleteTransaction: (fundId: string, transactionId: string) =>
    apiClient.delete<DeleteTransactionResponse>(`${ENDPOINT}/${fundId}/transactions/${transactionId}`),
}
