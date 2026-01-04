import { apiClient } from './client'
import type {
  Expense,
  ExpenseWithCategory,
  ExpensesListResponse,
  ExpensesListParams,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from './types'

const ENDPOINT = '/expenses'

export const expensesApi = {
  /**
   * Получить список расходов с фильтрацией
   */
  list: (params?: ExpensesListParams) =>
    apiClient.get<ExpensesListResponse>(ENDPOINT, params),

  /**
   * Получить расход по ID с информацией о финансировании из фондов
   */
  get: (id: string) =>
    apiClient.get<ExpenseWithCategory>(`${ENDPOINT}/${id}`),

  /**
   * Создать новый расход с опциональным финансированием из фондов
   */
  create: (data: CreateExpenseRequest) =>
    apiClient.post<ExpenseWithCategory>(ENDPOINT, data),

  /**
   * Обновить расход
   */
  update: (id: string, data: UpdateExpenseRequest) =>
    apiClient.patch<Expense>(`${ENDPOINT}/${id}`, data),

  /**
   * Удалить расход
   */
  delete: (id: string) => apiClient.delete<void>(`${ENDPOINT}/${id}`),
}
