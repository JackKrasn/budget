import { apiClient } from '../client'
import type {
  ConfirmWithExpenseRequest,
  ConfirmWithExpenseResponse,
  UUID,
} from './types'

const BASE_URL = '/planned-expenses'

/**
 * Подтвердить запланированный расход с автосозданием расхода
 * Используется для подтверждения кредитных платежей
 */
export async function confirmPlannedExpenseWithExpense(
  id: UUID,
  data: ConfirmWithExpenseRequest
): Promise<ConfirmWithExpenseResponse> {
  const response = await apiClient.post<ConfirmWithExpenseResponse>(
    `${BASE_URL}/${id}/confirm-with-expense`,
    data
  )
  return response
}
