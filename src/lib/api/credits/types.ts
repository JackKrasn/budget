import type { ISODate, UUID } from '../types'

// Re-export UUID for convenience
export type { UUID } from '../types'

// Credit statuses
export type CreditStatus = 'active' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'completed' | 'cancelled'

// Credit creation request
export interface CreateCreditRequest {
  name: string
  principalAmount: number
  interestRate: number // Процентная ставка (3 = 3%, 12.5 = 12.5%) - бэкенд сам конвертирует в decimal
  termMonths: number
  startDate: ISODate // YYYY-MM-DD
  paymentDay: number // День месяца для платежа (1-31)
  accountId: UUID
  categoryId: UUID
  paymentsMade?: number // Количество уже сделанных платежей (для существующих кредитов)
  notes?: string
}

// Credit update request
export interface UpdateCreditRequest {
  name?: string
  accountId?: UUID
  categoryId?: UUID
  paymentDay?: number
  status?: CreditStatus
  notes?: string
}

// Credit entity
export interface Credit {
  id: UUID
  name: string
  principal_amount: number
  interest_rate: number
  term_months: number
  start_date: ISODate
  payment_day: number
  account_id: UUID
  category_id: UUID
  status: CreditStatus
  notes?: string
  created_at: string
  updated_at: string
}

// Credit list row (with joined account and category info)
export interface CreditListRow {
  id: UUID
  name: string
  principal_amount: number
  interest_rate: number
  term_months: number
  start_date: ISODate
  payment_day: number
  account_id: UUID
  account_name: string
  category_id: UUID
  category_name: string
  category_code: string
  status: CreditStatus
  notes?: string
  created_at: string
  updated_at: string
}

// Schedule item (payment in schedule)
export interface ScheduleItem {
  id: UUID
  creditId: UUID
  paymentNumber: number
  dueDate: ISODate
  principalPart: number
  interestPart: number
  totalPayment: number
  remainingBalance: number
  isPaid: boolean
}

// Credit with full schedule
export interface CreditWithSchedule {
  id: UUID
  name: string
  principal_amount: number
  interest_rate: number
  term_months: number
  start_date: ISODate
  payment_day: number
  account_id: UUID
  account_name: string
  category_id: UUID
  category_name: string
  category_code: string
  status: CreditStatus
  notes?: string
  created_at: string
  updated_at: string
  schedule: ScheduleItem[]
}

// Payment history item
export interface PaymentHistoryItem {
  id: UUID
  creditId: UUID
  scheduleId: UUID
  expenseId: UUID
  paymentNumber: number
  dueDate: ISODate
  paymentDate: ISODate
  principalPaid: number
  interestPaid: number
  totalPaid: number
  status: PaymentStatus
}

// Upcoming payment
export interface UpcomingPayment {
  id: UUID
  creditId: UUID
  creditName: string
  paymentNumber: number
  dueDate: ISODate
  principalPart: number
  interestPart: number
  totalPayment: number
}

// Credit summary
export interface CreditSummary {
  originalPrincipal: number
  remainingPrincipal: number
  totalPrincipalPaid: number
  totalInterestPaid: number
  totalInterestToPay: number
  totalPaid: number
  monthlyPayment: number
  paymentsMade: number
  paymentsRemaining: number
  totalPayments: number
  progressPercent: number
}

// All credits summary
export interface AllCreditsSummary {
  totalCredits: number
  totalPrincipal: number
  totalRemaining: number
  totalInterestPaid: number
}

// API response types
export interface CreditsListResponse {
  data: CreditListRow[]
  total: number
}
