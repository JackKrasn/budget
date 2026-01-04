import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Copy,
  Loader2,
  AlertCircle,
  Wallet,
  Calendar,
  Plus,
  Banknote,
  PiggyBank,
  Calculator,
  LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  useBudgetByMonth,
  useBudgets,
  useCreateBudget,
  useUpsertBudgetItem,
  useCopyBudget,
  usePlannedExpenses,
  useConfirmPlannedExpense,
  useSkipPlannedExpense,
  useGeneratePlannedExpenses,
  useCreatePlannedExpense,
  usePlannedIncomes,
  useSkipPlannedIncome,
  useGeneratePlannedIncomes,
  useCreateIncomeAndReceive,
  budgetKeys,
  BudgetTable,
  MonthSelector,
  CopyBudgetDialog,
  PlannedExpensesSection,
  PlannedIncomesSection,
  AddPlannedExpenseDialog,
  ReceiveIncomeDialog,
  FundFinancingSection,
  mapFundBalanceToFinancing,
  DistributionSummarySection,
  FloatingBudgetBalance,
} from '@/features/budget'
import { useExpenseCategories, useExpenses, useCreateExpense } from '@/features/expenses'
import { useFunds } from '@/features/funds'
import { useAccounts } from '@/features/accounts'
import type { Fund, PlannedIncome } from '@/lib/api/types'

// Ключ для localStorage
const HIDDEN_CATEGORIES_KEY = 'budget-hidden-categories'

