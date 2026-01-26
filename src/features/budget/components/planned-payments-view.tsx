import { useState } from 'react'
import { List, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PaymentCalendar } from './payment-calendar'
import type { PlannedExpenseWithDetails, PlannedIncome, Account, ExpenseCategoryWithTags } from '@/lib/api/types'

type ViewMode = 'list' | 'calendar'

interface PlannedPaymentsViewProps {
  expenses: PlannedExpenseWithDetails[]
  incomes: PlannedIncome[]
  accounts: Account[]
  categories?: ExpenseCategoryWithTags[]
  year: number
  month: number
  /** Рендерится при выборе режима списка */
  listContent: React.ReactNode
  /** Callback при клике на расход в календаре */
  onExpenseClick?: (expense: PlannedExpenseWithDetails) => void
  /** Callback при клике на доход в календаре */
  onIncomeClick?: (income: PlannedIncome) => void
}

export function PlannedPaymentsView({
  expenses,
  incomes,
  year,
  month,
  listContent,
  onExpenseClick,
  onIncomeClick,
}: PlannedPaymentsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  return (
    <div className="space-y-4">
      {/* Переключатель вида */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-1 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-2.5 gap-1.5',
              viewMode === 'list' && 'bg-background shadow-sm'
            )}
            onClick={() => setViewMode('list')}
          >
            <List className="h-3.5 w-3.5" />
            <span className="text-xs">Список</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-2.5 gap-1.5',
              viewMode === 'calendar' && 'bg-background shadow-sm'
            )}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="text-xs">Календарь</span>
          </Button>
        </div>
      </div>

      {/* Контент в зависимости от режима */}
      {viewMode === 'list' ? (
        listContent
      ) : (
        <PaymentCalendar
          expenses={expenses}
          incomes={incomes}
          year={year}
          month={month}
          onExpenseClick={onExpenseClick}
          onIncomeClick={onIncomeClick}
        />
      )}
    </div>
  )
}
