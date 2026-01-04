import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  X,
  Clock,
  CheckCircle,
  SkipForward,
  Lock,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CategoryIcon } from '@/components/common'
import { cn } from '@/lib/utils'
import type { PlannedExpenseWithDetails, PlannedExpenseStatus } from '@/lib/api/types'

interface PlannedExpensesSectionProps {
  expenses: PlannedExpenseWithDetails[]
  onConfirm: (id: string) => Promise<void>
  onSkip: (id: string) => Promise<void>
  onGenerate?: () => Promise<void>
  isGenerating?: boolean
  isPending?: boolean
  /** Слот для кнопки добавления */
  addButton?: React.ReactNode
}

const STATUS_CONFIG: Record<
  PlannedExpenseStatus,
  { label: string; icon: typeof Clock; color: string }
> = {
  pending: { label: 'Ожидает', icon: Clock, color: 'text-amber-500' },
  confirmed: { label: 'Оплачено', icon: CheckCircle, color: 'text-emerald-500' },
  skipped: { label: 'Пропущено', icon: SkipForward, color: 'text-muted-foreground' },
}

export function PlannedExpensesSection({
  expenses,
  onConfirm,
  onSkip,
  onGenerate,
  isGenerating,
  isPending,
  addButton,
}: PlannedExpensesSectionProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  // Извлечь число из nullable типа бэкенда (может быть {Float64: number, Valid: boolean} или просто number)
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

  const handleConfirm = async (id: string) => {
    setProcessingId(id)
    try {
      await onConfirm(id)
    } finally {
      setProcessingId(null)
    }
  }

  const handleSkip = async (id: string) => {
    setProcessingId(id)
    try {
      await onSkip(id)
    } finally {
      setProcessingId(null)
    }
  }

  // Группировка: pending сначала, потом confirmed, потом skipped
  const sortedExpenses = [...expenses].sort((a, b) => {
    const statusOrder = { pending: 0, confirmed: 1, skipped: 2 }
    const orderDiff = statusOrder[a.status] - statusOrder[b.status]
    if (orderDiff !== 0) return orderDiff
    return new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime()
  })

  const pendingExpenses = expenses.filter((e) => e.status === 'pending')
  const confirmedExpenses = expenses.filter((e) => e.status === 'confirmed')

  const totals = {
    planned: expenses.reduce((sum, e) => sum + e.planned_amount, 0),
    confirmed: confirmedExpenses.reduce(
      (sum, e) => sum + (getActualAmount(e.actual_amount) ?? e.planned_amount),
      0
    ),
    pending: pendingExpenses.reduce((sum, e) => sum + e.planned_amount, 0),
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Обязательные расходы на месяц
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                <Clock className="mr-1 h-3 w-3" />
                {pendingExpenses.length} ожидает
              </Badge>
              {addButton}
              {onGenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw
                    className={cn(
                      'mr-2 h-4 w-4',
                      isGenerating && 'animate-spin'
                    )}
                  />
                  Сгенерировать
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {expenses.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/30">
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Нет запланированных обязательных расходов
              </p>
              {onGenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerate}
                  disabled={isGenerating}
                >
                  Сгенерировать из шаблонов
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Статья</TableHead>
                  <TableHead className="w-[120px] text-right">Сумма</TableHead>
                  <TableHead className="w-[100px] text-center">Статус</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.map((expense) => {
                  const statusConfig = STATUS_CONFIG[expense.status]
                  const StatusIcon = statusConfig.icon
                  const isProcessing = processingId === expense.id

                  return (
                    <TableRow
                      key={expense.id}
                      className={cn(
                        'group',
                        expense.status === 'skipped' && 'opacity-50'
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <CategoryIcon
                            code={expense.category_code}
                            color={expense.category_color}
                            size="md"
                          />
                          <div>
                            <p className="font-medium">{expense.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {expense.category_name}
                              {expense.fund_name && ` • ${expense.fund_name}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right tabular-nums font-semibold text-base">
                        {(() => {
                          const actualAmount = getActualAmount(expense.actual_amount)
                          if (expense.status === 'confirmed' && actualAmount != null) {
                            return (
                              <span className="text-emerald-500">
                                {formatMoney(actualAmount)} ₽
                              </span>
                            )
                          }
                          return (
                            <span
                              className={
                                expense.status === 'skipped'
                                  ? 'text-muted-foreground line-through'
                                  : ''
                              }
                            >
                              {formatMoney(expense.planned_amount)} ₽
                            </span>
                          )
                        })()}
                      </TableCell>

                      <TableCell className="text-center">
                        <div
                          className={cn(
                            'inline-flex items-center gap-1 text-xs',
                            statusConfig.color
                          )}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig.label}
                        </div>
                      </TableCell>

                      <TableCell>
                        {expense.status === 'pending' && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleConfirm(expense.id)}
                              disabled={isPending || isProcessing}
                              title="Отметить оплаченным"
                            >
                              <Check className="h-4 w-4 text-emerald-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSkip(expense.id)}
                              disabled={isPending || isProcessing}
                              title="Пропустить"
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold text-base">Итого</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-base">
                    {formatMoney(totals.planned)} ₽
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm text-emerald-500 font-medium">
                      {formatMoney(totals.confirmed)} ₽ оплачено
                    </span>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
