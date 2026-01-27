import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Repeat, List, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useRecurringExpenses,
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
  useRecurringIncomes,
  useCreateRecurringIncome,
  useUpdateRecurringIncome,
  useDeleteRecurringIncome,
  RecurringExpensesSection,
  RecurringExpenseDialog,
  RecurringIncomesSection,
  RecurringIncomeDialog,
  RecurringCalendar,
} from '@/features/budget'
import { useExpenseCategories, useExchangeRates } from '@/features/expenses'
import { useFunds } from '@/features/funds'
import { useAccounts } from '@/features/accounts'
import type { RecurringExpenseWithCategory, RecurringIncome, Fund, RecurringExpenseFrequency } from '@/lib/api/types'

export default function TemplatesPage() {
  // Состояние для расходов
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<RecurringExpenseWithCategory | null>(null)

  // Состояние для доходов
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<RecurringIncome | null>(null)

  // Состояние для переключения вида
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  // Данные
  const { data: recurringExpensesData } = useRecurringExpenses()
  const { data: recurringIncomesData } = useRecurringIncomes()
  const { data: categoriesData } = useExpenseCategories()
  const { data: fundsData } = useFunds()
  const { data: accountsData } = useAccounts()
  const { data: exchangeRatesData } = useExchangeRates()

  // Мутации для расходов
  const createRecurringExpense = useCreateRecurringExpense()
  const updateRecurringExpense = useUpdateRecurringExpense()
  const deleteRecurringExpense = useDeleteRecurringExpense()

  // Мутации для доходов
  const createRecurringIncome = useCreateRecurringIncome()
  const updateRecurringIncome = useUpdateRecurringIncome()
  const deleteRecurringIncome = useDeleteRecurringIncome()

  const recurringExpenses = recurringExpensesData?.data ?? []
  const recurringIncomes = recurringIncomesData?.data ?? []
  const categories = categoriesData?.data ?? []
  const fundsRaw = fundsData?.data ?? []
  const funds: Fund[] = fundsRaw.map((f) => f.fund)
  const accounts = accountsData?.data ?? []
  const exchangeRates = exchangeRatesData?.data ?? []

  // === Обработчики для расходов ===
  const handleAddExpense = () => {
    setEditingExpense(null)
    setExpenseDialogOpen(true)
  }

  const handleEditExpense = (expense: RecurringExpenseWithCategory) => {
    setEditingExpense(expense)
    setExpenseDialogOpen(true)
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteRecurringExpense.mutateAsync(id)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleToggleExpenseActive = async (id: string, isActive: boolean) => {
    try {
      await updateRecurringExpense.mutateAsync({
        id,
        data: { isActive },
      })
    } catch {
      toast.error('Ошибка изменения статуса')
    }
  }

  const handleSubmitExpense = async (data: {
    categoryId: string
    accountId?: string
    fundId?: string
    name: string
    amount: number
    currency: string
    frequency: RecurringExpenseFrequency
    dayOfMonth?: number
    dayOfWeek?: number
    monthOfYear?: number
    isActive: boolean
  }) => {
    try {
      if (editingExpense) {
        await updateRecurringExpense.mutateAsync({
          id: editingExpense.id,
          data: {
            categoryId: data.categoryId,
            accountId: data.accountId,
            fundId: data.fundId,
            name: data.name,
            amount: data.amount,
            currency: data.currency,
            frequency: data.frequency,
            dayOfMonth: data.dayOfMonth,
            dayOfWeek: data.dayOfWeek,
            monthOfYear: data.monthOfYear,
            isActive: data.isActive,
          },
        })
      } else {
        await createRecurringExpense.mutateAsync(data)
      }
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  // === Обработчики для доходов ===
  const handleAddIncome = () => {
    setEditingIncome(null)
    setIncomeDialogOpen(true)
  }

  const handleEditIncome = (income: RecurringIncome) => {
    setEditingIncome(income)
    setIncomeDialogOpen(true)
  }

  const handleDeleteIncome = async (id: string) => {
    try {
      await deleteRecurringIncome.mutateAsync(id)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleToggleIncomeActive = async (id: string, isActive: boolean) => {
    try {
      await updateRecurringIncome.mutateAsync({
        id,
        data: { isActive },
      })
    } catch {
      toast.error('Ошибка изменения статуса')
    }
  }

  const handleSubmitIncome = async (data: {
    source: string
    expectedAmount: number
    currency: string
    dayOfMonth: number
    isActive: boolean
    notes?: string
  }) => {
    try {
      if (editingIncome) {
        await updateRecurringIncome.mutateAsync({
          id: editingIncome.id,
          data: {
            source: data.source,
            expectedAmount: data.expectedAmount,
            dayOfMonth: data.dayOfMonth,
            isActive: data.isActive,
            notes: data.notes,
          },
        })
      } else {
        await createRecurringIncome.mutateAsync(data)
      }
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Repeat className="h-6 w-6 text-primary" />
            Шаблоны
          </h1>
          <p className="mt-1 text-muted-foreground">
            Управление шаблонами регулярных доходов и повторяющихся расходов
          </p>
        </div>

        {/* Переключатель вида */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-1 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 px-3 gap-1.5',
              viewMode === 'list' && 'bg-background shadow-sm'
            )}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
            <span className="text-sm">Список</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 px-3 gap-1.5',
              viewMode === 'calendar' && 'bg-background shadow-sm'
            )}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">Календарь</span>
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Секция: Шаблоны регулярных доходов */}
          <RecurringIncomesSection
            incomes={recurringIncomes}
            onAdd={handleAddIncome}
            onEdit={handleEditIncome}
            onDelete={handleDeleteIncome}
            onToggleActive={handleToggleIncomeActive}
            isDeleting={deleteRecurringIncome.isPending}
            isToggling={updateRecurringIncome.isPending}
          />

          {/* Секция: Шаблоны повторяющихся расходов */}
          <RecurringExpensesSection
            expenses={recurringExpenses}
            exchangeRates={exchangeRates}
            onAdd={handleAddExpense}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
            onToggleActive={handleToggleExpenseActive}
            isDeleting={deleteRecurringExpense.isPending}
            isToggling={updateRecurringExpense.isPending}
          />
        </>
      ) : (
        /* Календарный вид */
        <RecurringCalendar
          expenses={recurringExpenses}
          incomes={recurringIncomes}
          onExpenseClick={handleEditExpense}
          onIncomeClick={handleEditIncome}
        />
      )}

      {/* Диалог создания/редактирования расхода */}
      <RecurringExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        expense={editingExpense}
        categories={categories}
        accounts={accounts}
        funds={funds}
        onSubmit={handleSubmitExpense}
        isPending={createRecurringExpense.isPending || updateRecurringExpense.isPending}
      />

      {/* Диалог создания/редактирования дохода */}
      <RecurringIncomeDialog
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        income={editingIncome}
        onSubmit={handleSubmitIncome}
        isPending={createRecurringIncome.isPending || updateRecurringIncome.isPending}
      />
    </motion.div>
  )
}
