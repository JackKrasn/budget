import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Calendar,
  Receipt,
  Banknote,
  List,
  CalendarDays,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useBudgetByMonth,
  useCreateBudget,
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
  PlannedExpensesSection,
  PlannedIncomesSection,
  AddPlannedExpenseDialog,
  ReceiveIncomeDialog,
  PaymentCalendar,
} from '@/features/budget'
import { useExpenseCategories } from '@/features/expenses'
import { useFunds } from '@/features/funds'
import { useAccounts } from '@/features/accounts'
import type { PlannedIncome, FundBalance } from '@/lib/api/types'

export default function PlannedPaymentsPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [receiveIncomeDialogOpen, setReceiveIncomeDialogOpen] = useState(false)
  const [receivingIncome, setReceivingIncome] = useState<PlannedIncome | null>(null)
  const [overdueAlertDismissed, setOverdueAlertDismissed] = useState(false)

  // Данные бюджета
  const { data: budgetData } = useBudgetByMonth(year, month)
  const budgetId = budgetData?.id

  // Запланированные платежи
  const { data: plannedExpensesData } = usePlannedExpenses(
    budgetId ? { budgetId } : undefined
  )
  const { data: plannedIncomesData } = usePlannedIncomes(
    budgetId ? { budgetId } : undefined
  )

  // Справочники
  const { data: categoriesData } = useExpenseCategories()
  const { data: fundsData } = useFunds()
  const { data: accountsData } = useAccounts()

  // Мутации
  const createBudget = useCreateBudget()
  const confirmPlannedWithExpense = useConfirmPlannedExpenseWithExpense()
  const skipPlanned = useSkipPlannedExpense()
  const deletePlanned = useDeletePlannedExpense()
  const generatePlanned = useGeneratePlannedExpenses()
  const createPlanned = useCreatePlannedExpense()
  const skipPlannedIncome = useSkipPlannedIncome()
  const generatePlannedIncomes = useGeneratePlannedIncomes()
  const createIncomeAndReceive = useCreateIncomeAndReceive()

  const plannedExpenses = plannedExpensesData?.data ?? []
  const plannedIncomes = plannedIncomesData?.data ?? []
  const categories = categoriesData?.data ?? []
  const fundsRaw = (fundsData?.data ?? []) as FundBalance[]
  const accounts = accountsData?.data ?? []

  // Статистика
  const stats = useMemo(() => {
    const pendingExpenses = plannedExpenses.filter((e) => e.status === 'pending')
    const pendingIncomes = plannedIncomes.filter((i) => i.status === 'pending')

    const totalPendingExpenses = pendingExpenses.reduce((sum, e) => sum + e.planned_amount, 0)
    const totalPendingIncomes = pendingIncomes.reduce((sum, i) => sum + i.expected_amount, 0)

    // Просроченные (дата до сегодня, но не выполнены)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const overdueExpenses = pendingExpenses.filter((e) => {
      const dateStr = typeof e.planned_date === 'string' ? e.planned_date : e.planned_date?.Time
      if (!dateStr) return false
      return new Date(dateStr) < todayStart
    })
    const overdueIncomes = pendingIncomes.filter((i) => {
      const dateStr = typeof i.expected_date === 'string'
        ? i.expected_date
        : i.expected_date && typeof i.expected_date === 'object' && 'Time' in i.expected_date
          ? i.expected_date.Time
          : null
      if (!dateStr) return false
      return new Date(dateStr) < todayStart
    })

    return {
      pendingExpensesCount: pendingExpenses.length,
      pendingIncomesCount: pendingIncomes.length,
      totalPendingExpenses,
      totalPendingIncomes,
      overdueCount: overdueExpenses.length + overdueIncomes.length,
    }
  }, [plannedExpenses, plannedIncomes, now])

  // Навигация по месяцам
  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const currentMonthLabel = format(new Date(year, month - 1, 1), 'LLLL yyyy', { locale: ru })

  // Обработчики для расходов
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
      })
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleSkipPlanned = async (id: string) => {
    try {
      await skipPlanned.mutateAsync(id)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleDeletePlanned = async (id: string) => {
    try {
      await deletePlanned.mutateAsync(id)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleGeneratePlanned = async () => {
    if (!budgetId) {
      // Создаём бюджет если его нет
      try {
        const newBudget = await createBudget.mutateAsync({ year, month })
        await generatePlanned.mutateAsync(newBudget.id)
        await generatePlannedIncomes.mutateAsync(newBudget.id)
      } catch {
        toast.error('Ошибка создания бюджета')
      }
      return
    }
    try {
      await generatePlanned.mutateAsync(budgetId)
      await generatePlannedIncomes.mutateAsync(budgetId)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleAddPlannedExpense = async (data: {
    budgetId: string
    categoryId: string
    fundId?: string
    fundAssetId?: string
    fundedAmount?: number
    name: string
    plannedAmount: number
    currency: string
    plannedDate: string
    notes?: string
  }) => {
    try {
      await createPlanned.mutateAsync(data)
      // Диалог закрывается автоматически
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  // Обработчики для доходов
  const handleReceiveIncome = async (id: string) => {
    const income = plannedIncomes.find((i) => i.id === id)
    if (income) {
      setReceivingIncome(income)
      setReceiveIncomeDialogOpen(true)
    }
  }

  const handleSkipIncome = async (id: string) => {
    try {
      await skipPlannedIncome.mutateAsync(id)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleConfirmReceiveIncome = async (data: {
    actualAmount: number
    actualDate: string
    accountId: string
  }) => {
    if (!receivingIncome) return
    try {
      await createIncomeAndReceive.mutateAsync({
        incomeData: {
          source: receivingIncome.source,
          amount: data.actualAmount,
          currency: receivingIncome.currency || 'RUB',
          date: data.actualDate,
          description: receivingIncome.notes || undefined,
          accountId: data.accountId,
        },
        plannedIncomeId: receivingIncome.id,
      })
      setReceiveIncomeDialogOpen(false)
      setReceivingIncome(null)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Calendar className="h-6 w-6 text-primary" />
            Запланированные платежи
          </h1>
          <p className="mt-1 text-muted-foreground">
            Управление запланированными расходами и доходами
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              <span className="text-sm hidden sm:inline">Список</span>
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
              <span className="text-sm hidden sm:inline">Календарь</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Навигация по месяцам и статистика */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Выбор месяца */}
        <Card className="flex-shrink-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[140px]">
                <p className="text-lg font-semibold capitalize">{currentMonthLabel}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Статистика */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Receipt className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ожидает расходов</p>
                  <p className="text-lg font-semibold text-orange-500 tabular-nums">
                    {stats.pendingExpensesCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Banknote className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ожидает доходов</p>
                  <p className="text-lg font-semibold text-emerald-500 tabular-nums">
                    {stats.pendingIncomesCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Receipt className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">К оплате</p>
                  <p className="text-sm font-semibold text-orange-500 tabular-nums">
                    {formatMoney(stats.totalPendingExpenses)} ₽
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Banknote className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ожидается</p>
                  <p className="text-sm font-semibold text-emerald-500 tabular-nums">
                    {formatMoney(stats.totalPendingIncomes)} ₽
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Действия */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGeneratePlanned}
          disabled={generatePlanned.isPending || createBudget.isPending}
        >
          <RefreshCw
            className={cn(
              'h-4 w-4 mr-2',
              (generatePlanned.isPending || createBudget.isPending) && 'animate-spin'
            )}
          />
          Сгенерировать из шаблонов
        </Button>
        {/* Кнопка добавления расхода находится внутри AddPlannedExpenseDialog */}
        {budgetId && (
          <AddPlannedExpenseDialog
            budgetId={budgetId}
            year={year}
            month={month}
            categories={categories}
            funds={fundsRaw}
            onAdd={handleAddPlannedExpense}
            isPending={createPlanned.isPending}
          />
        )}
      </div>

      {/* Основной контент */}
      {viewMode === 'list' ? (
        <div className="space-y-6">
          {/* Доходы */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-base">Запланированные доходы</CardTitle>
                {stats.pendingIncomesCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {stats.pendingIncomesCount} ожидают
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <PlannedIncomesSection
                incomes={plannedIncomes}
                onReceive={handleReceiveIncome}
                onSkip={handleSkipIncome}
                isPending={skipPlannedIncome.isPending || createIncomeAndReceive.isPending}
                onIncomeClick={(incomeId) => navigate(`/incomes/${incomeId}`)}
                onPlannedIncomeClick={(plannedIncomeId) => navigate(`/planned-incomes/${plannedIncomeId}`)}
                hideWrapper
              />
            </CardContent>
          </Card>

          {/* Расходы */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-base">Запланированные расходы</CardTitle>
                {stats.pendingExpensesCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {stats.pendingExpensesCount} ожидают
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <PlannedExpensesSection
                expenses={plannedExpenses}
                accounts={accounts}
                categories={categories}
                onConfirm={handleConfirmPlanned}
                onSkip={handleSkipPlanned}
                onDelete={handleDeletePlanned}
                onGenerate={handleGeneratePlanned}
                isGenerating={generatePlanned.isPending || createBudget.isPending}
                isPending={confirmPlannedWithExpense.isPending || skipPlanned.isPending || deletePlanned.isPending}
                hideWrapper
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <PaymentCalendar
              expenses={plannedExpenses}
              incomes={plannedIncomes}
              year={year}
              month={month}
            />
          </CardContent>
        </Card>
      )}

      {/* Диалоги */}
      <ReceiveIncomeDialog
        open={receiveIncomeDialogOpen}
        onOpenChange={setReceiveIncomeDialogOpen}
        income={receivingIncome}
        onSubmit={handleConfirmReceiveIncome}
        isPending={createIncomeAndReceive.isPending}
      />

      {/* Плавающее уведомление о просроченных платежах */}
      <AnimatePresence>
        {stats.overdueCount > 0 && !overdueAlertDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-red-500 text-sm">
                  Просроченные платежи: {stats.overdueCount}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Требуют внимания
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={() => setOverdueAlertDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
