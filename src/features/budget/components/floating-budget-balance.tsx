import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingBudgetBalanceProps {
  /** Доступно для планирования = Ожидаемый доход - План по категориям - Обязательные - Распределения в фонды */
  availableForPlanning: number
  /** Реально доступно = Полученный доход - Фактические расходы - Подтверждённые распределения */
  actuallyAvailable: number
  isVisible?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

export function FloatingBudgetBalance({
  availableForPlanning,
  actuallyAvailable,
  isVisible = true,
}: FloatingBudgetBalanceProps) {
  const isPlanningNegative = availableForPlanning < 0
  const isActualNegative = actuallyAvailable < 0

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
                    isPlanningNegative ? 'text-destructive' : 'text-violet-500'
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
