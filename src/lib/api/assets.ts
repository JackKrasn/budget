import { apiClient } from './client'
import type {
  Asset,
  AssetWithType,
  AssetsListResponse,
  AssetsListParams,
  CreateAssetRequest,
  UpdateAssetRequest,
  UpdateAssetPriceRequest,
} from './types'

const ENDPOINT = '/assets'

export const assetsApi = {
  /**
   * Получить список всех активов
   */
  list: (params?: AssetsListParams) =>
    apiClient.get<AssetsListResponse>(ENDPOINT, params),

  /**
   * Получить актив по ID
   */
  get: (id: string) => apiClient.get<AssetWithType>(`${ENDPOINT}/${id}`),

  /**
   * Создать новый актив
   */
  create: (data: CreateAssetRequest) => apiClient.post<Asset>(ENDPOINT, data),

  /**
   * Обновить актив
   */
  update: (id: string, data: UpdateAssetRequest) =>
    apiClient.patch<Asset>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить актив
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),

  /**
   * Обновить цену актива
   */
  updatePrice: (id: string, data: UpdateAssetPriceRequest) =>
    apiClient.post<Asset>(`${ENDPOINT}/${id}/price`, data),
}
