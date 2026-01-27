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
  PiggyBank,
  Trash2,
  Wallet,
  AlertCircle,
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
import type { PlannedExpenseWithDetails, PlannedExpenseStatus, AccountWithType, ExpenseCategoryWithTags } from '@/lib/api/types'
import { ConfirmPlannedExpenseDialog } from './confirm-planned-expense-dialog'
import { CURRENCY_SYMBOLS } from '@/types'

interface PlannedExpensesSectionProps {
  expenses: PlannedExpenseWithDetails[]
  accounts: AccountWithType[]
  /** Список категорий для обогащения данных (если бэкенд не возвращает детали) */
  categories?: ExpenseCategoryWithTags[]
  onConfirm: (
    id: string,
    data: {
      actualAmount?: number
      accountId: string
      categoryId?: string
      date: string
      notes?: string
      tagIds?: string[]
    }
  ) => Promise<void>
  onSkip: (id: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onGenerate?: () => Promise<void>
  isGenerating?: boolean
  isPending?: boolean
  /** Слот для кнопки добавления */
  addButton?: React.ReactNode
  /** Скрыть обёртку Card (когда используется внутри CollapsibleSection) */
  hideWrapper?: boolean
  /** Callback при клике на запланированный расход (переход на страницу детализации) */
  onExpenseClick?: (expenseId: string) => void
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
  accounts,
  categories,
  onConfirm,
  onSkip,
  onDelete,
  onGenerate,
  isGenerating,
  isPending,
  addButton,
  hideWrapper,
  onExpenseClick,
}: PlannedExpensesSectionProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<PlannedExpenseWithDetails | null>(null)

  // Создаём Map для быстрого поиска категорий по id
  const categoriesMap = new Map(categories?.map((c) => [c.id, c]) ?? [])

  // Обогащаем расходы данными о категориях (если бэкенд не вернул)
  const enrichedExpenses = expenses.map((expense) => {
    // Ищем категорию по id
    const category = categoriesMap.get(expense.category_id)
    if (category) {
      // Всегда используем данные из категорий, если они есть
      return {
        ...expense,
        category_name: category.name,
        category_code: category.code,
        category_icon: category.icon,
        category_color: category.color,
      }
    }
    return expense
  })

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Форматирование суммы с символом валюты
  const formatMoneyWithCurrency = (amount: number, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency
    return `${formatMoney(amount)} ${symbol}`
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

  // Извлечь дату из nullable типа бэкенда (может быть {Time: string, Valid: boolean} или просто string)
  const getDateString = (
    value: string | { Time: string; Valid: boolean } | null | undefined
  ): string => {
    if (value == null) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object' && 'Valid' in value && value.Valid) {
      return value.Time
    }
    return ''
  }

  const handleOpenConfirmDialog = (expense: PlannedExpenseWithDetails) => {
    setSelectedExpense(expense)
    setConfirmDialogOpen(true)
  }

