import type { ISODate, UUID } from '../types'

// Re-export UUID for convenience
export type { UUID } from '../types'

export type PlannedExpenseStatus = 'pending' | 'confirmed' | 'skipped'

export interface PlannedExpense {
  id: UUID
  budget_id: UUID
  name: string
  planned_amount: number
  category_id?: UUID
  planned_date?: ISODate
  status: PlannedExpenseStatus
  notes?: string
  actual_expense_id?: UUID
  created_at: string
  updated_at: string
}

export interface ConfirmWithExpenseRequest {
  accountId?: UUID
  date?: ISODate // YYYY-MM-DD, по умолчанию сегодня
  currency?: string // по умолчанию RUB
  description?: string
}

export interface ConfirmWithExpenseResponse {
  plannedExpense: PlannedExpense
  expenseId: UUID
  creditPaymentId?: UUID
}
