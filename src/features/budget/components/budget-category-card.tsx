import { motion } from 'framer-motion'
import { Edit2, AlertTriangle, CheckCircle, Lock, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { BudgetItemWithCategory } from '@/lib/api/types'

interface BudgetCategoryCardProps {
  item: BudgetItemWithCategory
  onEdit: () => void
  isFixed?: boolean
}

export function BudgetCategoryCard({
  item,
  onEdit,
  isFixed = false,
}: BudgetCategoryCardProps) {
  // plannedAmount already includes plannedExpensesSum (formula: plannedAmount = plannedExpensesSum + bufferAmount)
  const totalPlanned = item.plannedAmount

  const progress =
    totalPlanned > 0
      ? Math.min((item.actualAmount / totalPlanned) * 100, 100)
      : 0

  const variance = totalPlanned - item.actualAmount
  const isOverBudget = variance < 0
  const overBudgetPercent =
    totalPlanned > 0 && isOverBudget
      ? Math.round(((item.actualAmount - totalPlanned) / totalPlanned) * 100)
      : 0

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card
        className={cn(
          'relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-md',
          isOverBudget && 'border-destructive/30 bg-destructive/5'
        )}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                style={{ backgroundColor: item.categoryColor + '20' }}
              >
                {item.categoryIcon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{item.categoryName}</h3>
                  {isFixed && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.categoryCode}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Amounts */}
          <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Факт</p>
              <p className="font-semibold tabular-nums">
                {formatMoney(item.actualAmount)} ₽
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">План</p>
              <p className="font-semibold tabular-nums">
                {formatMoney(totalPlanned)} ₽
              </p>
            </div>
          </div>

          {/* Planned Expenses */}
          {item.plannedExpensesSum > 0 && (
            <div className="mb-3 rounded-md bg-blue-500/10 px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-muted-foreground">Запланировано платежей:</span>
                <span className="ml-auto font-semibold tabular-nums text-blue-500">
                  {formatMoney(item.plannedExpensesSum)} ₽
                </span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-2">
            <Progress
              value={progress}
              className={cn(
                'h-2',
                isOverBudget && '[&>div]:bg-destructive'
              )}
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {isOverBudget ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-destructive">
                    Перерасход {overBudgetPercent}%
                  </span>
                </>
              ) : variance > 0 ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500">
                    Остаток: {formatMoney(variance)} ₽
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Израсходовано</span>
              )}
            </div>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
