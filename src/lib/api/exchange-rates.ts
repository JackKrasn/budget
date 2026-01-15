import { apiClient } from './client'
import type {
  ExchangeRate,
  ExchangeRatesListResponse,
  CreateExchangeRateRequest,
} from './types'

const ENDPOINT = '/exchange-rates'

export const exchangeRatesApi = {
  /**
   * Получить список всех курсов валют
   */
  list: () => apiClient.get<ExchangeRatesListResponse>(ENDPOINT),

  /**
   * Добавить курс валюты
   */
  create: (data: CreateExchangeRateRequest) =>
    apiClient.post<ExchangeRate>(ENDPOINT, data),

  /**
   * Обновить курс валюты
   */
  update: (id: string, data: { rate: number; source?: string }) =>
    apiClient.patch<ExchangeRate>(`${ENDPOINT}/${id}`, data),
}
