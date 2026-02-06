import { apiClient } from './client'
import type {
  ExpenseTag,
  ExpenseTagsListResponse,
  CreateExpenseTagRequest,
  UpdateExpenseTagRequest,
  TagStatisticsParams,
  TagStatisticsResponse,
} from './types'

const ENDPOINT = '/expense-tags'

export const expenseTagsApi = {
  /**
   * Получить список всех тегов расходов
   */
  list: () => apiClient.get<ExpenseTagsListResponse>(ENDPOINT),

  /**
   * Создать новый тег
   */
  create: (data: CreateExpenseTagRequest) =>
    apiClient.post<ExpenseTag>(ENDPOINT, data),

  /**
   * Обновить тег
   */
  update: (id: string, data: UpdateExpenseTagRequest) =>
    apiClient.patch<ExpenseTag>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить тег
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),

  /**
   * Получить статистику по тегу (группировка по другим тегам и категориям)
   */
  getStatistics: (id: string, params?: TagStatisticsParams) => {
    const searchParams = new URLSearchParams()
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    const query = searchParams.toString()
    return apiClient.get<TagStatisticsResponse>(
      `${ENDPOINT}/${id}/statistics${query ? `?${query}` : ''}`
    )
  },
}
