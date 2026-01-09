import { apiClient } from './client'
import type {
  AssetType,
  AssetTypesListResponse,
  CreateAssetTypeRequest,
  UpdateAssetTypeRequest,
} from './types'

const ENDPOINT = '/asset-types'

export const assetTypesApi = {
  /**
   * Получить список всех типов активов
   */
  list: () => apiClient.get<AssetTypesListResponse>(ENDPOINT),

  /**
   * Получить тип актива по ID
   */
  get: (id: string) => apiClient.get<AssetType>(`${ENDPOINT}/${id}`),

  /**
   * Создать новый тип актива
   */
  create: (data: CreateAssetTypeRequest) =>
    apiClient.post<AssetType>(ENDPOINT, data),

  /**
   * Обновить тип актива
   */
  update: (id: string, data: UpdateAssetTypeRequest) =>
    apiClient.patch<AssetType>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить тип актива
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),
}
