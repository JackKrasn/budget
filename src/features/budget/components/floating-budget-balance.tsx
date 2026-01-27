import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Wallet, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CURRENCY_SYMBOLS } from '@/types'

interface FloatingBudgetBalanceProps {
  /** Доступно для планирования = Ожидаемый доход - План по категориям - Обязательные - Распределения в фонды */
  availableForPlanning: number
  /** Реально доступно = Полученный доход - Фактические расходы - Подтверждённые распределения */
  actuallyAvailable: number
  /** Расходы по валютам */
  expensesByCurrency?: Record<string, number>
  /** Callback при клике на кнопку расходов */
  onExpensesClick?: () => void
  isVisible?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
}

export function FloatingBudgetBalance({
  availableForPlanning,
  actuallyAvailable,
  expensesByCurrency,
  onExpensesClick,
  isVisible = true,
}: FloatingBudgetBalanceProps) {
  const isPlanningNegative = availableForPlanning < 0
  const isActualNegative = actuallyAvailable < 0

  // Фильтруем валюты с ненулевыми расходами
  const currenciesWithExpenses = expensesByCurrency
    ? Object.entries(expensesByCurrency).filter(([, amount]) => amount > 0)
    : []
  const hasExpenses = currenciesWithExpenses.length > 0

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="flex gap-2">
            {/* Для планирования */}
            <div
              className={cn(
                'flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 shadow-2xl backdrop-blur-xl',
                'bg-card/90 border-border/50',
                isPlanningNegative && 'border-destructive/30 bg-destructive/5'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  isPlanningNegative ? 'bg-destructive/10' : 'bg-violet-500/10'
                )}
              >
                <Calculator
                  className={cn(
                    'h-4 w-4',
                    isPlanningNegative ? 'text-destructive' : 'text-violet-500'
                  )}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] leading-tight text-muted-foreground">
                  Для планирования
                </span>
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums leading-tight',
                    isPlanningNegative ? 'text-destructive' : 'text-foreground'
                  )}
                >
                  {isPlanningNegative ? '-' : ''}
                  {formatMoney(availableForPlanning)} ₽
                </span>
              </div>
            </div>

            {/* Реально доступно */}
            <div
              className={cn(
                'flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 shadow-2xl backdrop-blur-xl',
                'bg-card/90 border-border/50',
                isActualNegative && 'border-destructive/30 bg-destructive/5'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  isActualNegative ? 'bg-destructive/10' : 'bg-cyan-500/10'
                )}
              >
                <Wallet
                  className={cn(
                    'h-4 w-4',
                    isActualNegative ? 'text-destructive' : 'text-cyan-500'
                  )}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] leading-tight text-muted-foreground">
                  Реально свободно
                </span>
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums leading-tight',
                    isActualNegative ? 'text-destructive' : 'text-cyan-500'
                  )}
                >
                  {isActualNegative ? '-' : ''}
                  {formatMoney(actuallyAvailable)} ₽
                </span>
              </div>
            </div>

            {/* Расходы по валютам */}
            {hasExpenses && (
              <div
                className={cn(
                  'flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 shadow-2xl backdrop-blur-xl cursor-pointer transition-all',
                  'bg-card/90 border-border/50 hover:border-orange-500/50 hover:bg-orange-500/5'
                )}
                onClick={onExpensesClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onExpensesClick?.()}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <Receipt className="h-4 w-4 text-orange-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    Расходы
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currenciesWithExpenses.map(([currency, amount]) => (
                      <span
                        key={currency}
                        className="text-sm font-bold tabular-nums leading-tight text-orange-500"
                      >
                        {formatMoney(amount)} {CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
