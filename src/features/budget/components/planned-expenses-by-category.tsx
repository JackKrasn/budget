import { useState, useMemo } from 'react'
import {
  Check,
  X,
  ChevronDown,
  Clock,
  CheckCircle,
  SkipForward,
  PiggyBank,
  Trash2,
  Wallet,
  AlertCircle,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CategoryIcon } from '@/components/common'
import { cn } from '@/lib/utils'
import type { PlannedExpenseWithDetails, PlannedExpenseStatus, AccountWithType, ExpenseCategoryWithTags } from '@/lib/api/types'
import { ConfirmPlannedExpenseDialog } from './confirm-planned-expense-dialog'
import { UnconfirmPlannedExpenseDialog } from './unconfirm-planned-expense-dialog'
import { CURRENCY_SYMBOLS } from '@/types'

interface PlannedExpensesByCategoryProps {
  expenses: PlannedExpenseWithDetails[]
  accounts: AccountWithType[]
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
  onUnconfirm?: (id: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  isPending?: boolean
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

interface CurrencyTotal {
  planned: number
  confirmed: number
}

interface CategoryGroup {
  categoryId: string
  categoryName: string
  categoryCode: string
  categoryIcon: string
  categoryColor: string
  expenses: PlannedExpenseWithDetails[]
  totalPlanned: number
  totalConfirmed: number
  pendingCount: number
  confirmedCount: number
  skippedCount: number
  currencyTotals: Record<string, CurrencyTotal>
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

const getExchangeRate = (e: PlannedExpenseWithDetails): number => {
  return getActualAmount(e.exchange_rate as number | { Float64: number; Valid: boolean } | null) ?? 1
}

export function PlannedExpensesByCategory({
  expenses,
  accounts,
  categories,
  onConfirm,
  onSkip,
  onUnconfirm,
  onDelete,
  isPending,
  onExpenseClick,
}: PlannedExpensesByCategoryProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [unconfirmDialogOpen, setUnconfirmDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<PlannedExpenseWithDetails | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set())

  // Создаём Map для быстрого поиска категорий по id
  const categoriesMap = new Map(categories?.map((c) => [c.id, c]) ?? [])

  // Обогащаем расходы данными о категориях
  const enrichedExpenses = expenses.map((expense) => {
    const category = categoriesMap.get(expense.category_id)
    if (category) {
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

  // Группировка по категориям
  const categoryGroups = useMemo(() => {
    const groups = new Map<string, CategoryGroup>()

    for (const expense of enrichedExpenses) {
      const categoryId = expense.category_id

      if (!groups.has(categoryId)) {
        groups.set(categoryId, {
          categoryId,
          categoryName: expense.category_name || 'Без категории',
          categoryCode: expense.category_code || 'other',
          categoryIcon: expense.category_icon || 'CircleDot',
          categoryColor: expense.category_color || '#6b7280',
          expenses: [],
          totalPlanned: 0,
          totalConfirmed: 0,
          pendingCount: 0,
          confirmedCount: 0,
          skippedCount: 0,
          currencyTotals: {},
        })
      }

      const group = groups.get(categoryId)!
      group.expenses.push(expense)
      group.totalPlanned += expense.planned_amount_base

      // Агрегируем по валютам
      const currency = expense.currency || 'RUB'
      if (!group.currencyTotals[currency]) {
        group.currencyTotals[currency] = { planned: 0, confirmed: 0 }
      }

      if (expense.status === 'pending') {
        group.pendingCount++
        group.currencyTotals[currency].planned += expense.planned_amount
      } else if (expense.status === 'confirmed') {
        group.confirmedCount++
        const actualAmount = getActualAmount(expense.actual_amount)
        if (actualAmount !== null) {
          const rate = getExchangeRate(expense)
          group.totalConfirmed += actualAmount * rate
          group.currencyTotals[currency].confirmed += actualAmount
        } else {
          group.totalConfirmed += expense.planned_amount_base
          group.currencyTotals[currency].confirmed += expense.planned_amount
        }
      } else {
        group.skippedCount++
      }
    }

    // Сортируем группы: сначала с pending, потом по сумме
    return Array.from(groups.values()).sort((a, b) => {
      if (a.pendingCount !== b.pendingCount) {
        return b.pendingCount - a.pendingCount
      }
      return b.totalPlanned - a.totalPlanned
    })
  }, [enrichedExpenses])

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
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

  const handleSkip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setProcessingId(id)
    try {
      await onSkip(id)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return
    if (!confirm('Удалить этот запланированный расход?')) return

    setProcessingId(id)
    try {
      await onDelete(id)
    } finally {
      setProcessingId(null)
    }
  }

  const handleUnconfirmClick = (expense: PlannedExpenseWithDetails, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onUnconfirm) return
    setSelectedExpense(expense)
    setUnconfirmDialogOpen(true)
  }

  const handleUnconfirmConfirm = async () => {
    if (!onUnconfirm || !selectedExpense) return

    setProcessingId(selectedExpense.id)
    try {
      await onUnconfirm(selectedExpense.id)
    } finally {
      setProcessingId(null)
      setUnconfirmDialogOpen(false)
      setSelectedExpense(null)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const isOverdue = (expense: PlannedExpenseWithDetails): boolean => {
    if (expense.status !== 'pending') return false
    const plannedDate = getDateString(expense.planned_date)
    if (!plannedDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expenseDate = new Date(plannedDate)
    expenseDate.setHours(0, 0, 0, 0)
    return expenseDate < today
  }

  if (expenses.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      {categoryGroups.map((group) => {
        const isExpanded = expandedCategories.has(group.categoryId)
        const hasOverdue = group.expenses.some(isOverdue)

        // Сортируем расходы внутри группы только по дате (хронологически, как в календаре)
        const sortedExpenses = [...group.expenses].sort((a, b) => {
          const dateA = getDateString(a.planned_date)
          const dateB = getDateString(b.planned_date)
          return new Date(dateA).getTime() - new Date(dateB).getTime()
        })

        return (
          <Collapsible
            key={group.categoryId}
            open={isExpanded}
            onOpenChange={() => toggleCategory(group.categoryId)}
          >
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
                  'hover:bg-muted/50',
                  hasOverdue && 'bg-red-500/5'
                )}
              >
                <CategoryIcon
                  code={group.categoryCode}
                  iconName={group.categoryIcon}
                  color={group.categoryColor}
                  size="sm"
                />

                <span className="font-medium text-sm flex-1 text-left truncate">
                  {group.categoryName}
                </span>

                {group.pendingCount > 0 && (
                  <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                    {group.pendingCount}
                  </Badge>
                )}

                {hasOverdue && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium tabular-nums cursor-help">
                      {Object.entries(group.currencyTotals)
                        .filter(([, totals]) => totals.planned > 0 || totals.confirmed > 0)
                        .map(([curr, totals], idx, arr) => {
                          const symbol = CURRENCY_SYMBOLS[curr as keyof typeof CURRENCY_SYMBOLS] || curr
                          const total = totals.planned + totals.confirmed
                          return (
                            <span key={curr}>
                              {formatMoney(total)} {symbol}
                              {idx < arr.length - 1 && <span className="text-muted-foreground mx-1">+</span>}
                            </span>
                          )
                        })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="p-3">
                    <div className="space-y-2 text-sm">
                      {Object.entries(group.currencyTotals)
                        .filter(([, totals]) => totals.planned > 0 || totals.confirmed > 0)
                        .map(([curr, totals]) => {
                          const symbol = CURRENCY_SYMBOLS[curr as keyof typeof CURRENCY_SYMBOLS] || curr
                          return (
                            <div key={curr} className="space-y-1">
                              {Object.keys(group.currencyTotals).length > 1 && (
                                <p className="font-medium text-foreground">{curr}</p>
                              )}
                              {totals.confirmed > 0 && (
                                <div className="flex items-center gap-2 text-emerald-500">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span>Оплачено: {formatMoney(totals.confirmed)} {symbol}</span>
                                </div>
                              )}
                              {totals.planned > 0 && (
                                <div className="flex items-center gap-2 text-amber-500">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Ожидает: {formatMoney(totals.planned)} {symbol}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </TooltipContent>
                </Tooltip>

                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="ml-7 py-1 space-y-0.5">
                {sortedExpenses.map((expense) => {
                  const statusConfig = STATUS_CONFIG[expense.status]
                  const StatusIcon = statusConfig.icon
                  const isProcessing = processingId === expense.id
                  const expenseIsOverdue = isOverdue(expense)
                  const actualAmount = getActualAmount(expense.actual_amount)
                  const currency = expense.currency || 'RUB'
                  const currencySymbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency
                  const isNonRub = currency !== 'RUB'
                  const rate = getExchangeRate(expense)

                  return (
                    <div
                      key={expense.id}
                      className={cn(
                        'group flex items-center gap-2 p-2 rounded-md transition-colors',
                        'hover:bg-muted/50',
                        expense.status === 'skipped' && 'opacity-50',
                        onExpenseClick && 'cursor-pointer'
                      )}
                      onClick={() => onExpenseClick?.(expense.id)}
                    >
                      {/* Статус */}
                      {expenseIsOverdue ? (
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      ) : (
                        <StatusIcon className={cn('h-4 w-4 shrink-0', statusConfig.color)} />
                      )}

                      {/* Название и детали */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            'text-sm truncate',
                            expense.status === 'confirmed' && 'text-emerald-600',
                            expense.status === 'skipped' && 'line-through text-muted-foreground'
                          )}>
                            {expense.name}
                          </span>
                          {expense.fund_name && (
                            <PiggyBank className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {(() => {
                            const plannedDate = getDateString(expense.planned_date)
                            if (!plannedDate) return null
                            const date = new Date(plannedDate)
                            return (
                              <span className={cn('tabular-nums', expenseIsOverdue && 'text-red-500')}>
                                {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                              </span>
                            )
                          })()}
                          {expense.account_name && (
                            <>
                              <span>·</span>
                              <Wallet className="h-3 w-3" />
                              <span className="truncate">{expense.account_name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Сумма */}
                      <div className="text-right shrink-0">
                        {expense.status === 'confirmed' && actualAmount != null ? (
                          <div className="text-sm">
                            <span className="text-emerald-600 font-medium tabular-nums">
                              {formatMoney(actualAmount)} {currencySymbol}
                            </span>
                            {isNonRub && (
                              <span className="text-xs text-muted-foreground ml-1 tabular-nums">
                                ≈{formatMoney(actualAmount * rate)}₽
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm">
                            <span className={cn(
                              'font-medium tabular-nums',
                              expense.status === 'skipped' && 'line-through text-muted-foreground'
                            )}>
                              {formatMoney(expense.planned_amount)} {currencySymbol}
                            </span>
                            {isNonRub && expense.status !== 'skipped' && (
                              <span className="text-xs text-muted-foreground ml-1 tabular-nums">
                                ≈{formatMoney(expense.planned_amount_base)}₽
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Действия */}
                      {expense.status === 'pending' && (
                        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenConfirmDialog(expense)
                            }}
                            disabled={isPending || isProcessing}
                          >
                            <Check className="h-4 w-4 text-emerald-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => handleSkip(expense.id, e)}
                            disabled={isPending || isProcessing}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => handleDelete(expense.id, e)}
                              disabled={isPending || isProcessing}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      )}
                      {expense.status === 'confirmed' && onUnconfirm && (
                        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => handleUnconfirmClick(expense, e)}
                            disabled={isPending || isProcessing}
                            title="Отменить подтверждение"
                          >
                            <Undo2 className="h-4 w-4 text-amber-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}

      <ConfirmPlannedExpenseDialog
        expense={selectedExpense}
        accounts={accounts}
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirm}
        isPending={isPending}
      />

      <UnconfirmPlannedExpenseDialog
        expense={selectedExpense}
        open={unconfirmDialogOpen}
        onOpenChange={setUnconfirmDialogOpen}
        onConfirm={handleUnconfirmConfirm}
        isPending={processingId === selectedExpense?.id}
      />
    </div>
  )
}
