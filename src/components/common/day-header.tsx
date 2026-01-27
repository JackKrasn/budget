import { cn } from '@/lib/utils'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    GEL: '₾',
    TRY: '₺',
  }
  return symbols[currency] || currency
}

export function formatDateHeader(date: string): string {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) {
    return 'Сегодня'
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Вчера'
  }

  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

interface CurrencyTotals {
  [currency: string]: number
}

interface DayHeaderProps {
  date: string
  expensesByCurrency?: CurrencyTotals
  transfersByCurrency?: CurrencyTotals
  adjustmentsByCurrency?: CurrencyTotals
  fundDepositsByCurrency?: CurrencyTotals
  className?: string
}

function CurrencyAmounts({
  label,
  totals,
  colorClass,
}: {
  label: string
  totals: CurrencyTotals
  colorClass: string
}) {
  const entries = Object.entries(totals)
  if (entries.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn('font-medium tabular-nums', colorClass)}>
        {entries.map(([currency, amount], index) => (
          <span key={currency}>
            {index > 0 && ', '}
            {formatMoney(amount)} {getCurrencySymbol(currency)}
          </span>
        ))}
      </span>
    </div>
  )
}

export function DayHeader({
  date,
  expensesByCurrency,
  transfersByCurrency,
  adjustmentsByCurrency,
  fundDepositsByCurrency,
  className,
}: DayHeaderProps) {
  const hasExpenses = expensesByCurrency && Object.keys(expensesByCurrency).length > 0
  const hasTransfers = transfersByCurrency && Object.keys(transfersByCurrency).length > 0
  const hasAdjustments = adjustmentsByCurrency && Object.keys(adjustmentsByCurrency).length > 0
  const hasFundDeposits = fundDepositsByCurrency && Object.keys(fundDepositsByCurrency).length > 0

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <h3 className="text-sm font-medium text-muted-foreground capitalize">
        {formatDateHeader(date)}
      </h3>
      <div className="flex items-center gap-3 text-xs flex-wrap justify-end">
        {hasExpenses && (
          <CurrencyAmounts
            label="Расходы"
            totals={expensesByCurrency}
            colorClass="text-rose-500"
          />
        )}
        {hasTransfers && (
          <CurrencyAmounts
            label="Переводы"
            totals={transfersByCurrency}
            colorClass="text-blue-500"
          />
        )}
        {hasAdjustments && (
          <CurrencyAmounts
            label="Корректировки"
            totals={adjustmentsByCurrency}
            colorClass="text-amber-500"
          />
        )}
        {hasFundDeposits && (
          <CurrencyAmounts
            label="В фонды"
            totals={fundDepositsByCurrency}
            colorClass="text-purple-500"
          />
        )}
      </div>
    </div>
  )
}

// Utility function to group expenses by currency
export function groupExpensesByCurrency<T extends { currency?: string; amount: number }>(
  expenses: T[]
): CurrencyTotals {
  return expenses.reduce((acc, expense) => {
    const currency = expense.currency || 'RUB'
    acc[currency] = (acc[currency] || 0) + expense.amount
    return acc
  }, {} as CurrencyTotals)
}
