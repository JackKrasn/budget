import { useMemo, useState } from 'react'
import { getDaysInMonth } from 'date-fns'
import { Banknote, Receipt, Power, PowerOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RecurringExpenseWithCategory, RecurringIncome } from '@/lib/api/types'

// Типы для объединённых шаблонов
interface CalendarRecurring {
  id: string
  type: 'expense' | 'income'
  name: string
  amount: number
  dayOfMonth: number
  isActive: boolean
  categoryName?: string
  categoryColor?: string
  original: RecurringExpenseWithCategory | RecurringIncome
}

interface RecurringCalendarProps {
  expenses?: RecurringExpenseWithCategory[]
  incomes?: RecurringIncome[]
  onExpenseClick?: (expense: RecurringExpenseWithCategory) => void
  onIncomeClick?: (income: RecurringIncome) => void
  /** Компактный режим */
  compact?: boolean
}

export function RecurringCalendar({
  expenses = [],
  incomes = [],
  onExpenseClick,
  onIncomeClick,
  compact = false,
}: RecurringCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Текущая дата для подсветки
  const today = new Date()
  const currentDay = today.getDate()
  const daysInCurrentMonth = getDaysInMonth(today)

  // Преобразуем расходы и доходы в единый формат
  const recurringItems = useMemo<CalendarRecurring[]>(() => {
    const result: CalendarRecurring[] = []

    // Добавляем расходы (только те, у которых есть day_of_month)
    for (const expense of expenses) {
      // Пропускаем daily расходы - они не имеют конкретного дня
      if (expense.frequency === 'daily') continue
      // Для weekly нужна отдельная логика - пока пропускаем
      if (expense.frequency === 'weekly') continue
      // Для monthly и yearly показываем в календаре
      if (expense.day_of_month) {
        result.push({
          id: expense.id,
          type: 'expense',
          name: expense.name,
          amount: expense.amount,
          dayOfMonth: expense.day_of_month,
          isActive: expense.is_active,
          categoryName: expense.category_name,
          categoryColor: expense.category_color,
          original: expense,
        })
      }
    }

    // Добавляем доходы
    for (const income of incomes) {
      result.push({
        id: income.id,
        type: 'income',
        name: income.source,
        amount: income.expected_amount,
        dayOfMonth: income.day_of_month,
        isActive: income.is_active,
        original: income,
      })
    }

    return result.sort((a, b) => a.dayOfMonth - b.dayOfMonth)
  }, [expenses, incomes])

  // Группируем по дням
  const itemsByDay = useMemo(() => {
    const map = new Map<number, CalendarRecurring[]>()
    for (const item of recurringItems) {
      const day = item.dayOfMonth
      if (!map.has(day)) {
        map.set(day, [])
      }
      map.get(day)!.push(item)
    }
    return map
  }, [recurringItems])

  // Элементы для выбранного дня
  const selectedItems = useMemo(() => {
    if (!selectedDay) return []
    return itemsByDay.get(selectedDay) || []
  }, [selectedDay, itemsByDay])

  // Статистика
  const stats = useMemo(() => {
    const activeExpenses = expenses.filter((e) => e.is_active)
    const activeIncomes = incomes.filter((i) => i.is_active)
    return {
      totalExpenses: activeExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalIncomes: activeIncomes.reduce((sum, i) => sum + i.expected_amount, 0),
      expensesCount: activeExpenses.length,
      incomesCount: activeIncomes.length,
    }
  }, [expenses, incomes])

  const handleItemClick = (item: CalendarRecurring) => {
    if (item.type === 'expense' && onExpenseClick) {
      onExpenseClick(item.original as RecurringExpenseWithCategory)
    } else if (item.type === 'income' && onIncomeClick) {
      onIncomeClick(item.original as RecurringIncome)
    }
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  // Генерируем дни месяца (31 день для универсальности)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="space-y-4">
      {/* Статистика */}
      {!compact && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 mb-1">
              <Banknote className="h-4 w-4" />
              Доходы ({stats.incomesCount})
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatMoney(stats.totalIncomes)} ₽
            </p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 mb-1">
              <Receipt className="h-4 w-4" />
              Расходы ({stats.expensesCount})
            </div>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
              -{formatMoney(stats.totalExpenses)} ₽
            </p>
          </div>
        </div>
      )}

      {/* Календарная сетка */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-border/30">
          {days.map((day) => {
            const dayItems = itemsByDay.get(day) || []
            const activeItems = dayItems.filter((i) => i.isActive)
            const isSelected = selectedDay === day
            const isToday = day === currentDay
            const hasExpenses = activeItems.some((i) => i.type === 'expense')
            const hasIncomes = activeItems.some((i) => i.type === 'income')
            const isValidDay = day <= daysInCurrentMonth

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={cn(
                  'relative p-2 cursor-pointer transition-all bg-background',
                  compact ? 'min-h-[50px]' : 'min-h-[70px]',
                  isSelected && 'bg-primary/15 ring-2 ring-primary shadow-md z-10',
                  !isSelected && 'hover:bg-muted/50',
                  isToday && !isSelected && 'bg-amber-500/10 border-l-2 border-l-amber-500',
                  !isValidDay && 'opacity-40'
                )}
              >
                {/* Номер дня */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected && 'text-primary font-bold',
                      isToday && !isSelected && 'text-amber-600 dark:text-amber-400 font-bold'
                    )}
                  >
                    {day}
                  </span>
                  {activeItems.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1 text-[10px]"
                    >
                      {activeItems.length}
                    </Badge>
                  )}
                </div>

                {/* Индикаторы */}
                {activeItems.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {hasIncomes && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                    {hasExpenses && (
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    )}
                  </div>
                )}

                {/* Мини-список */}
                {!compact && activeItems.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {activeItems.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'text-[9px] truncate',
                          item.type === 'expense'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {item.name}
                      </div>
                    ))}
                    {activeItems.length > 2 && (
                      <div className="text-[9px] text-muted-foreground">
                        +{activeItems.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Детали выбранного дня */}
      {selectedDay && selectedItems.length > 0 && (
        <div className="rounded-lg border border-border/50 p-4 bg-card/50">
          <h4 className="font-medium mb-3">
            {selectedDay} число каждого месяца
          </h4>
          <div className="space-y-2">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01]',
                  item.isActive
                    ? item.type === 'expense'
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-muted/30 border-border opacity-60'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    item.type === 'expense'
                      ? 'bg-orange-500/10'
                      : 'bg-emerald-500/10'
                  )}
                >
                  {item.type === 'expense' ? (
                    <Receipt
                      className="h-4 w-4"
                      style={{ color: item.categoryColor || '#f97316' }}
                    />
                  ) : (
                    <Banknote className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{item.name}</p>
                    {!item.isActive && (
                      <PowerOff className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  {item.categoryName && (
                    <p className="text-xs text-muted-foreground">
                      {item.categoryName}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold tabular-nums',
                      item.type === 'expense'
                        ? 'text-orange-500'
                        : 'text-emerald-500',
                      !item.isActive && 'opacity-50'
                    )}
                  >
                    {item.type === 'expense' ? '-' : '+'}
                    {formatMoney(item.amount)} ₽
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                    {item.isActive ? (
                      <>
                        <Power className="h-3 w-3 text-emerald-500" />
                        <span>Активен</span>
                      </>
                    ) : (
                      <>
                        <PowerOff className="h-3 w-3" />
                        <span>Отключён</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Легенда */}
      {!compact && (
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Доходы</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span>Расходы</span>
          </div>
        </div>
      )}
    </div>
  )
}
