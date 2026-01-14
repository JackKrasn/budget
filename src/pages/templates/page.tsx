import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Repeat } from 'lucide-react'
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
} from '@/features/budget'
import { useExpenseCategories } from '@/features/expenses'
import { useFunds } from '@/features/funds'
import type { RecurringExpenseWithCategory, RecurringIncome, Fund } from '@/lib/api/types'

export default function TemplatesPage() {
  // Состояние для расходов
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<RecurringExpenseWithCategory | null>(null)

  // Состояние для доходов
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<RecurringIncome | null>(null)

  // Данные
  const { data: recurringExpensesData } = useRecurringExpenses()
  const { data: recurringIncomesData } = useRecurringIncomes()
  const { data: categoriesData } = useExpenseCategories()
  const { data: fundsData } = useFunds()

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
    fundId?: string
    name: string
    amount: number
    currency: string
    dayOfMonth: number
    isActive: boolean
  }) => {
    try {
      if (editingExpense) {
        await updateRecurringExpense.mutateAsync({
          id: editingExpense.id,
          data: {
            categoryId: data.categoryId,
            fundId: data.fundId,
            name: data.name,
            amount: data.amount,
            dayOfMonth: data.dayOfMonth,
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
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Repeat className="h-6 w-6 text-primary" />
          Шаблоны
        </h1>
        <p className="mt-1 text-muted-foreground">
          Управление шаблонами регулярных доходов и повторяющихся расходов
        </p>
      </div>

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
        onAdd={handleAddExpense}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
        onToggleActive={handleToggleExpenseActive}
        isDeleting={deleteRecurringExpense.isPending}
        isToggling={updateRecurringExpense.isPending}
      />

      {/* Диалог создания/редактирования расхода */}
      <RecurringExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        expense={editingExpense}
        categories={categories}
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
