import { motion } from 'framer-motion'
import { Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FundIcon } from '@/components/common/category-icon'
import { cn } from '@/lib/utils'
import type { IncomeDistribution } from '@/lib/api/types'

interface IncomeDistributionCardProps {
  distribution: IncomeDistribution
  incomeAmount: number // Общая сумма дохода для расчёта процента
  onConfirm: () => void
  isConfirming?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function IncomeDistributionCard({
  distribution,
  incomeAmount,
  onConfirm,
  isConfirming,
}: IncomeDistributionCardProps) {
  const isCompleted = distribution.is_completed
  const actualAmount = distribution.actual_amount ?? 0
  const displayAmount = isCompleted ? actualAmount : distribution.planned_amount

  // Расчёт процента от общей суммы дохода
  const percentage = incomeAmount > 0
    ? Math.round((displayAmount / incomeAmount) * 100)
    : 0

  const progress = distribution.planned_amount > 0
    ? Math.round((actualAmount / distribution.planned_amount) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group flex items-center gap-4 rounded-xl border p-4 transition-all',
        isCompleted
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30'
      )}
    >
      {/* Fund Icon */}
      <FundIcon
        name={distribution.fund_name}
        color={distribution.fund_color}
        size="lg"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{distribution.fund_name}</p>
          {/* Процент распределения */}
          <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-500">
            {percentage}%
          </span>
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
              <Check className="h-3 w-3" />
              Подтверждено
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
              <Clock className="h-3 w-3" />
              Ожидает
            </span>
          )}
        </div>

        {/* Progress bar for completed distributions */}
        {isCompleted && distribution.actual_amount !== distribution.planned_amount && (
          <div className="mt-2">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Факт: {formatMoney(actualAmount)} ₽</span>
              <span>План: {formatMoney(distribution.planned_amount)} ₽</span>
            </div>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={cn(
          "text-lg font-semibold tabular-nums",
          isCompleted ? "text-emerald-500" : "text-muted-foreground"
        )}>
          {formatMoney(displayAmount)} ₽
        </p>
        {!isCompleted && (
          <p className="text-xs text-muted-foreground">запланировано</p>
        )}
      </div>

      {/* Confirm Button */}
      {!isCompleted && (
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isConfirming}
          className="shrink-0"
        >
          {isConfirming ? 'Подтверждение...' : 'Подтвердить'}
        </Button>
      )}
    </motion.div>
  )
}
