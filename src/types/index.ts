// === Базовые типы ===
export type UUID = string
export type ISODate = string
export type Currency = 'RUB' | 'USD' | 'EUR' | 'GEL' | 'TRY' | 'CNY' | 'AED'

// === Счета ===
export type AccountType = 'card' | 'cash' | 'deposit' | 'credit' | 'investment' | 'broker'

export interface Account {
  id: UUID
  name: string
  type: AccountType
  currency: Currency
  balance: number
  icon?: string
  color?: string
  bankName?: string
  isArchived: boolean
  createdAt: ISODate
  updatedAt: ISODate
}

// === Категории расходов ===
export type TransactionType = 'income' | 'expense'

export interface Category {
  id: UUID
  name: string
  type: TransactionType
  icon: string
  color: string
  parentId?: UUID
  isFixed: boolean
  isSystem: boolean
}

// === Бюджет ===
export interface BudgetPlan {
  id: UUID
  year: number
  monthlyPlans: MonthlyPlan[]
  totalPlannedIncome: number
  totalPlannedExpense: number
}

export interface MonthlyPlan {
  id: UUID
  month: number
  year: number
  categories: CategoryBudget[]
  plannedIncome: number
  plannedExpense: number
  actualIncome: number
  actualExpense: number
  availableBudget: number // Остаток после распределения по фондам
  isClosed: boolean
}

export interface CategoryBudget {
  categoryId: UUID
  planned: number
  actual: number
}

// === Активы ===
export type AssetType = 'cash_rub' | 'cash_usd' | 'cash_eur' | 'crypto' | 'stocks' | 'etf' | 'bonds' | 'deposit'

export interface Asset {
  id: UUID
  type: AssetType
  name: string
  ticker?: string
  amount: number
  currency: Currency
  currentPrice?: number
  accountId?: UUID
  createdAt: ISODate
  updatedAt: ISODate
}

// === Фонды ===
export type DistributionType = 'percentage' | 'fixed' | 'remainder'

export interface DistributionRule {
  type: DistributionType
  value?: number // % для percentage, сумма для fixed
}

export interface Fund {
  id: UUID
  name: string
  icon: string
  color: string
  targetAmount?: number
  deadline?: ISODate
  distributionRule: DistributionRule
  currentBalance: number // Текущий баланс фонда
  linkedAccountId?: UUID // Если фонд привязан к реальному счёту/активу
  isVirtual: boolean // true = виртуальный учёт, false = реальный счёт
  status: 'active' | 'completed' | 'paused'
  createdAt: ISODate
  updatedAt: ISODate
}

// === Доходы и распределение ===
export type IncomeSource = 'salary' | 'advance' | 'bonus' | 'freelance' | 'dividends' | 'other'

export interface Income {
  id: UUID
  source: IncomeSource
  amount: number
  currency: Currency
  date: ISODate
  description?: string
  distributions: IncomeDistribution[]
  remainingForBudget: number // Остаток на текущие расходы
  createdAt: ISODate
}

export interface IncomeDistribution {
  fundId: UUID
  plannedAmount: number // Запланировано (по правилам фонда)
  actualAmount: number // Фактически переведено
  isCompleted: boolean // Отмечено как переведённое
}

// === История операций с фондами ===
export interface FundTransaction {
  id: UUID
  fundId: UUID
  type: 'deposit' | 'withdrawal'
  amount: number
  incomeId?: UUID // Связь с доходом (если это распределение)
  date: ISODate
  note?: string
}

// === Настройки ===
export interface Settings {
  mainCurrency: Currency
  theme: 'light' | 'dark' | 'system'
}

// === Курсы валют ===
export interface ExchangeRate {
  from: Currency
  to: Currency
  rate: number
  updatedAt: ISODate
}

// === Утилиты для отображения ===
export const INCOME_SOURCE_LABELS: Record<IncomeSource, string> = {
  salary: 'Зарплата',
  advance: 'Аванс',
  bonus: 'Премия',
  freelance: 'Фриланс',
  dividends: 'Дивиденды',
  other: 'Другое',
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
  CNY: '¥',
  AED: 'د.إ',
}
