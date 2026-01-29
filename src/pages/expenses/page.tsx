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
  ChevronLeft,
  Target,
  ArrowLeftRight,
  Tag as TagIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  useExpenses,
  useExpenseCategories,
  useExpenseTags,
  useDeleteExpense,
  ExpenseRow,
  CreateExpenseDialog,
  EditExpenseDialog,
  CategoryGrid,
  TagGrid,
  type CategorySummary,
  type TagSummary,
} from '@/features/expenses'
import { useFunds } from '@/features/funds'
import { ExpenseCategoryChart, ExpenseTagChart } from '@/features/analytics'
import type { ExpenseListRow, BudgetItemWithCategory } from '@/lib/api/types'
import { useBudgetByMonth } from '@/features/budget'
import {
  useAccounts,
  TransferDialog,
} from '@/features/accounts'
import { DateRangePicker, DayHeader, groupExpensesByCurrency, ExpensesToolbar, FloatingAddButton, type ExpenseViewMode } from '@/components/common'
import { CURRENCY_SYMBOLS } from '@/types'

function formatMoney(amount: number | undefined | null): string {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}


const SELECTED_ACCOUNT_KEY = 'budget-selected-account-id'

export default function ExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get('category')
  const tagFromUrl = searchParams.get('tag')
  const fundFromUrl = searchParams.get('fund')

  const [viewMode, setViewMode] = useState<ExpenseViewMode>(
    categoryFromUrl || tagFromUrl || fundFromUrl ? 'list' : 'categories'
  )
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [expenseDefaultDate, setExpenseDefaultDate] = useState<string | undefined>(undefined)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categoryFromUrl
  )
  const [selectedTagId, setSelectedTagId] = useState<string | null>(tagFromUrl)
  const [selectedFundId, setSelectedFundId] = useState<string | null>(fundFromUrl)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem(SELECTED_ACCOUNT_KEY)
    return saved || null
  })
  const [editingExpense, setEditingExpense] = useState<ExpenseListRow | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Синхронизация URL с фильтрами
  useEffect(() => {
    const params: Record<string, string> = {}
    if (selectedCategoryId) {
      params.category = selectedCategoryId
    }
    if (selectedTagId) {
      params.tag = selectedTagId
    }
    if (selectedFundId) {
      params.fund = selectedFundId
    }
    setSearchParams(params)
  }, [selectedCategoryId, selectedTagId, selectedFundId, setSearchParams])

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
    tagId: selectedTagId || undefined,
    fundId: selectedFundId || undefined,
  })
  const { data: categoriesData } = useExpenseCategories()
  const { data: tagsData } = useExpenseTags()
  const { data: accountsData } = useAccounts()
  const { data: fundsData } = useFunds()
  // Используем бюджет для выбранного месяца (из dateRange)
  const budgetYear = dateRange.from.getFullYear()
  const budgetMonth = dateRange.from.getMonth() + 1
  const { data: currentBudget, isLoading: isBudgetLoading } = useBudgetByMonth(budgetYear, budgetMonth)
  const deleteExpense = useDeleteExpense()

  const expenses = expensesData?.data ?? []
  const summary = expensesData?.summary
  const categories = categoriesData?.data ?? []
  const tags = tagsData?.data ?? []
  const accounts = accountsData?.data ?? []
  const funds = fundsData?.data ?? []
  const budgetItems: BudgetItemWithCategory[] = currentBudget?.items ?? []

  // Calculate total expenses by currency
  const expenseTotalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {}
    let totalInBase = 0

    expenses.forEach((expense) => {
      const currency = expense.currency || 'RUB'
      totals[currency] = (totals[currency] || 0) + expense.amount
      // Суммируем в базовой валюте
      totalInBase += expense.amountBase ?? expense.amount
    })

    return { totals, totalInBase }
  }, [expenses])

  // Получить выбранный фонд для заголовка
  const selectedFund = selectedFundId
    ? funds.find((f) => f.fund.id === selectedFundId)
    : null

  // Aggregate expenses by category and merge with budget data
  const categorySummaries = useMemo<CategorySummary[]>(() => {
    // Create a map of category expenses (используем amount_base для конвертации в рубли)
    const expensesByCategory: Record<string, number> = {}
    // Also track expenses by category AND currency
    const expensesByCategoryCurrency: Record<string, Record<string, number>> = {}

    expenses.forEach((expense) => {
      const currency = expense.currency || 'RUB'
      // Total in base currency
      expensesByCategory[expense.categoryId] =
        (expensesByCategory[expense.categoryId] || 0) + (expense.amountBase ?? expense.amount)
      // By currency
      if (!expensesByCategoryCurrency[expense.categoryId]) {
        expensesByCategoryCurrency[expense.categoryId] = {}
      }
      expensesByCategoryCurrency[expense.categoryId][currency] =
        (expensesByCategoryCurrency[expense.categoryId][currency] || 0) + expense.amount
    })

    // Create summaries from budget items first
    const summariesMap: Record<string, CategorySummary> = {}

    // Add budget items
    budgetItems.forEach((item) => {
      // Build currency limits from budget item
      const currencyLimits = item.currencyLimits?.map((cl) => ({
        currency: cl.currency,
        totalLimit: cl.totalLimit,
        actualAmount: expensesByCategoryCurrency[item.categoryId]?.[cl.currency] || 0,
        remaining: cl.totalLimit - (expensesByCategoryCurrency[item.categoryId]?.[cl.currency] || 0),
      })) || []

      summariesMap[item.categoryId] = {
        categoryId: item.categoryId,
        categoryCode: item.categoryCode,
        categoryName: item.categoryName,
        categoryIcon: item.categoryIcon,
        categoryColor: item.categoryColor,
        actualAmount: expensesByCategory[item.categoryId] || 0,
        totalLimit: item.totalLimit,
        plannedExpensesSum: item.plannedExpensesSum,
        currencyLimits: currencyLimits.length > 0 ? currencyLimits : undefined,
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
          totalLimit: 0,
        }
      }
    })

    return Object.values(summariesMap)
  }, [expenses, budgetItems, categories])

  // Aggregate expenses by tag
  const tagSummaries = useMemo<TagSummary[]>(() => {
    const summariesMap: Record<string, TagSummary> = {}

    expenses.forEach((expense) => {
      if (expense.tags && expense.tags.length > 0) {
        expense.tags.forEach((tag) => {
          if (!summariesMap[tag.id]) {
            summariesMap[tag.id] = {
              tagId: tag.id,
              tagName: tag.name,
              tagColor: tag.color,
              totalAmount: 0,
              expenseCount: 0,
            }
          }
          // Используем amount_base для конвертации в рубли
          summariesMap[tag.id].totalAmount += expense.amountBase ?? expense.amount
          summariesMap[tag.id].expenseCount += 1
        })
      }
    })

    return Object.values(summariesMap)
  }, [expenses])

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

  // Добавить расход на конкретный день
  const handleAddExpenseOnDay = (date: string) => {
    setExpenseDefaultDate(date)
    setCreateDialogOpen(true)
  }

  // Открыть диалог без предустановленной даты
  const handleAddExpense = () => {
    setExpenseDefaultDate(undefined)
    setCreateDialogOpen(true)
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setSelectedTagId(null)
    setViewMode('list')
  }

  const handleTagClick = (tagId: string) => {
    setSelectedTagId(tagId)
    setSelectedCategoryId(null)
    setViewMode('list')
  }

  const handleBackToCategories = () => {
    setSelectedCategoryId(null)
    setSelectedTagId(null)
    setViewMode('categories')
  }

  const handleBackToTags = () => {
    setSelectedTagId(null)
    setSelectedCategoryId(null)
    setViewMode('tags')
  }

  // Получить название выбранной категории/тега для заголовка
  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null
  const selectedTag = selectedTagId
    ? tags.find((t) => t.id === selectedTagId)
    : null

  // Calculate total planned and progress
  // При выборе категории показываем план для этой категории
  const selectedBudgetItem = selectedCategoryId
    ? budgetItems.find((item) => item.categoryId === selectedCategoryId)
    : null
  const totalPlanned = selectedCategoryId
    ? (selectedBudgetItem?.totalLimit ?? 0)
    : (currentBudget?.total_planned ?? 0)
  // Use locally calculated total to ensure currency conversions are correct
  const totalActual = expenseTotalsByCurrency.totalInBase
  const totalProgress =
    totalPlanned > 0 ? Math.min((totalActual / totalPlanned) * 100, 100) : 0

  // Calculate budget totals by currency (for multi-currency progress bars)
  const budgetByCurrency = useMemo(() => {
    const result: Record<string, { planned: number; actual: number }> = {}

    // If category is selected, use its currency limits
    if (selectedCategoryId && selectedBudgetItem?.currencyLimits) {
      selectedBudgetItem.currencyLimits.forEach((cl) => {
        if (cl.totalLimit > 0 || cl.actualAmount > 0) {
          result[cl.currency] = {
            planned: cl.totalLimit,
            actual: expenseTotalsByCurrency.totals[cl.currency] || 0,
          }
        }
      })
    } else {
      // Aggregate all budget items' currency limits
      budgetItems.forEach((item) => {
        item.currencyLimits?.forEach((cl) => {
          if (!result[cl.currency]) {
            result[cl.currency] = { planned: 0, actual: 0 }
          }
          result[cl.currency].planned += cl.totalLimit
        })
      })
      // Add actual expenses by currency
      Object.entries(expenseTotalsByCurrency.totals).forEach(([currency, amount]) => {
        if (!result[currency]) {
          result[currency] = { planned: 0, actual: 0 }
        }
        result[currency].actual = amount
      })
    }

    return result
  }, [selectedCategoryId, selectedBudgetItem, budgetItems, expenseTotalsByCurrency])

  // Check if we have multi-currency budget
  const hasMultiCurrencyBudget = Object.keys(budgetByCurrency).filter(
    (c) => budgetByCurrency[c].planned > 0 || budgetByCurrency[c].actual > 0
  ).length > 1

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

  // Calculate today's expenses total
  const todayTotal = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayExpenses = expenses.filter((e) => e.date.split('T')[0] === today)

    const totals: Record<string, number> = {}
    let totalInBase = 0

    todayExpenses.forEach((expense) => {
      const currency = expense.currency || 'RUB'
      totals[currency] = (totals[currency] || 0) + expense.amount
      totalInBase += expense.amountBase ?? expense.amount
    })

    return { totals, totalInBase, count: todayExpenses.length }
  }, [expenses])

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
          {(selectedCategoryId || selectedTagId || selectedFundId) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (selectedTagId) {
                  handleBackToTags()
                } else if (selectedFundId) {
                  setSelectedFundId(null)
                  setViewMode('categories')
                } else {
                  handleBackToCategories()
                }
              }}
              className="shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {selectedCategory
                ? selectedCategory.name
                : selectedTag
                  ? selectedTag.name
                  : selectedFund
                    ? `Из фонда: ${selectedFund.fund.name}`
                    : 'Расходы'}
            </h1>
            <p className="mt-1 text-muted-foreground capitalize">
              {currentMonthName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Today's total */}
          {todayTotal.count > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Сегодня</p>
              <div className="flex items-baseline gap-1">
                {Object.keys(todayTotal.totals).length > 1 ? (
                  <div className="flex flex-col items-end">
                    {Object.entries(todayTotal.totals)
                      .sort(([a], [b]) => (a === 'RUB' ? -1 : b === 'RUB' ? 1 : a.localeCompare(b)))
                      .map(([currency, amount]) => {
                        const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency
                        return (
                          <span key={currency} className="text-sm font-semibold tabular-nums">
                            {formatMoney(amount)} {symbol}
                          </span>
                        )
                      })}
                  </div>
                ) : (
                  <span className="text-lg font-semibold tabular-nums text-destructive">
                    {formatMoney(todayTotal.totalInBase)} ₽
                  </span>
                )}
              </div>
            </div>
          )}
          <TransferDialog>
            <Button variant="outline" size="sm">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Перевод
            </Button>
          </TransferDialog>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* Total Expenses */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Потрачено</p>
                {/* Show separate amounts per currency */}
                {Object.keys(expenseTotalsByCurrency.totals).length > 1 ? (
                  <div className="space-y-1 mt-1">
                    {Object.entries(expenseTotalsByCurrency.totals)
                      .sort(([a], [b]) => (a === 'RUB' ? -1 : b === 'RUB' ? 1 : a.localeCompare(b)))
                      .map(([currency, amount]) => {
                        const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency
                        const isRub = currency === 'RUB'
                        return (
                          <div key={currency} className="flex items-baseline gap-1.5">
                            <span className={`font-bold tabular-nums ${isRub ? 'text-xl' : 'text-lg text-muted-foreground'}`}>
                              {formatMoney(amount)}
                            </span>
                            <span className={`text-sm ${isRub ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                              {symbol}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-xl font-bold tabular-nums">
                    {formatMoney(expenseTotalsByCurrency.totalInBase)} ₽
                  </p>
                )}
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

      </motion.div>

      {/* Progress Bar */}
      {(totalPlanned > 0 || hasMultiCurrencyBudget) && !isBudgetLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Исполнение бюджета</span>
                {!hasMultiCurrencyBudget && (
                  <span className="text-sm text-muted-foreground">
                    {Math.round(totalProgress)}%
                  </span>
                )}
              </div>

              {/* Multi-currency progress bars */}
              {hasMultiCurrencyBudget ? (
                <div className="space-y-4">
                  {Object.entries(budgetByCurrency)
                    .filter(([, data]) => data.planned > 0 || data.actual > 0)
                    .map(([currency, data]) => {
                      const currProgress = data.planned > 0
                        ? Math.min((data.actual / data.planned) * 100, 100)
                        : 0
                      const isOver = data.actual > data.planned && data.planned > 0
                      const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency

                      return (
                        <div key={currency} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{currency}</span>
                            <span className="text-muted-foreground">
                              {data.planned > 0 ? `${Math.round(currProgress)}%` : 'без лимита'}
                            </span>
                          </div>
                          {data.planned > 0 ? (
                            <Progress
                              value={currProgress}
                              className={`h-2 ${isOver ? '[&>div]:bg-destructive' : ''}`}
                            />
                          ) : (
                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500/50 rounded-full" style={{ width: '100%' }} />
                            </div>
                          )}
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>{symbol}{formatMoney(data.actual)} потрачено</span>
                            {data.planned > 0 ? (
                              <span className={isOver ? 'text-destructive font-medium' : ''}>
                                {isOver
                                  ? `Перерасход: ${symbol}${formatMoney(data.actual - data.planned)}`
                                  : `Осталось: ${symbol}${formatMoney(data.planned - data.actual)}`}
                              </span>
                            ) : (
                              <span className="text-amber-600">лимит не установлен</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                /* Single currency progress bar */
                <>
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
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Toolbar with View Mode & Filters */}
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

        {/* Unified Toolbar */}
        <ExpensesToolbar
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode)
            if (mode === 'categories' || mode === 'tags') {
              setSelectedCategoryId(null)
              setSelectedTagId(null)
            }
          }}
          categories={categories}
          tags={tags}
          accounts={accounts}
          funds={funds}
          selectedCategoryId={selectedCategoryId}
          selectedTagId={selectedTagId}
          selectedAccountId={selectedAccountId}
          selectedFundId={selectedFundId}
          onCategoryChange={(id) => {
            setSelectedCategoryId(id)
            setSelectedTagId(null)
            if (id) {
              setViewMode('list')
            }
          }}
          onTagChange={(id) => {
            setSelectedTagId(id)
            setSelectedCategoryId(null)
            if (id) {
              setViewMode('list')
            }
          }}
          onAccountChange={setSelectedAccountId}
          onFundChange={(id) => {
            setSelectedFundId(id)
            if (id) {
              setViewMode('list')
            }
          }}
        />
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
              className="space-y-6"
            >
              {categorySummaries.length > 0 ? (
                <>
                  {/* Pie Chart */}
                  <ExpenseCategoryChart
                    data={categorySummaries.map(c => ({
                      categoryId: c.categoryId,
                      categoryName: c.categoryName,
                      categoryColor: c.categoryColor,
                      amount: c.actualAmount,
                    }))}
                    title="Распределение расходов"
                    description="Нажмите на категорию для просмотра деталей"
                    onCategoryClick={handleCategoryClick}
                  />

                  {/* Category Grid */}
                  <CategoryGrid
                    categories={categorySummaries}
                    onCategoryClick={handleCategoryClick}
                  />
                </>
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
          ) : viewMode === 'tags' ? (
            <motion.div
              key="tags"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {tagSummaries.length > 0 ? (
                <>
                  {/* Pie Chart */}
                  <ExpenseTagChart
                    data={tagSummaries.map(t => ({
                      tagId: t.tagId,
                      tagName: t.tagName,
                      tagColor: t.tagColor,
                      totalAmount: t.totalAmount,
                      expenseCount: t.expenseCount,
                    }))}
                    title="Распределение по меткам"
                    description="Нажмите на метку для просмотра деталей"
                    onTagClick={handleTagClick}
                  />

                  {/* Tag Grid */}
                  <TagGrid
                    tags={tagSummaries}
                    onTagClick={handleTagClick}
                  />
                </>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30">
                  <TagIcon className="h-12 w-12 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="font-medium">Нет меток</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Расходы с метками не найдены
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
          ) : viewMode === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {expensesByDate.length > 0 ? (
                expensesByDate.map(([date, dateExpenses]) => {
                  const expensesByCurrency = groupExpensesByCurrency(dateExpenses)
                  return (
                  <div key={date} className="space-y-3">
                    <DayHeader
                      date={date}
                      expensesByCurrency={expensesByCurrency}
                      onAddExpense={handleAddExpenseOnDay}
                    />
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {dateExpenses.map((expense) => {
                          const account = accounts.find(a => a.id === expense.accountId)
                          return (
                            <motion.div
                              key={expense.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.2 }}
                              layout
                            >
                              <ExpenseRow
                                expense={expense}
                                account={account ? {
                                  name: account.name,
                                  bankName: account.bank_name,
                                  typeCode: account.type_code,
                                  color: account.color,
                                } : undefined}
                                onEdit={() => handleEdit(expense)}
                                onDelete={() => handleDelete(expense.id)}
                              />
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
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
                        : selectedTagId
                          ? 'С этой меткой расходы не найдены'
                          : selectedFundId
                            ? 'Расходы из этого фонда не найдены'
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
          ) : null}
        </AnimatePresence>
      )}

      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        expense={editingExpense}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Create Expense Dialog (controlled) */}
      <CreateExpenseDialog
        defaultAccountId={selectedAccountId || undefined}
        defaultValues={expenseDefaultDate ? { date: expenseDefaultDate } : undefined}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      >
        <span />
      </CreateExpenseDialog>

      {/* Floating Add Button */}
      <FloatingAddButton onClick={handleAddExpense} />
    </div>
  )
}
