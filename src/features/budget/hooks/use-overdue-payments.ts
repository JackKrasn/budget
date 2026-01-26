import { useMemo } from 'react'
import { useCurrentBudget } from './use-budgets'
import { usePlannedExpenses } from './use-planned-expenses'
import { usePlannedIncomes } from './use-planned-incomes'

export interface OverduePayment {
  id: string
  type: 'expense' | 'income'
  name: string
  amount: number
  plannedDate: Date
  daysOverdue: number
}

export function useOverduePayments() {
  const { data: budget, isLoading: budgetLoading } = useCurrentBudget()

  const { data: expensesData, isLoading: expensesLoading } = usePlannedExpenses({
    budgetId: budget?.id,
    status: undefined,
  })

  const { data: incomesData, isLoading: incomesLoading } = usePlannedIncomes({
    budgetId: budget?.id,
    status: undefined,
  })

  const overduePayments = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const result: OverduePayment[] = []

    // Просроченные расходы
    const expenses = expensesData?.data ?? []
    for (const expense of expenses) {
      if (expense.status !== 'pending') continue

      const dateStr = typeof expense.planned_date === 'string'
        ? expense.planned_date
        : expense.planned_date?.Time
      if (!dateStr) continue

      const plannedDate = new Date(dateStr)
      plannedDate.setHours(0, 0, 0, 0)

      if (plannedDate < today) {
        const diffTime = today.getTime() - plannedDate.getTime()
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        result.push({
          id: expense.id,
          type: 'expense',
          name: expense.name,
          amount: expense.planned_amount,
          plannedDate,
          daysOverdue,
        })
      }
    }

    // Просроченные доходы
    const incomes = incomesData?.data ?? []
    for (const income of incomes) {
      if (income.status !== 'pending') continue

      const dateStr = typeof income.expected_date === 'string'
        ? income.expected_date
        : income.expected_date && typeof income.expected_date === 'object' && 'Time' in income.expected_date
          ? income.expected_date.Time
          : null
      if (!dateStr) continue

      const plannedDate = new Date(dateStr)
      plannedDate.setHours(0, 0, 0, 0)

      if (plannedDate < today) {
        const diffTime = today.getTime() - plannedDate.getTime()
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        result.push({
          id: income.id,
          type: 'income',
          name: income.source,
          amount: income.expected_amount,
          plannedDate,
          daysOverdue,
        })
      }
    }

    // Сортируем по количеству просроченных дней (сначала самые старые)
    return result.sort((a, b) => b.daysOverdue - a.daysOverdue)
  }, [expensesData?.data, incomesData?.data])

  return {
    overduePayments,
    overdueCount: overduePayments.length,
    isLoading: budgetLoading || expensesLoading || incomesLoading,
    hasBudget: !!budget?.id,
  }
}
