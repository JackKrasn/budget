import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Receipt,
  AlertCircle,
  Loader2,
  TrendingDown,
  Wallet,
  LayoutGrid,
  List,
  ChevronLeft,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  useExpenses,
  useExpenseCategories,
  useDeleteExpense,
  ExpenseRow,
  CreateExpenseDialog,
  EditExpenseDialog,
  AccountFilter,
  CategoryFilter,
  CategoryGrid,
  type CategorySummary,
} from '@/features/expenses'
import type { ExpenseListRow } from '@/lib/api/types'
import { useCurrentBudget } from '@/features/budget'
import { useAccounts } from '@/features/accounts'
import { DateRangePicker } from '@/components/common'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

const SELECTED_ACCOUNT_KEY = 'budget-selected-account-id'

export default function ExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get('category')

  const [viewMode, setViewMode] = useState<'categories' | 'list'>(
    categoryFromUrl ? 'list' : 'categories'
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categoryFromUrl
  )
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem(SELECTED_ACCOUNT_KEY)
    return saved || null
  })
  const [editingExpense, setEditingExpense] = useState<ExpenseListRow | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Синхронизация URL с фильтром категории
  useEffect(() => {
    if (selectedCategoryId) {
      setSearchParams({ category: selectedCategoryId })
    } else {
      setSearchParams({})
    }
  }, [selectedCategoryId, setSearchParams])

  // Save selected account to localStorage
  useEffect(() => {
    if (selectedAccountId) {
      localStorage.setItem(SELECTED_ACCOUNT_KEY, selectedAccountId)
    } else {
      localStorage.removeItem(SELECTED_ACCOUNT_KEY)
    }
  }, [selectedAccountId])

  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      from: firstDay,
      to: lastDay,
    }
  })

  const handleDateRangeChange = (from: Date, to: Date) => {
    setDateRange({ from, to })
  }

  const { data: expensesData, isLoading, error } = useExpenses({
    from: dateRange.from.toISOString().split('T')[0],
    to: dateRange.to.toISOString().split('T')[0],
    categoryId: selectedCategoryId || undefined,
    accountId: selectedAccountId || undefined,
  })
  const { data: categoriesData } = useExpenseCategories()
  const { data: accountsData } = useAccounts()
  const { data: currentBudget, isLoading: isBudgetLoading } = useCurrentBudget()
  const deleteExpense = useDeleteExpense()

  const expenses = expensesData?.data ?? []
  const summary = expensesData?.summary
  const categories = categoriesData?.data ?? []
  const accounts = accountsData?.data ?? []
  const budgetItems = currentBudget?.items ?? []

  // Aggregate expenses by category and merge with budget data
  const categorySummaries = useMemo<CategorySummary[]>(() => {
    // Create a map of category expenses
    const expensesByCategory: Record<string, number> = {}
    expenses.forEach((expense) => {
      expensesByCategory[expense.categoryId] =
        (expensesByCategory[expense.categoryId] || 0) + expense.amount
    })

    // Create summaries from budget items first
    const summariesMap: Record<string, CategorySummary> = {}

    // Add budget items
    budgetItems.forEach((item) => {
      summariesMap[item.categoryId] = {
        categoryId: item.categoryId,
        categoryCode: item.categoryCode,
        categoryName: item.categoryName,
        categoryIcon: item.categoryIcon,
        categoryColor: item.categoryColor,
        actualAmount: expensesByCategory[item.categoryId] || 0,
        plannedAmount: item.plannedAmount,
      }
    })

    // Add categories with expenses but no budget
    categories.forEach((cat) => {
      if (!summariesMap[cat.id] && expensesByCategory[cat.id]) {
        summariesMap[cat.id] = {
          categoryId: cat.id,
          categoryCode: cat.code,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          categoryColor: cat.color,
          actualAmount: expensesByCategory[cat.id],
          plannedAmount: 0,
        }
      }
    })

    return Object.values(summariesMap)
  }, [expenses, budgetItems, categories])

  // Group expenses by date for list view
  // Фильтрация уже применена в expenses через selectedCategoryIds
  const expensesByDate = useMemo(() => {
    const groups: Record<string, typeof expenses> = {}
    expenses.forEach((expense) => {
      const dateKey = expense.date.split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(expense)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [expenses])

  const handleEdit = (expense: ExpenseListRow) => {
    setEditingExpense(expense)
    setEditDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот расход?')) {
      deleteExpense.mutate(id)
    }
  }

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Сегодня'
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Вчера'
    }
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setViewMode('list')
  }

  const handleBackToCategories = () => {
    setSelectedCategoryId(null)
    setViewMode('categories')
  }

  // Получить название выбранной категории для заголовка
  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null

  // Calculate total planned and progress
  const totalPlanned = currentBudget?.total_planned ?? 0
  const totalActual = summary?.totalAmount ?? 0
  const totalProgress =
    totalPlanned > 0 ? Math.min((totalActual / totalPlanned) * 100, 100) : 0

  const currentMonthName = useMemo(() => {
    const isFullMonth =
      dateRange.from.getDate() === 1 &&
      dateRange.to.getMonth() === dateRange.from.getMonth() &&
      dateRange.to.getDate() ===
        new Date(dateRange.to.getFullYear(), dateRange.to.getMonth() + 1, 0).getDate()

    if (isFullMonth) {
      return dateRange.from.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
      })
    }

    const fromStr = dateRange.from.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    })
    const toStr = dateRange.to.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${fromStr} - ${toStr}`
  }, [dateRange])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          {selectedCategoryId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToCategories}
              className="shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {selectedCategory ? selectedCategory.name : 'Расходы'}
            </h1>
            <p className="mt-1 text-muted-foreground capitalize">
              {currentMonthName}
            </p>
          </div>
        </div>
        <CreateExpenseDialog defaultAccountId={selectedAccountId || undefined}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Добавить расход
          </Button>
        </CreateExpenseDialog>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Total Expenses */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Потрачено</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(totalActual)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planned */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                <Target className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">План</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(totalPlanned)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* From Funds */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Из фондов</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(summary?.totalFromFunds ?? 0)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records Count */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <Receipt className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Записей</p>
                <p className="text-xl font-bold tabular-nums">
                  {expenses.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Bar */}
      {totalPlanned > 0 && !isBudgetLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Исполнение бюджета</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(totalProgress)}%
                </span>
              </div>
              <Progress
                value={totalProgress}
                className={`h-3 ${
                  totalActual > totalPlanned ? '[&>div]:bg-destructive' : ''
                }`}
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{formatMoney(totalActual)} ₽ потрачено</span>
                <span>
                  {totalActual > totalPlanned
                    ? `Перерасход: ${formatMoney(totalActual - totalPlanned)} ₽`
                    : `Осталось: ${formatMoney(totalPlanned - totalActual)} ₽`}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters & View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {/* Date Range Picker */}
        <DateRangePicker
          from={dateRange.from}
          to={dateRange.to}
          onRangeChange={handleDateRangeChange}
        />

        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          {categories.length > 0 && (
            <CategoryFilter
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={(id) => {
                setSelectedCategoryId(id)
                if (id) {
                  setViewMode('list')
                }
              }}
            />
          )}

          {/* Account Filter */}
          {accounts.length > 0 && (
            <AccountFilter
              accounts={accounts}
              selectedId={selectedAccountId}
              onSelect={setSelectedAccountId}
            />
          )}

          <div className="flex-1" />

          {/* View Mode */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => {
              setViewMode(v as 'categories' | 'list')
              if (v === 'categories') {
                setSelectedCategoryId(null)
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="categories" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Категории</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Список</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Loading State */}
      {(isLoading || isBudgetLoading) && (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Ошибка загрузки: {error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !isBudgetLoading && !error && (
        <AnimatePresence mode="wait">
          {viewMode === 'categories' ? (
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {categorySummaries.length > 0 ? (
                <CategoryGrid
                  categories={categorySummaries}
                  onCategoryClick={handleCategoryClick}
                />
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30">
                  <Receipt className="h-12 w-12 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="font-medium">Нет расходов</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      За этот месяц расходы не найдены
                    </p>
                  </div>
                  <CreateExpenseDialog defaultAccountId={selectedAccountId || undefined}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить расход
                    </Button>
                  </CreateExpenseDialog>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {expensesByDate.length > 0 ? (
                expensesByDate.map(([date, dateExpenses]) => {
                  const dayTotal = dateExpenses.reduce((sum, e) => sum + e.amount, 0)
                  return (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground capitalize">
                        {formatDateHeader(date)}
                      </h3>
                      <span className="text-sm font-semibold tabular-nums text-destructive">
                        -{formatMoney(dayTotal)} ₽
                      </span>
                    </div>
                    <motion.div
                      className="space-y-2"
                      variants={container}
                      initial="hidden"
                      animate="show"
                    >
                      {dateExpenses.map((expense) => (
                        <motion.div key={expense.id} variants={item}>
                          <ExpenseRow
                            expense={expense}
                            onEdit={() => handleEdit(expense)}
                            onDelete={() => handleDelete(expense.id)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                  )
                })
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30">
                  <Receipt className="h-12 w-12 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="font-medium">Нет расходов</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedCategoryId
                        ? 'В этой категории расходы не найдены'
                        : 'За этот месяц расходы не найдены'}
                    </p>
                  </div>
                  <CreateExpenseDialog defaultAccountId={selectedAccountId || undefined}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить расход
                    </Button>
                  </CreateExpenseDialog>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        expense={editingExpense}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  )
}
