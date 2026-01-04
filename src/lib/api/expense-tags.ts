import { apiClient } from './client'
import type {
  ExpenseTag,
  ExpenseTagsListResponse,
  CreateExpenseTagRequest,
  UpdateExpenseTagRequest,
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
}
