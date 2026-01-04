import { apiClient } from './client'
import type {
  ExchangeRate,
  ExchangeRatesResponse,
  CreateExchangeRateRequest,
} from './types'

const ENDPOINT = '/exchange-rates'

export const exchangeRatesApi = {
  /**
   * Получить текущие курсы всех валют
   */
  getRates: () => apiClient.get<ExchangeRatesResponse>(ENDPOINT),

  /**
   * Обновить курс валюты
   */
  updateRate: (data: CreateExchangeRateRequest) =>
    apiClient.post<ExchangeRate>(ENDPOINT, data),
}
