import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CategoryIcon } from '@/components/common'
import { cn } from '@/lib/utils'
import type { RecurringExpenseWithCategory, ExchangeRate, RecurringExpenseFrequency } from '@/lib/api/types'
import { CURRENCY_SYMBOLS } from '@/types'

const DAYS_OF_WEEK_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const MONTHS_SHORT = [
  '', 'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
]

const FREQUENCY_CONFIG: Record<RecurringExpenseFrequency, {
  label: string
  icon: typeof Calendar
  shortLabel: string
}> = {
  daily: { label: 'Ежедневно', icon: CalendarClock, shortLabel: 'ежедн.' },
  weekly: { label: 'Еженедельно', icon: CalendarDays, shortLabel: 'еженед.' },
  monthly: { label: 'Ежемесячно', icon: Calendar, shortLabel: '' },
  yearly: { label: 'Ежегодно', icon: CalendarRange, shortLabel: 'ежегодн.' },
}

interface CategoryGroup {
  categoryId: string
  categoryName: string
  categoryCode: string
  categoryIcon: string
  categoryColor: string
  expenses: RecurringExpenseWithCategory[]
  totalAmount: number // В RUB
  activeCount: number
}

interface RecurringExpensesByCategoryProps {
  expenses: RecurringExpenseWithCategory[]
  exchangeRates?: ExchangeRate[]
  onEdit: (expense: RecurringExpenseWithCategory) => void
  onDelete: (id: string) => Promise<void>
  onToggleActive: (id: string, isActive: boolean) => Promise<void>
  /** Callback при клике на "Добавить" в категории */
  onAddInCategory?: (categoryId: string) => void
  isDeleting?: boolean
  isToggling?: boolean
}

