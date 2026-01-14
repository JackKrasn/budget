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
   * Добавить/обновить курс валюты
   */
  create: (data: CreateExchangeRateRequest) =>
    apiClient.post<ExchangeRate>(ENDPOINT, data),
}
