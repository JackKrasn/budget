import { apiClient } from './client'
import type {
  ExpenseCategory,
  ExpenseCategoryWithTags,
  ExpenseCategoriesListResponse,
  ExpenseCategoriesListParams,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
} from './types'

const ENDPOINT = '/expense-categories'

export const expenseCategoriesApi = {
  /**
   * Получить список всех категорий расходов с тегами
   */
  list: (params?: ExpenseCategoriesListParams) =>
    apiClient.get<ExpenseCategoriesListResponse>(ENDPOINT, params),

  /**
   * Получить категорию по ID с тегами
   */
  get: (id: string) =>
    apiClient.get<ExpenseCategoryWithTags>(`${ENDPOINT}/${id}`),

  /**
   * Создать новую категорию расходов
   */
  create: (data: CreateExpenseCategoryRequest) =>
    apiClient.post<ExpenseCategory>(ENDPOINT, data),

  /**
   * Обновить категорию расходов
   */
  update: (id: string, data: UpdateExpenseCategoryRequest) =>
    apiClient.patch<ExpenseCategory>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить категорию расходов
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),

  /**
   * Добавить тег к категории
   */
  addTag: (categoryId: string, tagId: string) =>
    apiClient.post<void>(`${ENDPOINT}/${categoryId}/tags/${tagId}`),

  /**
   * Удалить тег у категории
   */
  removeTag: (categoryId: string, tagId: string) =>
    apiClient.delete<void>(`${ENDPOINT}/${categoryId}/tags/${tagId}`),
}
