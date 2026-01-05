import { apiClient } from '../client'
import type {
  CreateCreditRequest,
  UpdateCreditRequest,
  CreditsListResponse,
  CreditWithSchedule,
  Credit,
  ScheduleItem,
  PaymentHistoryItem,
  UpcomingPayment,
  CreditSummary,
  AllCreditsSummary,
  CreditStatus,
  UUID,
} from './types'

const BASE_URL = '/credits'

/**
 * Получить список всех кредитов
 */
export async function getCredits(status?: CreditStatus): Promise<CreditsListResponse> {
  const params = new URLSearchParams()
  if (status) params.append('status', status)

  return await apiClient.get<CreditsListResponse>(
    `${BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`
  )
}

/**
 * Создать новый кредит
 */
export async function createCredit(data: CreateCreditRequest): Promise<CreditWithSchedule> {
  return await apiClient.post<CreditWithSchedule>(BASE_URL, data)
}

/**
 * Получить кредит по ID с графиком платежей
 */
export async function getCredit(id: UUID): Promise<CreditWithSchedule> {
  return await apiClient.get<CreditWithSchedule>(`${BASE_URL}/${id}`)
}

/**
 * Обновить информацию о кредите
 */
export async function updateCredit(id: UUID, data: UpdateCreditRequest): Promise<Credit> {
  return await apiClient.patch<Credit>(`${BASE_URL}/${id}`, data)
}

/**
 * Удалить кредит
 */
export async function deleteCredit(id: UUID): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}

/**
 * Получить график платежей по кредиту
 */
export async function getCreditSchedule(id: UUID): Promise<ScheduleItem[]> {
  return await apiClient.get<ScheduleItem[]>(`${BASE_URL}/${id}/schedule`)
}

/**
 * Пересчитать график платежей
 */
export async function regenerateCreditSchedule(id: UUID): Promise<ScheduleItem[]> {
  return await apiClient.post<ScheduleItem[]>(`${BASE_URL}/${id}/schedule/regenerate`)
}

/**
 * Получить историю платежей по кредиту
 */
export async function getCreditPayments(id: UUID): Promise<PaymentHistoryItem[]> {
  return await apiClient.get<PaymentHistoryItem[]>(`${BASE_URL}/${id}/payments`)
}

/**
 * Получить сводку по кредиту
 */
export async function getCreditSummary(id: UUID): Promise<CreditSummary> {
  return await apiClient.get<CreditSummary>(`${BASE_URL}/${id}/summary`)
}

/**
 * Получить список ближайших платежей по всем кредитам
 */
export async function getUpcomingPayments(limit = 10): Promise<UpcomingPayment[]> {
  return await apiClient.get<UpcomingPayment[]>(
    `${BASE_URL}/upcoming-payments?limit=${limit}`
  )
}

/**
 * Получить общую сводку по всем активным кредитам
 */
export async function getAllCreditsSummary(): Promise<AllCreditsSummary> {
  return await apiClient.get<AllCreditsSummary>(`${BASE_URL}/summary`)
}
