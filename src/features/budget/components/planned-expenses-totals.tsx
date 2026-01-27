import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { CURRENCY_SYMBOLS } from '@/types'
import type { PlannedExpenseWithDetails } from '@/lib/api/types'

interface CurrencyTotal {
  planned: number
  confirmed: number
  pending: number
  skipped: number
  baseTotal: number // В базовой валюте (RUB)
}

interface PlannedExpensesTotalsProps {
  expenses: PlannedExpenseWithDetails[]
  className?: string
}

// Helper functions
const getActualAmount = (
  value: number | { Float64: number; Valid: boolean } | null | undefined
): number | null => {
  if (value == null) return null
  if (typeof value === 'number') return value
  if (typeof value === 'object' && 'Valid' in value && value.Valid) {
    return value.Float64
  }
  return null
}

const getExchangeRate = (e: PlannedExpenseWithDetails): number => {
  return getActualAmount(e.exchange_rate as number | { Float64: number; Valid: boolean } | null) ?? 1
}

export function PlannedExpensesTotals({ expenses, className }: PlannedExpensesTotalsProps) {
  const totals = useMemo(() => {
    const byCurrency: Record<string, CurrencyTotal> = {}
    let totalBaseAmount = 0

    for (const expense of expenses) {
      const currency = expense.currency || 'RUB'

      if (!byCurrency[currency]) {
        byCurrency[currency] = {
          planned: 0,
          confirmed: 0,
          pending: 0,
          skipped: 0,
          baseTotal: 0,
        }
      }

      const currencyData = byCurrency[currency]

      if (expense.status === 'pending') {
        currencyData.pending += expense.planned_amount
        currencyData.baseTotal += expense.planned_amount_base
        totalBaseAmount += expense.planned_amount_base
      } else if (expense.status === 'confirmed') {
        const actualAmount = getActualAmount(expense.actual_amount)
        if (actualAmount !== null) {
          currencyData.confirmed += actualAmount
          const rate = getExchangeRate(expense)
          currencyData.baseTotal += actualAmount * rate
          totalBaseAmount += actualAmount * rate
        } else {
          currencyData.confirmed += expense.planned_amount
          currencyData.baseTotal += expense.planned_amount_base
          totalBaseAmount += expense.planned_amount_base
        }
      }
      // Skipped не считаем в итогах
    }

    return { byCurrency, totalBaseAmount }
  }, [expenses])

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const currencyEntries = Object.entries(totals.byCurrency).filter(
    ([, data]) => data.pending > 0 || data.confirmed > 0
  )

  if (currencyEntries.length === 0) {
    return null
  }

  // Определяем есть ли несколько валют
  const hasMultipleCurrencies = currencyEntries.length > 1

  return (
    <div className={cn('border-t border-border/50 pt-3 mt-3', className)}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Итого</span>

        <div className="flex items-center gap-3 flex-wrap">
          {currencyEntries.map(([currency, data]) => {
            const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency
            const total = data.pending + data.confirmed

            return (
              <div key={currency} className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {formatMoney(total)} {symbol}
                </span>
                {(data.pending > 0 && data.confirmed > 0) && (
                  <span className="text-xs text-muted-foreground">
                    ({formatMoney(data.pending)} ожид. / {formatMoney(data.confirmed)} оплач.)
                  </span>
                )}
              </div>
            )
          })}

          {hasMultipleCurrencies && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground border-l border-border/50 pl-3">
              <span>≈</span>
              <span className="tabular-nums font-medium">
                {formatMoney(totals.totalBaseAmount)} ₽
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