export function RecurringExpensesByCategory({
  expenses,
  exchangeRates = [],
  onEdit,
  onDelete,
  onToggleActive,
  onAddInCategory,
  isDeleting,
  isToggling,
}: RecurringExpensesByCategoryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    // По умолчанию разворачиваем категории с активными расходами
    const expanded = new Set<string>()
    expenses.forEach(e => {
      if (e.is_active) expanded.add(e.category_id)
    })
    return expanded
  })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  // Получить курс валюты к RUB
  const getExchangeRate = (currency: string): number => {
    if (currency === 'RUB') return 1
    const rate = exchangeRates.find(
      (r) => r.from_currency === currency && r.to_currency === 'RUB'
    )
    return rate?.rate ?? 1
  }

  // Конвертировать в RUB
  const toRub = (amount: number, currency: string): number => {
    return amount * getExchangeRate(currency)
  }

  // Форматирование расписания с указанием частоты
  const formatSchedule = (expense: RecurringExpenseWithCategory): string => {
    const frequency = expense.frequency || 'monthly'

    switch (frequency) {
      case 'daily':
        return 'ежедневно'
      case 'weekly':
        if (expense.day_of_week !== undefined && expense.day_of_week !== null) {
          return `еженедельно, ${DAYS_OF_WEEK_SHORT[expense.day_of_week]}`
        }
        return 'еженедельно'
      case 'monthly':
        if (expense.day_of_month) {
          return `ежемесячно, ${expense.day_of_month}-го`
        }
        return 'ежемесячно'
      case 'yearly':
        if (expense.day_of_month && expense.month_of_year) {
          return `ежегодно, ${expense.day_of_month} ${MONTHS_SHORT[expense.month_of_year]}`
        }
        return 'ежегодно'
      default:
        return ''
    }
  }

  // Группировка по категориям
  const categoryGroups = useMemo(() => {
    const groups = new Map<string, CategoryGroup>()

    for (const expense of expenses) {
      const categoryId = expense.category_id

      if (!groups.has(categoryId)) {
        groups.set(categoryId, {
          categoryId,
          categoryName: expense.category_name || 'Без категории',
          categoryCode: expense.category_code || 'other',
          categoryIcon: expense.category_icon || 'CircleDot',
          categoryColor: expense.category_color || '#6b7280',
          expenses: [],
          totalAmount: 0,
          activeCount: 0,
        })
      }

      const group = groups.get(categoryId)!
      group.expenses.push(expense)

      if (expense.is_active) {
        group.activeCount++
        // Приводим к месячному эквиваленту
        const baseAmount = toRub(expense.amount, expense.currency || 'RUB')
        const frequency = expense.frequency || 'monthly'
        switch (frequency) {
          case 'daily':
            group.totalAmount += baseAmount * 30
            break
          case 'weekly':
            group.totalAmount += baseAmount * 4.33
            break
          case 'yearly':
            group.totalAmount += baseAmount / 12
            break
          default:
            group.totalAmount += baseAmount
        }
      }
    }

    // Сортируем группы: по сумме убыванию
    return Array.from(groups.values()).sort((a, b) => b.totalAmount - a.totalAmount)
  }, [expenses, exchangeRates])

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

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId)
      setDeleteId(null)
    }
  }

  if (expenses.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1"
    >
      {categoryGroups.map((group) => {
        const isExpanded = expandedCategories.has(group.categoryId)

        // Сортируем расходы внутри группы: активные первые, потом по дню
        const sortedExpenses = [...group.expenses].sort((a, b) => {
          if (a.is_active !== b.is_active) {
            return a.is_active ? -1 : 1
          }
          return (a.day_of_month || 0) - (b.day_of_month || 0)
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
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-colors',
                  'hover:bg-muted/50',
                  'border border-transparent',
                  isExpanded && 'bg-muted/30'
                )}
              >
                <CategoryIcon
                  code={group.categoryCode}
                  iconName={group.categoryIcon}
                  color={group.categoryColor}
                  size="md"
                />

                <span className="font-medium text-sm flex-1 text-left">
                  {group.categoryName}
                </span>

                {group.activeCount > 0 && (
                  <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                    {group.activeCount}
                  </Badge>
                )}

                {group.totalAmount > 0 && (
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">
                    ~{formatMoney(group.totalAmount)} ₽/мес
                  </span>
                )}

                {onAddInCategory && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddInCategory(group.categoryId)
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}

                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="ml-8 py-1 space-y-0.5">
                {sortedExpenses.map((expense) => {
                  const frequency = expense.frequency || 'monthly'
                  const freqConfig = FREQUENCY_CONFIG[frequency]
                  const FreqIcon = freqConfig.icon
                  const currencySymbol = CURRENCY_SYMBOLS[expense.currency as keyof typeof CURRENCY_SYMBOLS] || expense.currency

                  return (
                    <div
                      key={expense.id}
                      className={cn(
                        'group flex items-center gap-3 p-2 rounded-md transition-colors',
                        'hover:bg-muted/50',
                        !expense.is_active && 'opacity-50'
                      )}
                    >
                      {/* Название и расписание */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-sm font-medium truncate',
                            !expense.is_active && 'line-through text-muted-foreground'
                          )}>
                            {expense.name}
                          </span>
                          {expense.fund_name && (
                            <Badge variant="outline" className="h-4 text-[9px] px-1 shrink-0">
                              {expense.fund_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FreqIcon className="h-3 w-3" />
                          <span>{formatSchedule(expense)}</span>
                        </div>
                      </div>

                      {/* Сумма */}
                      <div className="text-right shrink-0">
                        <span className="text-sm font-medium tabular-nums">
                          {formatMoney(expense.amount)} {currencySymbol}
                        </span>
                        {expense.currency && expense.currency !== 'RUB' && (
                          <div className="text-[10px] text-muted-foreground tabular-nums">
                            ≈ {formatMoney(toRub(expense.amount, expense.currency))} ₽
                          </div>
                        )}
                      </div>

                      {/* Действия */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleActive(expense.id, !expense.is_active)
                          }}
                          disabled={isToggling}
                        >
                          {expense.is_active ? (
                            <ToggleRight className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(expense)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteId(expense.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить шаблон?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Шаблон будет удалён, но уже
              созданные на его основе расходы останутся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