  const handleConfirm = async (data: {
    actualAmount?: number
    accountId: string
    categoryId?: string
    date: string
    notes?: string
    tagIds?: string[]
  }) => {
    if (!selectedExpense) return

    setProcessingId(selectedExpense.id)
    try {
      await onConfirm(selectedExpense.id, data)
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

  const handleDelete = async (id: string) => {
    if (!onDelete) return
    if (!confirm('Удалить этот запланированный расход?')) return

    setProcessingId(id)
    try {
      await onDelete(id)
    } finally {
      setProcessingId(null)
    }
  }

  // Группировка: pending сначала, потом confirmed, потом skipped
  const sortedExpenses = [...enrichedExpenses].sort((a, b) => {
    const statusOrder = { pending: 0, confirmed: 1, skipped: 2 }
    const orderDiff = statusOrder[a.status] - statusOrder[b.status]
    if (orderDiff !== 0) return orderDiff
    const dateA = getDateString(a.planned_date)
    const dateB = getDateString(b.planned_date)
    return new Date(dateA).getTime() - new Date(dateB).getTime()
  })

  const pendingExpenses = enrichedExpenses.filter((e) => e.status === 'pending')
  const confirmedExpenses = enrichedExpenses.filter((e) => e.status === 'confirmed')

  // Хелпер для извлечения exchange_rate
  const getExchangeRate = (e: PlannedExpenseWithDetails): number => {
    return getActualAmount(e.exchange_rate as number | { Float64: number; Valid: boolean } | null) ?? 1
  }

  // Группировка по фондам (используем exchange_rate из расхода)
  const fundBreakdown = enrichedExpenses.reduce<Record<string, { name: string; amount: number }>>((acc, e) => {
    const fundedAmount = getActualAmount(e.funded_amount)
    if (fundedAmount && e.fund_name && e.fund_id) {
      if (!acc[e.fund_id]) {
        acc[e.fund_id] = { name: e.fund_name, amount: 0 }
      }
      // Конвертируем по курсу расхода
      acc[e.fund_id].amount += fundedAmount * getExchangeRate(e)
    }
    return acc
  }, {})

  const totals = {
    // Используем planned_amount_base — уже в RUB
    planned: enrichedExpenses.reduce((sum, e) => sum + e.planned_amount_base, 0),
    confirmed: confirmedExpenses.reduce((sum, e) => {
      const actualAmount = getActualAmount(e.actual_amount)
      const rate = getExchangeRate(e)
      if (actualAmount !== null && rate !== 1) {
        return sum + actualAmount * rate
      }
      return sum + e.planned_amount_base
    }, 0),
    pending: pendingExpenses.reduce((sum, e) => sum + e.planned_amount_base, 0),
    // Финансирование из фондов (funded_amount приходит как { Float64, Valid })
    fromFunds: enrichedExpenses
      .filter((e) => getActualAmount(e.funded_amount))
      .reduce((sum, e) => sum + (getActualAmount(e.funded_amount) ?? 0) * getExchangeRate(e), 0),
    pendingFromFunds: pendingExpenses
      .filter((e) => getActualAmount(e.funded_amount))
      .reduce((sum, e) => sum + (getActualAmount(e.funded_amount) ?? 0) * getExchangeRate(e), 0),
    fromBudget: enrichedExpenses.reduce((sum, e) => sum + e.planned_amount_base, 0) -
      enrichedExpenses
        .filter((e) => getActualAmount(e.funded_amount))
        .reduce((sum, e) => sum + (getActualAmount(e.funded_amount) ?? 0) * getExchangeRate(e), 0),
    fundBreakdown: Object.values(fundBreakdown),
  }

  const content = (
    <>
      {enrichedExpenses.length === 0 ? (
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
              <TableHead className="w-[100px] text-center">Дата</TableHead>
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
                    expense.status === 'skipped' && 'opacity-50',
                    onExpenseClick && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={() => onExpenseClick?.(expense.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CategoryIcon
                        code={expense.category_code}
                        iconName={expense.category_icon}
                        color={expense.status === 'confirmed' ? '#22c55e' : expense.category_color}
                        size="md"
                      />
                      <div>
                        <p className="font-medium">{expense.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.category_name}
                        </p>
                        {expense.account_name && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Wallet className="h-3 w-3" />
                            {expense.account_name}
                          </p>
                        )}
                        {getActualAmount(expense.funded_amount) && expense.fund_name ? (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <PiggyBank className="h-3 w-3" />
                            Из фонда «{expense.fund_name}»: {formatMoneyWithCurrency(getActualAmount(expense.funded_amount) ?? 0, expense.currency || 'RUB')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    {(() => {
                      const plannedDate = getDateString(expense.planned_date)
                      if (!plannedDate) return <span className="text-muted-foreground">—</span>
                      const date = new Date(plannedDate)
                      return (
                        <span className="text-sm tabular-nums">
                          {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </span>
                      )
                    })()}
                  </TableCell>

                  <TableCell className="text-right">
                    {(() => {
                      const actualAmount = getActualAmount(expense.actual_amount)
                      const currency = expense.currency || 'RUB'
                      const currencySymbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency
                      const isNonRub = currency !== 'RUB'
                      // Используем exchange_rate из расхода вместо поиска по курсам
                      const rate = getExchangeRate(expense)

                      if (expense.status === 'confirmed' && actualAmount != null) {
                        const savings = expense.planned_amount - actualAmount
                        return (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-emerald-500 font-semibold text-base tabular-nums">
                              {formatMoney(actualAmount)} {currencySymbol}
                            </span>
                            {isNonRub && (
                              <span className="text-xs text-muted-foreground tabular-nums">
                                ≈ {formatMoney(actualAmount * rate)} ₽
                              </span>
                            )}
                            {savings !== 0 && (
                              <span
                                className={cn(
                                  'text-xs tabular-nums',
                                  savings > 0 ? 'text-emerald-600' : 'text-destructive'
                                )}
                              >
                                {savings > 0 ? '💰 ' : ''}
                                {savings > 0 ? '-' : '+'}
                                {formatMoney(Math.abs(savings))} {currencySymbol}
                              </span>
                            )}
                          </div>
                        )
                      }
                      return (
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className={cn(
                              'tabular-nums font-semibold text-base',
                              expense.status === 'skipped'
                                ? 'text-muted-foreground line-through'
                                : 'text-muted-foreground'
                            )}
                          >
                            {formatMoney(expense.planned_amount)} {currencySymbol}
                          </span>
                          {isNonRub && expense.status !== 'skipped' && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              ≈ {formatMoney(expense.planned_amount_base)} ₽
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </TableCell>

                  <TableCell className="text-center">
                    {(() => {
                      // Проверяем просрочку для pending
                      if (expense.status === 'pending') {
                        const plannedDate = getDateString(expense.planned_date)
                        if (plannedDate) {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          const expenseDate = new Date(plannedDate)
                          expenseDate.setHours(0, 0, 0, 0)
                          if (expenseDate < today) {
                            return (
                              <div className="inline-flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Просрочен
                              </div>
                            )
                          }
                        }
                      }
                      return (
                        <div
                          className={cn(
                            'inline-flex items-center gap-1 text-xs',
                            statusConfig.color
                          )}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig.label}
                        </div>
                      )
                    })()}
                  </TableCell>

                  <TableCell>
                    {expense.status === 'pending' && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenConfirmDialog(expense)
                          }}
                          disabled={isPending || isProcessing}
                          title="Подтвердить оплату"
                        >
                          <Check className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSkip(expense.id)
                          }}
                          disabled={isPending || isProcessing}
                          title="Пропустить"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(expense.id)
                            }}
                            disabled={isPending || isProcessing}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/50">
              <TableCell className="font-semibold text-base">
                <div>Итого</div>
                {totals.fromFunds > 0 && (
                  <div className="font-normal text-xs space-y-0.5 mt-1 text-muted-foreground">
                    <div>
                      Из бюджета: <span className="text-foreground">{formatMoney(totals.fromBudget)} ₽</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <PiggyBank className="h-3 w-3" />
                      Из фондов: {formatMoney(totals.fromFunds)} ₽
                      {totals.fundBreakdown.length > 0 && (
                        <span>
                          ({totals.fundBreakdown.map((fund, idx) => (
                            <span key={idx}>
                              {idx > 0 && ', '}
                              {fund.name}
                            </span>
                          ))})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell></TableCell>
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

      <ConfirmPlannedExpenseDialog
        expense={selectedExpense}
        accounts={accounts}
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  )

  if (hideWrapper) {
    return <div>{content}</div>
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
              Запланированные расходы на месяц
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
          {content}
        </CardContent>
      </Card>
    </motion.div>
  )
}