function getHiddenCategories(): string[] {
  try {
    const stored = localStorage.getItem(HIDDEN_CATEGORIES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setHiddenCategories(ids: string[]) {
  localStorage.setItem(HIDDEN_CATEGORIES_KEY, JSON.stringify(ids))
}

export default function BudgetPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [hiddenCategories, setHiddenCategoriesState] = useState<string[]>(getHiddenCategories)
  const [receiveIncomeDialogOpen, setReceiveIncomeDialogOpen] = useState(false)
  const [receivingIncome, setReceivingIncome] = useState<PlannedIncome | null>(null)

  // Вычисляем даты для фильтрации расходов
  const dateFrom = useMemo(() => {
    return `${year}-${String(month).padStart(2, '0')}-01`
  }, [year, month])

  const dateTo = useMemo(() => {
    // Последний день месяца
    const lastDay = new Date(year, month, 0).getDate()
    return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  }, [year, month])

  // Данные бюджета
  const {
    data: budgetData,
    isLoading,
    error,
    refetch,
  } = useBudgetByMonth(year, month)
  const { data: allBudgetsData } = useBudgets()
  const { data: categoriesData } = useExpenseCategories()
  const { data: fundsData } = useFunds()
  const { data: accountsData } = useAccounts()

  // Фактические расходы за выбранный месяц
  const { data: expensesData } = useExpenses({
    from: dateFrom,
    to: dateTo,
  })

  // Запланированные расходы
  const { data: plannedData } = usePlannedExpenses({
    budgetId: budgetData?.id,
    status: undefined, // Все статусы
  })

  // Запланированные доходы
  const { data: plannedIncomesData } = usePlannedIncomes({
    budgetId: budgetData?.id,
    status: undefined,
  })

  // Мутации
  const createBudget = useCreateBudget()
  const upsertItem = useUpsertBudgetItem()
  const copyBudget = useCopyBudget()
  const confirmPlanned = useConfirmPlannedExpense()
  const skipPlanned = useSkipPlannedExpense()
  const generatePlanned = useGeneratePlannedExpenses()
  const createPlanned = useCreatePlannedExpense()
  const createExpense = useCreateExpense()
  const createIncomeAndReceive = useCreateIncomeAndReceive()
  const skipPlannedIncome = useSkipPlannedIncome()
  const generatePlannedIncomes = useGeneratePlannedIncomes()

  const budget = budgetData
  const allBudgets = allBudgetsData?.data ?? []
  const items = budget?.items ?? []
  const categories = categoriesData?.data ?? []
  const plannedExpenses = plannedData?.data ?? []
  const plannedIncomes = plannedIncomesData?.data ?? []
  const expenses = expensesData?.data ?? []
  const fundsRaw = fundsData?.data ?? []
  const accounts = accountsData?.data ?? []
  // Преобразуем FundBalance в Fund для диалога
  const funds: Fund[] = fundsRaw.map((f) => f.fund)
  // Счёт по умолчанию (первый не архивный)
  const defaultAccountId = accounts.find((a) => !a.is_archived)?.id

  // Считаем фактические расходы по категориям
  const actualByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const expense of expenses) {
      const categoryId = expense.categoryId
      map[categoryId] = (map[categoryId] || 0) + expense.amount
    }
    return map
  }, [expenses])

  // Хелпер для извлечения actual_amount
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

  // Статистика
  const stats = useMemo(() => {
    const totalPlanned = items.reduce((sum, i) => sum + i.plannedAmount, 0)
    // Используем реальные расходы из expenses API
    const totalActual = Object.values(actualByCategory).reduce((sum, amount) => sum + amount, 0)
    const variance = totalPlanned - totalActual

    // Обязательные расходы из planned_expenses
    const totalPlannedExpenses = plannedExpenses.reduce((sum, e) => sum + e.planned_amount, 0)
    const pendingPlanned = plannedExpenses
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + e.planned_amount, 0)
    const confirmedPlanned = plannedExpenses
      .filter((e) => e.status === 'confirmed')
      .reduce((sum, e) => sum + (e.actual_amount ?? e.planned_amount), 0)

    // Статистика доходов
    const expectedIncome = plannedIncomes.reduce((sum, i) => sum + i.expected_amount, 0)
    const receivedIncome = plannedIncomes
      .filter((i) => i.status === 'received')
      .reduce((sum, i) => sum + (getActualAmount(i.actual_amount) ?? i.expected_amount), 0)
    const pendingIncome = plannedIncomes
      .filter((i) => i.status === 'pending')
      .reduce((sum, i) => sum + i.expected_amount, 0)

    // Распределения в фонды
    const expectedFundDistributions = budget?.distributionSummary?.totalExpectedDistribution ?? 0
    const actualFundDistributions = budget?.distributionSummary?.totalActualDistribution ?? 0

    // Доступно для планирования = Ожидаемый доход - План по категориям - Ожидаемые обязательные - Ожидаемые распределения в фонды
    const availableForPlanning = expectedIncome - totalPlanned - pendingPlanned - expectedFundDistributions

    // Реально доступно = Полученный доход - Фактические расходы - Подтверждённые распределения
    const actuallyAvailable = receivedIncome - totalActual - actualFundDistributions

    return {
      totalPlanned,
      totalActual,
      variance,
      isOverBudget: variance < 0,
      totalPlannedExpenses,
      pendingPlanned,
      confirmedPlanned,
      expectedIncome,
      receivedIncome,
      pendingIncome,
      expectedFundDistributions,
      actualFundDistributions,
      availableForPlanning,
      actuallyAvailable,
    }
  }, [items, plannedExpenses, plannedIncomes, actualByCategory, budget?.distributionSummary])

  // Данные для секции финансирования из фондов (пока заглушка)
  const fundFinancingData = useMemo(() => {
    return fundsRaw.map((f) =>
      mapFundBalanceToFinancing(f, 0, 0) // plannedAmount и usedAmount пока 0
    )
  }, [fundsRaw])

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear)
    setMonth(newMonth)
  }

  const handleUpdateItem = async (categoryId: string, plannedAmount: number) => {
    let budgetId = budget?.id

    // Если бюджета нет — создаём
    if (!budgetId) {
      try {
        const newBudget = await createBudget.mutateAsync({ year, month })
        budgetId = newBudget.id
      } catch {
        toast.error('Ошибка создания бюджета')
        return
      }
    }

    try {
      await upsertItem.mutateAsync({
        budgetId,
        data: { categoryId, plannedAmount },
      })
      // Принудительно инвалидируем и ждём обновления
      await queryClient.invalidateQueries({ queryKey: budgetKeys.byMonth(year, month) })
      toast.success('Лимит обновлён')
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      toast.error('Ошибка сохранения')
    }
  }

  const handleCopyBudget = async (sourceBudgetId: string) => {
    try {
      await copyBudget.mutateAsync({
        id: sourceBudgetId,
        targetYear: year,
        targetMonth: month,
      })
      toast.success('Бюджет скопирован')
      refetch()
    } catch {
      toast.error('Ошибка копирования')
    }
  }

  const handleConfirmPlanned = async (id: string) => {
    // Находим planned expense
    const plannedExpense = plannedExpenses.find((e) => e.id === id)
    if (!plannedExpense) {
      toast.error('Расход не найден')
      return
    }

    // Определяем счёт: из planned expense или по умолчанию
    const accountId = plannedExpense.account_id || defaultAccountId
    if (!accountId) {
      toast.error('Не найден счёт для списания. Создайте счёт в настройках.')
      return
    }

    try {
      // 1. Создаём реальный расход
      const expense = await createExpense.mutateAsync({
        categoryId: plannedExpense.category_id,
        accountId,
        amount: plannedExpense.planned_amount,
        currency: plannedExpense.currency || 'RUB',
        date: new Date().toISOString().split('T')[0],
        description: plannedExpense.name,
        fundAllocations: plannedExpense.fund_id
          ? [{ fundId: plannedExpense.fund_id, amount: plannedExpense.planned_amount }]
          : undefined,
      })

      // 2. Подтверждаем planned expense с ID созданного расхода
      await confirmPlanned.mutateAsync({
        id,
        data: { actualExpenseId: expense.id },
      })

      toast.success('Расход подтверждён')
    } catch (error) {
      console.error('Ошибка подтверждения:', error)
      toast.error('Ошибка подтверждения')
    }
  }

  const handleSkipPlanned = async (id: string) => {
    try {
      await skipPlanned.mutateAsync(id)
    } catch {
      toast.error('Ошибка')
    }
  }

  const handleGeneratePlanned = async () => {
    let budgetId = budget?.id

    // Если бюджета нет — создаём его автоматически
    if (!budgetId) {
      try {
        const newBudget = await createBudget.mutateAsync({ year, month })
        budgetId = newBudget.id
      } catch {
        toast.error('Ошибка создания бюджета')
        return
      }
    }

    try {
      await generatePlanned.mutateAsync(budgetId)
      refetch()
    } catch {
      toast.error('Ошибка генерации')
    }
  }

  const handleUpdateFundFinancing = async (_fundId: string, _plannedAmount: number) => {
    // TODO: Сохранить планируемое финансирование из фонда
    toast.success('Финансирование обновлено')
  }

  const handleReceivePlannedIncome = async (id: string) => {
    // Открываем диалог для ввода фактической суммы
    const income = plannedIncomes.find((i) => i.id === id)
    if (income) {
      setReceivingIncome(income)
      setReceiveIncomeDialogOpen(true)
    }
  }

  const handleConfirmReceiveIncome = async (data: {
    actualAmount: number
    actualDate: string
  }) => {
    if (!receivingIncome) return

    try {
      // Создаём фактический доход и связываем с запланированным
      await createIncomeAndReceive.mutateAsync({
        incomeData: {
          source: receivingIncome.source,
          amount: data.actualAmount,
          currency: receivingIncome.currency || 'RUB',
          date: data.actualDate,
          description: receivingIncome.notes || undefined,
        },
        plannedIncomeId: receivingIncome.id,
      })
      setReceiveIncomeDialogOpen(false)
      setReceivingIncome(null)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleSkipPlannedIncome = async (id: string) => {
    try {
      await skipPlannedIncome.mutateAsync(id)
    } catch {
      toast.error('Ошибка')
    }
  }

  const handleGeneratePlannedIncomes = async () => {
    let budgetId = budget?.id

    if (!budgetId) {
      try {
        const newBudget = await createBudget.mutateAsync({ year, month })
        budgetId = newBudget.id
      } catch {
        toast.error('Ошибка создания бюджета')
        return
      }
    }

    try {
      await generatePlannedIncomes.mutateAsync(budgetId)
      refetch()
    } catch {
      toast.error('Ошибка генерации доходов')
    }
  }

  const handleAddPlannedExpense = async (data: {
    budgetId: string
    categoryId: string
    fundId?: string
    name: string
    plannedAmount: number
    currency: string
    plannedDate: string
  }) => {
    try {
      await createPlanned.mutateAsync(data)
    } catch {
      toast.error('Ошибка создания расхода')
    }
  }

  const handleToggleCategory = (categoryId: string) => {
    setHiddenCategoriesState((prev) => {
      const newHidden = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
      setHiddenCategories(newHidden)
      return newHidden
    })
  }

  const handleCategoryClick = (categoryId: string) => {
    // Переход на страницу расходов с фильтром по категории
    navigate(`/expenses?category=${categoryId}`)
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Планирование бюджета
          </h1>
          <p className="mt-1 text-muted-foreground">
            Установите лимиты расходов по категориям
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthSelector year={year} month={month} onChange={handleMonthChange} />
          {!budget?.id && (
            <Button
              onClick={async () => {
                try {
                  await createBudget.mutateAsync({ year, month })
                  toast.success('Бюджет создан')
                  refetch()
                } catch {
                  toast.error('Ошибка создания бюджета')
                }
              }}
              disabled={createBudget.isPending}
            >
              {createBudget.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Создать бюджет
            </Button>
          )}
          <Button variant="outline" onClick={() => setCopyDialogOpen(true)}>
            <Copy className="mr-2 h-4 w-4" />
            Копировать
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards - Row 1: Доходы и распределение */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Ожидаемый доход */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Banknote className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ожидаемый доход</p>
                <p className="text-lg font-bold tabular-nums text-emerald-500">
                  {formatMoney(stats.expectedIncome)} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  получено {formatMoney(stats.receivedIncome)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Обязательные расходы */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                <Calendar className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Обязательные</p>
                <p className="text-lg font-bold tabular-nums text-orange-500">
                  {formatMoney(stats.totalPlannedExpenses)} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  ожидает {formatMoney(stats.pendingPlanned)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* По категориям */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <LayoutGrid className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">По категориям</p>
                <p className="text-lg font-bold tabular-nums">
                  {formatMoney(stats.totalPlanned)} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  потрачено {formatMoney(stats.totalActual)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* В фонды */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                <PiggyBank className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">В фонды</p>
                <p className="text-lg font-bold tabular-nums text-violet-500">
                  {formatMoney(stats.expectedFundDistributions)} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  подтверждено {formatMoney(stats.actualFundDistributions)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards - Row 2: Итоги */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid gap-4 sm:grid-cols-2"
      >
        {/* Доступно для планирования */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  stats.availableForPlanning < 0 ? 'bg-destructive/10' : 'bg-violet-500/10'
                }`}
              >
                <Calculator
                  className={`h-4 w-4 ${
                    stats.availableForPlanning < 0 ? 'text-destructive' : 'text-violet-500'
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Для планирования</p>
                <p
                  className={`text-lg font-bold tabular-nums ${
                    stats.availableForPlanning < 0 ? 'text-destructive' : 'text-violet-500'
                  }`}
                >
                  {formatMoney(stats.availableForPlanning)} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  = доход − обязательные − категории − фонды
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Реально доступно */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  stats.actuallyAvailable < 0 ? 'bg-destructive/10' : 'bg-cyan-500/10'
                }`}
              >
                <Wallet
                  className={`h-4 w-4 ${
                    stats.actuallyAvailable < 0 ? 'text-destructive' : 'text-cyan-500'
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Реально свободно</p>
                <p
                  className={`text-lg font-bold tabular-nums ${
                    stats.actuallyAvailable < 0 ? 'text-destructive' : 'text-cyan-500'
                  }`}
                >
                  {formatMoney(stats.actuallyAvailable)} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  = получено − потрачено − в фонды
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Ошибка загрузки: {error.message}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {/* Секция 0: Ожидаемые доходы */}
          <PlannedIncomesSection
            incomes={plannedIncomes}
            onReceive={handleReceivePlannedIncome}
            onSkip={handleSkipPlannedIncome}
            onGenerate={handleGeneratePlannedIncomes}
            isGenerating={generatePlannedIncomes.isPending || createBudget.isPending}
            isPending={createIncomeAndReceive.isPending || skipPlannedIncome.isPending}
          />

          {/* Секция 0.5: Распределение по фондам */}
          <DistributionSummarySection
            summary={budget?.distributionSummary}
            fundDistributions={budget?.fundDistributions}
            totalIncome={stats.expectedIncome}
          />

          {/* Секция 1: Обязательные расходы */}
          <PlannedExpensesSection
            expenses={plannedExpenses}
            onConfirm={handleConfirmPlanned}
            onSkip={handleSkipPlanned}
            onGenerate={handleGeneratePlanned}
            isGenerating={generatePlanned.isPending || createBudget.isPending}
            isPending={confirmPlanned.isPending || skipPlanned.isPending}
            addButton={
              budget?.id && (
                <AddPlannedExpenseDialog
                  budgetId={budget.id}
                  year={year}
                  month={month}
                  categories={categories}
                  funds={funds}
                  onAdd={handleAddPlannedExpense}
                  isPending={createPlanned.isPending}
                />
              )
            }
          />

          {/* Секция 2: Таблица категорий */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">Расходы по категориям</h2>
            <BudgetTable
              items={items}
              allCategories={categories}
              onUpdateItem={handleUpdateItem}
              isPending={upsertItem.isPending}
              hiddenCategories={hiddenCategories}
              onToggleCategory={handleToggleCategory}
              actualByCategory={actualByCategory}
              onCategoryClick={handleCategoryClick}
            />
          </div>

          {/* Секция 3: Финансирование из фондов */}
          <FundFinancingSection
            funds={fundFinancingData}
            onUpdate={handleUpdateFundFinancing}
          />
        </div>
      )}

      {/* Copy Dialog */}
      <CopyBudgetDialog
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        targetYear={year}
        targetMonth={month}
        previousBudgets={allBudgets}
        onCopy={handleCopyBudget}
        isPending={copyBudget.isPending}
      />

      {/* Receive Income Dialog */}
      <ReceiveIncomeDialog
        open={receiveIncomeDialogOpen}
        onOpenChange={setReceiveIncomeDialogOpen}
        income={receivingIncome}
        onSubmit={handleConfirmReceiveIncome}
        isPending={createIncomeAndReceive.isPending}
      />

      {/* Floating Budget Balance */}
      <FloatingBudgetBalance
        availableForPlanning={stats.availableForPlanning}
        actuallyAvailable={stats.actuallyAvailable}
        isVisible={!isLoading && !error}
      />
    </div>
  )
}
