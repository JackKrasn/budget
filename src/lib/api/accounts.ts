import { apiClient } from './client'
import type {
  Account,
  AccountWithType,
  AccountsListResponse,
  CreateAccountRequest,
  UpdateAccountRequest,
  CreditCardReservesResponse,
  ApplyReservesRequest,
  ApplyReservesResponse,
  RepayRequest,
  RepayResponse,
} from './types'

const ENDPOINT = '/accounts'

export const accountsApi = {
  /**
   * Получить список всех счетов
   */
  list: () => apiClient.get<AccountsListResponse>(ENDPOINT),

  /**
   * Получить счёт по ID
   */
  get: (id: string) => apiClient.get<AccountWithType>(`${ENDPOINT}/${id}`),

  /**
   * Создать новый счёт
   */
  create: (data: CreateAccountRequest) => apiClient.post<Account>(ENDPOINT, data),

  /**
   * Обновить счёт
   */
  update: (id: string, data: UpdateAccountRequest) =>
    apiClient.patch<Account>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить счёт
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),

  /**
   * Получить pending резервы кредитной карты
   */
  getReserves: (creditCardId: string) =>
    apiClient.get<CreditCardReservesResponse>(`${ENDPOINT}/${creditCardId}/reserves`),

  /**
   * Применить резервы (учётная операция)
   */
  applyReserves: (creditCardId: string, data: ApplyReservesRequest) =>
    apiClient.post<ApplyReservesResponse>(`${ENDPOINT}/${creditCardId}/apply-reserves`, data),

  /**
   * Погасить кредитную карту с авто-применением резервов
   */
  repay: (creditCardId: string, data: RepayRequest) =>
    apiClient.post<RepayResponse>(`${ENDPOINT}/${creditCardId}/repay`, data),
}
