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
  TrendingUp,
  Receipt,
  LayoutList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { toast } from 'sonner'
import {
  useBudgetByMonth,
  useBudgets,
  useCreateBudget,
  useUpsertBudgetItem,
  useCopyBudget,
  usePlannedExpenses,
  useConfirmPlannedExpenseWithExpense,
  useSkipPlannedExpense,
  useDeletePlannedExpense,
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
  BudgetItemDialog,
} from '@/features/budget'
import { useExpenseCategories, useExpenses } from '@/features/expenses'
import { useFunds } from '@/features/funds'
import { useAccounts } from '@/features/accounts'
import { budgetsApi } from '@/lib/api/budgets'
import type { PlannedIncome, BudgetItemWithCategory } from '@/lib/api/types'

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
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItemWithCategory | null>(null)

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
  const confirmPlannedWithExpense = useConfirmPlannedExpenseWithExpense()
  const skipPlanned = useSkipPlannedExpense()
  const deletePlanned = useDeletePlannedExpense()
  const generatePlanned = useGeneratePlannedExpenses()
  const createPlanned = useCreatePlannedExpense()
  const createIncomeAndReceive = useCreateIncomeAndReceive()
  const skipPlannedIncome = useSkipPlannedIncome()
  const generatePlannedIncomes = useGeneratePlannedIncomes()

  const budget = budgetData
  const allBudgets = allBudgetsData?.data ?? []
  const items = useMemo(() => budget?.items ?? [], [budget?.items])
  const categories = categoriesData?.data ?? []
  const plannedExpenses = useMemo(() => plannedData?.data ?? [], [plannedData?.data])
  const plannedIncomes = useMemo(() => plannedIncomesData?.data ?? [], [plannedIncomesData?.data])
  const expenses = expensesData?.data ?? []
  const fundsRaw = useMemo(() => fundsData?.data ?? [], [fundsData?.data])
  const accounts = accountsData?.data ?? []

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
      .reduce((sum, e) => sum + (getActualAmount(e.actual_amount) ?? e.planned_amount), 0)

    // Финансирование обязательных расходов из фондов
    // funded_amount приходит как { Float64: number, Valid: boolean }
    const plannedFromFunds = plannedExpenses
      .filter((e) => e.status === 'pending' && getActualAmount(e.funded_amount))
      .reduce((sum, e) => sum + (getActualAmount(e.funded_amount) ?? 0), 0)
    const confirmedFromFunds = plannedExpenses
      .filter((e) => e.status === 'confirmed' && getActualAmount(e.funded_amount))
      .reduce((sum, e) => sum + (getActualAmount(e.funded_amount) ?? 0), 0)
    const totalFromFunds = plannedFromFunds + confirmedFromFunds

    // Обязательные из бюджета (без финансирования из фондов)
    const pendingPlannedFromBudget = pendingPlanned - plannedFromFunds
    const confirmedPlannedFromBudget = confirmedPlanned - confirmedFromFunds

    // Статистика доходов
    const expectedIncome = plannedIncomes.reduce((sum, i) => sum + i.expected_amount, 0)
    const receivedIncome = plannedIncomes
      .filter((i) => i.status === 'received')
      .reduce((sum, i) => sum + (getActualAmount(i.actual_amount) ?? i.expected_amount), 0)
    const pendingIncome = plannedIncomes
      .filter((i) => i.status === 'pending')
      .reduce((sum, i) => sum + i.expected_amount, 0)

    // Распределения в фонды (входящие)
    const expectedFundDistributions = budget?.distributionSummary?.totalExpectedDistribution ?? 0
    const actualFundDistributions = budget?.distributionSummary?.totalActualDistribution ?? 0

    // Доступно для планирования = Ожидаемый доход - План по категориям - Обязательные ИЗ БЮДЖЕТА - Распределения в фонды
    const availableForPlanning = expectedIncome - totalPlanned - pendingPlannedFromBudget - expectedFundDistributions

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
      // Новые поля для финансирования из фондов
      plannedFromFunds,
      confirmedFromFunds,
      totalFromFunds,
      pendingPlannedFromBudget,
      confirmedPlannedFromBudget,
      // Доходы
      expectedIncome,
      receivedIncome,
      pendingIncome,
      expectedFundDistributions,
      actualFundDistributions,
      availableForPlanning,
      actuallyAvailable,
    }
  }, [items, plannedExpenses, plannedIncomes, actualByCategory, budget?.distributionSummary])

  // Данные для секции финансирования из фондов
  const fundFinancingData = useMemo(() => {
    // Собираем суммы из запланированных расходов по фондам
    // funded_amount приходит как { Float64: number, Valid: boolean }
    const fundPlanned = new Map<string, number>()
    const fundUsed = new Map<string, number>()

    // 1. Добавляем суммы из запланированных расходов (planned expenses)
    for (const expense of plannedExpenses) {
      const fundedAmount = getActualAmount(expense.funded_amount)
      if (expense.fund_id && fundedAmount && fundedAmount > 0) {
        const current = fundPlanned.get(expense.fund_id) || 0
        fundPlanned.set(expense.fund_id, current + fundedAmount)

        // Если расход подтверждён, считаем как использованный
        if (expense.status === 'confirmed') {
          const currentUsed = fundUsed.get(expense.fund_id) || 0
          fundUsed.set(expense.fund_id, currentUsed + fundedAmount)
        }
      }
    }

    // 2. Добавляем суммы из бюджетных категорий с финансированием из фондов
    for (const item of items) {
      if (item.fundId && item.fundAllocation && item.fundAllocation > 0) {
        const current = fundPlanned.get(item.fundId) || 0
        fundPlanned.set(item.fundId, current + item.fundAllocation)

        // Фактически использовано = actualAmount категории (но не больше fundAllocation)
        const usedFromFund = Math.min(item.actualAmount, item.fundAllocation)
        if (usedFromFund > 0) {
          const currentUsed = fundUsed.get(item.fundId) || 0
          fundUsed.set(item.fundId, currentUsed + usedFromFund)
        }
      }
    }

    return fundsRaw.map((f) =>
      mapFundBalanceToFinancing(
        f,
        fundPlanned.get(f.fund.id) || 0,
        fundUsed.get(f.fund.id) || 0
      )
    )
  }, [fundsRaw, plannedExpenses, items])

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

  // Сохранение настроек категории (с финансированием из фонда)
  const handleSaveItem = async (
    categoryId: string,
    plannedAmount: number,
    notes?: string,
    fundId?: string,
    fundAllocation?: number
  ) => {
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
      await upsertItem.mutateAsync({
        budgetId,
        data: {
          categoryId,
          plannedAmount,
          notes,
          fundId,
          fundAllocation,
        },
      })
      await queryClient.invalidateQueries({ queryKey: budgetKeys.byMonth(year, month) })
      toast.success('Настройки сохранены')
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

  const handleConfirmPlanned = async (
    id: string,
    data: {
      actualAmount?: number
      accountId: string
      date: string
      notes?: string
    }
  ) => {
    try {
      await confirmPlannedWithExpense.mutateAsync({
        id,
        data,
        budgetId: budget?.id,
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

  const handleDeletePlanned = async (id: string) => {
    try {
      await deletePlanned.mutateAsync(id)
    } catch {
      toast.error('Ошибка удаления')
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
      // Генерируем recurring шаблоны
      await generatePlanned.mutateAsync(budgetId)
      // Генерируем кредитные платежи
      await budgetsApi.generateCreditPayments(budgetId)
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
    fundedAmount?: number
    name: string
    plannedAmount: number
    currency: string
    plannedDate: string
    notes?: string
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

        {/* Запланированные расходы */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                <Calendar className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Запланированные</p>
                <p className="text-lg font-bold tabular-nums text-orange-500">
                  {formatMoney(stats.totalPlannedExpenses)} ₽
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="whitespace-nowrap">
                    из бюджета {formatMoney(stats.pendingPlannedFromBudget)} ₽
                  </span>
                  {stats.plannedFromFunds > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <PiggyBank className="h-3 w-3" />
                        из фондов {formatMoney(stats.plannedFromFunds)} ₽
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Общее запланированное */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <LayoutGrid className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Общее запланированное</p>
                <p className="text-lg font-bold tabular-nums">
                  {formatMoney(budgetData?.total_planned ?? 0)} ₽
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">В фонды</p>
                <p className="text-lg font-bold tabular-nums text-foreground">
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
                  stats.availableForPlanning < 0 ? 'bg-destructive/10' : 'bg-muted'
                }`}
              >
                <Calculator
                  className={`h-4 w-4 ${
                    stats.availableForPlanning < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Для планирования</p>
                <p
                  className={`text-lg font-bold tabular-nums ${
                    stats.availableForPlanning < 0 ? 'text-destructive' : 'text-foreground'
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
        <div className="space-y-4">
          {/* Секция 0: Ожидаемые доходы */}
          <CollapsibleSection
            id="planned-incomes"
            title="Ожидаемые доходы"
            icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
            badge={
              plannedIncomes.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {plannedIncomes.filter((i) => i.status === 'pending').length} ожидают
                </Badge>
              )
            }
          >
            <PlannedIncomesSection
              incomes={plannedIncomes}
              onReceive={handleReceivePlannedIncome}
              onSkip={handleSkipPlannedIncome}
              onGenerate={handleGeneratePlannedIncomes}
              isGenerating={generatePlannedIncomes.isPending || createBudget.isPending}
              isPending={createIncomeAndReceive.isPending || skipPlannedIncome.isPending}
              hideWrapper
            />
          </CollapsibleSection>

          {/* Секция 0.5: Распределение по фондам */}
          <CollapsibleSection
            id="fund-distributions"
            title="Распределение по фондам"
            icon={<PiggyBank className="h-4 w-4 text-primary" />}
            badge={
              stats.expectedFundDistributions > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {formatMoney(stats.expectedFundDistributions)} ₽
                </Badge>
              )
            }
          >
            <DistributionSummarySection
              summary={budget?.distributionSummary}
              fundDistributions={budget?.fundDistributions}
              totalIncome={stats.expectedIncome}
              hideWrapper
            />
          </CollapsibleSection>

          {/* Секция 1: Запланированные расходы */}
          <CollapsibleSection
            id="planned-expenses"
            title="Запланированные расходы"
            icon={<Receipt className="h-4 w-4 text-orange-500" />}
            badge={
              plannedExpenses.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {plannedExpenses.filter((e) => e.status === 'pending').length} ожидают
                </Badge>
              )
            }
            headerAction={
              budget?.id && (
                <AddPlannedExpenseDialog
                  budgetId={budget.id}
                  year={year}
                  month={month}
                  categories={categories}
                  funds={fundsRaw}
                  onAdd={handleAddPlannedExpense}
                  isPending={createPlanned.isPending}
                />
              )
            }
          >
            <PlannedExpensesSection
              expenses={plannedExpenses}
              accounts={accounts}
              onConfirm={handleConfirmPlanned}
              onSkip={handleSkipPlanned}
              onDelete={handleDeletePlanned}
              onGenerate={handleGeneratePlanned}
              isGenerating={generatePlanned.isPending || createBudget.isPending}
              isPending={confirmPlannedWithExpense.isPending || skipPlanned.isPending || deletePlanned.isPending}
              hideWrapper
            />
          </CollapsibleSection>

          {/* Секция 2: Таблица категорий */}
          <CollapsibleSection
            id="budget-categories"
            title="Расходы по категориям"
            icon={<LayoutList className="h-4 w-4 text-primary" />}
            badge={
              items.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {items.length} категорий
                </Badge>
              )
            }
          >
            <BudgetTable
              items={items}
              allCategories={categories}
              onUpdateItem={handleUpdateItem}
              isPending={upsertItem.isPending}
              hiddenCategories={hiddenCategories}
              onToggleCategory={handleToggleCategory}
              actualByCategory={actualByCategory}
              onCategoryClick={handleCategoryClick}
              onEditCategory={(item) => {
                setEditingItem(item)
                setEditItemDialogOpen(true)
              }}
              fundNames={fundsRaw.reduce((acc, f) => {
                acc[f.fund.id] = f.fund.name
                return acc
              }, {} as Record<string, string>)}
            />
          </CollapsibleSection>

          {/* Секция 3: Финансирование из фондов (показываем только если есть планы использования) */}
          {fundFinancingData.some((f) => f.plannedAmount > 0) && (
            <CollapsibleSection
              id="fund-financing"
              title="Финансирование из фондов"
              icon={<Wallet className="h-4 w-4 text-cyan-500" />}
              badge={
                <Badge variant="secondary" className="ml-2 text-xs">
                  {formatMoney(stats.totalFromFunds)} ₽
                </Badge>
              }
            >
              <FundFinancingSection
                funds={fundFinancingData.filter((f) => f.plannedAmount > 0)}
                onUpdate={handleUpdateFundFinancing}
                hideWrapper
              />
            </CollapsibleSection>
          )}
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

      {/* Budget Item Dialog (настройки категории) */}
      <BudgetItemDialog
        item={editingItem}
        open={editItemDialogOpen}
        onOpenChange={setEditItemDialogOpen}
        onSave={handleSaveItem}
        isPending={upsertItem.isPending}
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
