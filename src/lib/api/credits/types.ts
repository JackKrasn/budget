import type { ISODate, UUID } from '../types'

// Re-export UUID for convenience
export type { UUID } from '../types'

// Credit statuses
export type CreditStatus = 'active' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'completed' | 'cancelled'

// Early payment reduction types
export type EarlyPaymentReductionType = 'reduce_payment' | 'reduce_term'

// Credit creation request
export interface CreateCreditRequest {
  name: string
  principalAmount: number
  currentBalance?: number // Текущий остаток долга (для существующих кредитов)
  interestRate: number // Процентная ставка (3 = 3%, 12.5 = 12.5%) - бэкенд сам конвертирует в decimal
  termMonths?: number // Опционально, если указан endDate
  endDate?: ISODate // Дата последнего платежа (приоритет над termMonths)
  monthlyPayment?: number // Текущий платёж от банка (если был ЧДП)
  startDate: ISODate // YYYY-MM-DD
  paymentDay?: number // День месяца для платежа (1-31)
  accountId?: UUID
  categoryId?: UUID
  notes?: string
}

// Credit update request
export interface UpdateCreditRequest {
  name?: string
  accountId?: UUID
  categoryId?: UUID
  paymentDay?: number
  endDate?: ISODate
  monthlyPayment?: number
  status?: CreditStatus
  notes?: string
}

// Credit entity
export interface Credit {
  id: UUID
  name: string
  principal_amount: number
  current_balance: number // Текущий остаток долга
  interest_rate: number
  term_months: number
  start_date: ISODate
  end_date?: ISODate // Дата последнего платежа
  monthly_payment?: number // Платёж от банка (если указан)
  payment_day: number
  account_id?: UUID
  category_id?: UUID
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
  current_balance: number // Текущий остаток долга
  interest_rate: number
  term_months: number
  start_date: ISODate
  end_date?: ISODate // Дата последнего платежа
  monthly_payment?: number // Платёж от банка (если указан)
  payment_day: number
  account_id?: UUID
  account_name?: string
  category_id?: UUID
  category_name?: string
  category_code?: string
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
  isManual: boolean // Был ли платёж изменён вручную
  originalTotalPayment?: number // Оригинальная сумма (если isManual=true)
}

// Update schedule item request
export interface UpdateScheduleItemRequest {
  totalPayment: number
}

// Credit with full schedule
export interface CreditWithSchedule {
  id: UUID
  name: string
  principal_amount: number
  current_balance: number // Текущий остаток долга
  interest_rate: number
  term_months: number
  start_date: ISODate
  end_date?: ISODate // Дата последнего платежа
  monthly_payment?: number // Платёж от банка (если указан)
  payment_day: number
  account_id?: UUID
  account_name?: string
  category_id?: UUID
  category_name?: string
  category_code?: string
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

// Early payment (частично-досрочный платёж)
export interface EarlyPayment {
  id: UUID
  creditId: UUID
  paymentDate: ISODate
  amount: number
  balanceBefore: number
  balanceAfter: number
  reductionType: EarlyPaymentReductionType
  notes?: string
  createdAt: string
}

// Create early payment request
export interface CreateEarlyPaymentRequest {
  paymentDate: ISODate
  amount: number
  reductionType: EarlyPaymentReductionType
  notes?: string
}
