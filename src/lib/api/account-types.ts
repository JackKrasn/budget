import { apiClient } from './client'
import type {
  AccountType,
  AccountTypesListResponse,
  CreateAccountTypeRequest,
  UpdateAccountTypeRequest,
} from './types'

const ENDPOINT = '/account-types'

export const accountTypesApi = {
  /**
   * Получить список всех типов счетов
   */
  list: () => apiClient.get<AccountTypesListResponse>(ENDPOINT),

  /**
   * Получить тип счёта по ID
   */
  get: (id: string) => apiClient.get<AccountType>(`${ENDPOINT}/${id}`),

  /**
   * Создать новый тип счёта
   */
  create: (data: CreateAccountTypeRequest) => apiClient.post<AccountType>(ENDPOINT, data),

  /**
   * Обновить тип счёта
   */
  update: (id: string, data: UpdateAccountTypeRequest) =>
    apiClient.patch<AccountType>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить тип счёта
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),
}
