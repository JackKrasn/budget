import { useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Banknote, Receipt, Clock, CheckCircle, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PlannedExpenseWithDetails, PlannedIncome, PlannedExpenseStatus, PlannedIncomeStatus } from '@/lib/api/types'

// Типы для объединённых платежей
interface CalendarPayment {
  id: string
  type: 'expense' | 'income'
  name: string
  amount: number
  date: Date
  status: PlannedExpenseStatus | PlannedIncomeStatus
  categoryName?: string
  categoryColor?: string
  original: PlannedExpenseWithDetails | PlannedIncome
}

interface PaymentCalendarProps {
  expenses?: PlannedExpenseWithDetails[]
  incomes?: PlannedIncome[]
  year: number
  month: number
  onMonthChange?: (year: number, month: number) => void
  onExpenseClick?: (expense: PlannedExpenseWithDetails) => void
  onIncomeClick?: (income: PlannedIncome) => void
  /** Показывать навигацию по месяцам */
  showNavigation?: boolean
  /** Компактный режим для встраивания */
  compact?: boolean
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
  confirmed: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  received: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  skipped: 'bg-muted border-border text-muted-foreground opacity-60',
}

export function PaymentCalendar({
  expenses = [],
  incomes = [],
  year,
  month,
  onMonthChange,
  onExpenseClick,
  onIncomeClick,
  showNavigation = false,
  compact = false,
}: PaymentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Вспомогательные функции для извлечения данных из nullable типов
  const getDateString = (
    value: string | { Time: string; Valid: boolean } | null | undefined
  ): string | null => {
    if (value == null) return null
    if (typeof value === 'string') return value
    if (typeof value === 'object' && 'Valid' in value && value.Valid) {
      return value.Time
    }
    return null
  }

  // Создаём дату для текущего месяца
  const currentMonth = useMemo(() => new Date(year, month - 1, 1), [year, month])

  // Генерируем все дни месяца
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Преобразуем расходы и доходы в единый формат
  const payments = useMemo<CalendarPayment[]>(() => {
    const result: CalendarPayment[] = []

    // Добавляем расходы
    for (const expense of expenses) {
      const dateStr = getDateString(expense.planned_date)
      if (!dateStr) continue
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) continue

      result.push({
        id: expense.id,
        type: 'expense',
        name: expense.name,
        amount: expense.planned_amount,
        date,
        status: expense.status,
        categoryName: expense.category_name,
        categoryColor: expense.category_color,
        original: expense,
      })
    }

    // Добавляем доходы
    for (const income of incomes) {
      const dateStr = getDateString(income.expected_date)
      if (!dateStr) continue
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) continue

      result.push({
        id: income.id,
        type: 'income',
        name: income.source,
        amount: income.expected_amount,
        date,
        status: income.status,
        original: income,
      })
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [expenses, incomes])

  // Группируем платежи по дням
  const paymentsByDay = useMemo(() => {
    const map = new Map<string, CalendarPayment[]>()
    for (const payment of payments) {
      const key = format(payment.date, 'yyyy-MM-dd')
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(payment)
    }
    return map
  }, [payments])

  // Платежи для выбранной даты
  const selectedPayments = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return paymentsByDay.get(key) || []
  }, [selectedDate, paymentsByDay])

  // Вычисляем отступ для первого дня (понедельник = 0)
  const firstDayOffset = useMemo(() => {
    const dayOfWeek = getDay(days[0])
    // getDay возвращает 0 для воскресенья, нам нужно 6
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1
  }, [days])

  const handlePrevMonth = () => {
    const prev = subMonths(currentMonth, 1)
    onMonthChange?.(prev.getFullYear(), prev.getMonth() + 1)
  }

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1)
    onMonthChange?.(next.getFullYear(), next.getMonth() + 1)
  }

  const handlePaymentClick = (payment: CalendarPayment) => {
    if (payment.type === 'expense' && onExpenseClick) {
      onExpenseClick(payment.original as PlannedExpenseWithDetails)
    } else if (payment.type === 'income' && onIncomeClick) {
      onIncomeClick(payment.original as PlannedIncome)
    }
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'confirmed':
      case 'received':
        return <CheckCircle className="h-3 w-3" />
      case 'skipped':
        return <SkipForward className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Заголовок с навигацией */}
      {showNavigation && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </h3>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Календарная сетка */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        {/* Заголовки дней недели */}
        <div className="grid grid-cols-7 bg-muted/50">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Дни месяца */}
        <div className="grid grid-cols-7">
          {/* Пустые ячейки для выравнивания */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="border-t border-border/30 bg-muted/20 min-h-[80px]" />
          ))}

          {/* Дни */}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayPayments = paymentsByDay.get(key) || []
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())
            const pendingCount = dayPayments.filter(
              (p) => p.status === 'pending'
            ).length

            return (
              <div
                key={key}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={cn(
                  'border-t border-border/30 p-1.5 cursor-pointer transition-all',
                  compact ? 'min-h-[60px]' : 'min-h-[80px]',
                  isSelected && 'bg-primary/15 ring-2 ring-primary shadow-sm',
                  !isSelected && 'hover:bg-muted/50',
                  isToday && !isSelected && 'bg-amber-500/10 border-l-2 border-l-amber-500'
                )}
              >
                {/* Номер дня */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected && 'text-primary font-bold',
                      isToday && !isSelected && 'text-amber-600 dark:text-amber-400 font-bold',
                      !isToday && !isSelected && (day.getDay() === 0 || day.getDay() === 6)
                        ? 'text-muted-foreground'
                        : ''
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {pendingCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </div>

                {/* Индикаторы платежей */}
                {dayPayments.length > 0 && (
                  <div className="space-y-0.5">
                    {dayPayments.slice(0, compact ? 2 : 3).map((payment) => (
                      <div
                        key={payment.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePaymentClick(payment)
                        }}
                        className={cn(
                          'flex items-center gap-1 px-1 py-0.5 rounded text-[10px] border cursor-pointer transition-opacity hover:opacity-80',
                          STATUS_COLORS[payment.status]
                        )}
                      >
                        {payment.type === 'expense' ? (
                          <Receipt className="h-2.5 w-2.5 shrink-0" />
                        ) : (
                          <Banknote className="h-2.5 w-2.5 shrink-0" />
                        )}
                        <span className="truncate flex-1">{payment.name}</span>
                        <span className="font-medium shrink-0">
                          {payment.type === 'expense' ? '-' : '+'}
                          {formatMoney(payment.amount)}
                        </span>
                      </div>
                    ))}
                    {dayPayments.length > (compact ? 2 : 3) && (
                      <div className="text-[10px] text-muted-foreground text-center">
                        +{dayPayments.length - (compact ? 2 : 3)} ещё
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
      {selectedDate && selectedPayments.length > 0 && (
        <div className="rounded-lg border border-border/50 p-4 bg-card/50">
          <h4 className="font-medium mb-3">
            {format(selectedDate, 'd MMMM', { locale: ru })}
          </h4>
          <div className="space-y-2">
            {selectedPayments.map((payment) => (
              <div
                key={payment.id}
                onClick={() => handlePaymentClick(payment)}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:scale-[1.01]',
                  STATUS_COLORS[payment.status]
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/50">
                  {payment.type === 'expense' ? (
                    <Receipt
                      className="h-4 w-4"
                      style={{ color: payment.categoryColor }}
                    />
                  ) : (
                    <Banknote className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{payment.name}</p>
                  {payment.categoryName && (
                    <p className="text-xs text-muted-foreground">
                      {payment.categoryName}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold tabular-nums',
                      payment.type === 'expense'
                        ? 'text-orange-500'
                        : 'text-emerald-500'
                    )}
                  >
                    {payment.type === 'expense' ? '-' : '+'}
                    {formatMoney(payment.amount)} ₽
                  </p>
                  <div className="flex items-center gap-1 text-xs justify-end">
                    {getStatusIcon(payment.status)}
                    <span>
                      {payment.status === 'pending' && 'Ожидает'}
                      {(payment.status === 'confirmed' ||
                        payment.status === 'received') &&
                        'Подтверждено'}
                      {payment.status === 'skipped' && 'Пропущено'}
                    </span>
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
            <Receipt className="h-3 w-3 text-orange-500" />
            <span>Расходы</span>
          </div>
          <div className="flex items-center gap-1">
            <Banknote className="h-3 w-3 text-emerald-500" />
            <span>Доходы</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Ожидает</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Подтверждено</span>
          </div>
        </div>
      )}
    </div>
  )
}
