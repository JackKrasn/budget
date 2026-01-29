import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Repeat, List, CalendarDays, LayoutGrid, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
  RecurringExpensesByCategory,
  RecurringExpenseDialog,
  RecurringIncomesSection,
  RecurringIncomeDialog,
  RecurringCalendar,
} from '@/features/budget'
import { useExpenseCategories, useExchangeRates } from '@/features/expenses'
import { useFunds } from '@/features/funds'
import { useAccounts } from '@/features/accounts'
import type { RecurringExpenseWithCategory, RecurringIncome, Fund, RecurringExpenseFrequency } from '@/lib/api/types'

type ViewMode = 'categories' | 'list' | 'calendar'

interface ExpenseDefaultValues {
  categoryId?: string
  dayOfMonth?: number
  frequency?: RecurringExpenseFrequency
}

export default function TemplatesPage() {
  // Состояние для расходов
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<RecurringExpenseWithCategory | null>(null)
  const [expenseDefaults, setExpenseDefaults] = useState<ExpenseDefaultValues | undefined>(undefined)

  // Состояние для доходов
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<RecurringIncome | null>(null)

  // Состояние для переключения вида (по умолчанию категории)
  const [viewMode, setViewMode] = useState<ViewMode>('categories')

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

  // Функции для работы с курсами валют
  const getExchangeRate = (currency: string): number => {
    if (currency === 'RUB') return 1
    const rate = exchangeRates.find(
      (r) => r.from_currency === currency && r.to_currency === 'RUB'
    )
    return rate?.rate ?? 1
  }

  const toRub = (amount: number, currency: string): number => {
    return amount * getExchangeRate(currency)
  }

  // Считаем общую сумму активных расходов (в RUB, месячный эквивалент)
  const totalActiveExpensesRub = recurringExpenses
    .filter((e) => e.is_active)
    .reduce((sum, e) => {
      const baseAmount = toRub(e.amount, e.currency || 'RUB')
      const frequency = e.frequency || 'monthly'
      switch (frequency) {
        case 'daily':
          return sum + baseAmount * 30
        case 'weekly':
          return sum + baseAmount * 4.33
        case 'yearly':
          return sum + baseAmount / 12
        default:
          return sum + baseAmount
      }
    }, 0)

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  // === Обработчики для расходов ===
  const handleAddExpense = () => {
    setEditingExpense(null)
    setExpenseDefaults(undefined)
    setExpenseDialogOpen(true)
  }

  // Добавить расход с заданной категорией (из вида "Категории")
  const handleAddExpenseInCategory = (categoryId: string) => {
    setEditingExpense(null)
    setExpenseDefaults({ categoryId })
    setExpenseDialogOpen(true)
  }

  // Добавить расход с заданным днём (из календаря)
  const handleAddExpenseOnDay = (dayOfMonth: number) => {
    setEditingExpense(null)
    setExpenseDefaults({ dayOfMonth, frequency: 'monthly' })
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
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
          className="bg-muted/50 p-1 rounded-lg"
        >
          <ToggleGroupItem value="categories" aria-label="По категориям" className="gap-1.5 px-3">
            <LayoutGrid className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Категории</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="Список" className="gap-1.5 px-3">
            <List className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Список</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Календарь" className="gap-1.5 px-3">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Календарь</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Секция: Шаблоны регулярных доходов - показываем в режимах списка и категорий */}
      {(viewMode === 'list' || viewMode === 'categories') && (
        <RecurringIncomesSection
          incomes={recurringIncomes}
          onAdd={handleAddIncome}
          onEdit={handleEditIncome}
          onDelete={handleDeleteIncome}
          onToggleActive={handleToggleIncomeActive}
          isDeleting={deleteRecurringIncome.isPending}
          isToggling={updateRecurringIncome.isPending}
        />
      )}

      {/* Секция: Шаблоны повторяющихся расходов */}
      {viewMode === 'list' ? (
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
      ) : viewMode === 'categories' ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                Шаблоны повторяющихся расходов
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Всего в месяц:{' '}
                  <span className="font-semibold text-foreground">
                    ~{formatMoney(totalActiveExpensesRub)} ₽
                  </span>
                </span>
                <Button variant="outline" size="sm" onClick={handleAddExpense}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recurringExpenses.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/30">
                <LayoutGrid className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Нет шаблонов повторяющихся расходов
                </p>
                <Button variant="outline" size="sm" onClick={handleAddExpense}>
                  Создать шаблон
                </Button>
              </div>
            ) : (
              <RecurringExpensesByCategory
                expenses={recurringExpenses}
                exchangeRates={exchangeRates}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                onToggleActive={handleToggleExpenseActive}
                onAddInCategory={handleAddExpenseInCategory}
                isDeleting={deleteRecurringExpense.isPending}
                isToggling={updateRecurringExpense.isPending}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        /* Календарный вид */
        <RecurringCalendar
          expenses={recurringExpenses}
          incomes={recurringIncomes}
          onExpenseClick={handleEditExpense}
          onIncomeClick={handleEditIncome}
          onDayClick={handleAddExpenseOnDay}
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
        defaultValues={expenseDefaults}
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
