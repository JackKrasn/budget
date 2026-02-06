"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Tag,
} from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns"
import { ru } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useExpenses, useExpenseTags } from "@/features/expenses"
import { CategoryIcon } from "@/components/common"
import { useCurrentBudget } from "@/features/budget"
import {
  ExpenseCategoryChart,
  ExpenseTagChart,
  ExpenseTrendChart,
  ExpenseOverviewChart,
  TagStatisticsView,
} from "@/features/analytics"

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const MONTH_NAMES: Record<string, string> = {
  "01": "Январь",
  "02": "Февраль",
  "03": "Март",
  "04": "Апрель",
  "05": "Май",
  "06": "Июнь",
  "07": "Июль",
  "08": "Август",
  "09": "Сентябрь",
  "10": "Октябрь",
  "11": "Ноябрь",
  "12": "Декабрь",
}

type ViewMode = "overview" | "categories" | "tags" | "trends"

export default function AnalyticsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("overview")
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [showTagStatistics, setShowTagStatistics] = useState(false)

  // Current month for main charts
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const dateRange = useMemo(() => ({
    from: startOfMonth(currentDate),
    to: endOfMonth(currentDate),
  }), [currentDate])

  // For trend chart - last 6 months
  const trendRange = useMemo(() => ({
    from: startOfMonth(subMonths(currentDate, 5)),
    to: endOfMonth(currentDate),
  }), [currentDate])

  const handlePrevMonth = () => setCurrentDate((d) => subMonths(d, 1))
  const handleNextMonth = () => setCurrentDate((d) => addMonths(d, 1))
  const handleToday = () => setCurrentDate(new Date())

  // Fetch data
  const {
    data: expensesData,
    isLoading: isExpensesLoading,
    error: expensesError,
  } = useExpenses({
    from: format(dateRange.from, "yyyy-MM-dd"),
    to: format(dateRange.to, "yyyy-MM-dd"),
  })

  // Fetch 6 months of data for trends
  const { data: trendExpensesData, isLoading: isTrendLoading } = useExpenses({
    from: format(trendRange.from, "yyyy-MM-dd"),
    to: format(trendRange.to, "yyyy-MM-dd"),
  })

  const { data: currentBudget } = useCurrentBudget()
  const { data: tagsData } = useExpenseTags()
  const tags = tagsData?.data ?? []
  const selectedTag = selectedTagId ? tags.find((t) => t.id === selectedTagId) : null

  const expenses = expensesData?.data ?? []
  const trendExpenses = trendExpensesData?.data ?? []
  const totalPlanned = currentBudget?.total_planned ?? 0
  const totalActual = expensesData?.summary?.totalAmount ?? 0

  // Расходы с выбранным тегом
  const filteredExpenses = useMemo(() => {
    if (!selectedTagId) return []
    return expenses.filter((expense) =>
      expense.tags?.some((tag) => tag.id === selectedTagId)
    )
  }, [expenses, selectedTagId])

  // Группировка отфильтрованных расходов по дате
  const expensesByDate = useMemo(() => {
    const groups: Record<string, typeof filteredExpenses> = {}
    filteredExpenses.forEach((expense) => {
      const dateKey = expense.date.split("T")[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(expense)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredExpenses])

  // Общая сумма отфильтрованных расходов
  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  }, [filteredExpenses])

  // Prepare category chart data
  const categoryChartData = useMemo(() => {
    const byCategory: Record<string, { amount: number; name: string; color: string }> = {}

    expenses.forEach((expense) => {
      if (!byCategory[expense.categoryId]) {
        byCategory[expense.categoryId] = {
          amount: 0,
          name: expense.categoryName,
          color: expense.categoryColor,
        }
      }
      byCategory[expense.categoryId].amount += expense.amount
    })

    return Object.entries(byCategory).map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      categoryColor: data.color,
      amount: data.amount,
    }))
  }, [expenses])

  // Prepare tag chart data
  const tagChartData = useMemo(() => {
    const byTag: Record<string, { amount: number; name: string; color: string; count: number }> = {}

    expenses.forEach((expense) => {
      if (expense.tags && expense.tags.length > 0) {
        expense.tags.forEach((tag) => {
          if (!byTag[tag.id]) {
            byTag[tag.id] = {
              amount: 0,
              name: tag.name,
              color: tag.color,
              count: 0,
            }
          }
          byTag[tag.id].amount += expense.amount
          byTag[tag.id].count += 1
        })
      }
    })

    return Object.entries(byTag).map(([id, data]) => ({
      tagId: id,
      tagName: data.name,
      tagColor: data.color,
      totalAmount: data.amount,
      expenseCount: data.count,
    }))
  }, [expenses])

  // Prepare trend data (monthly aggregation)
  const trendChartData = useMemo(() => {
    const byMonth: Record<string, { actual: number; planned: number }> = {}

    trendExpenses.forEach((expense) => {
      const monthKey = expense.date.substring(0, 7) // YYYY-MM
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { actual: 0, planned: 0 }
      }
      byMonth[monthKey].actual += expense.amount
    })

    // Sort by month and create array
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split("-")
        return {
          month,
          year: parseInt(year),
          monthName: MONTH_NAMES[month] || month,
          actual: data.actual,
          planned: data.planned, // TODO: fetch planned from budgets
        }
      })
  }, [trendExpenses])

  // Prepare daily overview data
  const overviewChartData = useMemo(() => {
    const byDate: Record<string, number> = {}

    // Initialize all days in range
    const start = dateRange.from
    const end = dateRange.to
    const current = new Date(start)
    while (current <= end) {
      byDate[format(current, "yyyy-MM-dd")] = 0
      current.setDate(current.getDate() + 1)
    }

    // Aggregate expenses by date
    expenses.forEach((expense) => {
      const dateKey = expense.date.split("T")[0]
      if (byDate[dateKey] !== undefined) {
        byDate[dateKey] += expense.amount
      }
    })

    // Convert to array with cumulative
    let cumulative = 0
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => {
        cumulative += amount
        const d = new Date(date)
        return {
          date,
          dateLabel: format(d, "d MMM", { locale: ru }),
          amount,
          cumulative,
        }
      })
  }, [expenses, dateRange])

  const isLoading = isExpensesLoading || isTrendLoading
  const error = expensesError

  const currentMonthLabel = format(currentDate, "LLLL yyyy", { locale: ru })
  const isCurrentMonth =
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Аналитика
          </h1>
          <p className="mt-1 text-muted-foreground">
            Визуализация расходов и трендов
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleToday}
            disabled={isCurrentMonth}
            className="min-w-[160px] capitalize"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {currentMonthLabel}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего расходов</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(totalActual)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                <BarChart3 className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">План на месяц</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(totalPlanned)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <BarChart3 className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Категорий</p>
                <p className="text-xl font-bold tabular-nums">
                  {categoryChartData.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <BarChart3 className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Операций</p>
                <p className="text-xl font-bold tabular-nums">
                  {expenses.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* View Mode Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Tabs
          value={viewMode}
          onValueChange={(v) => {
            setViewMode(v as ViewMode)
            setSelectedTagId(null)
            setShowTagStatistics(false)
          }}
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="categories">Категории</TabsTrigger>
            <TabsTrigger value="tags">Метки</TabsTrigger>
            <TabsTrigger value="trends">Тренды</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex h-[400px] flex-col items-center justify-center gap-2 text-center">
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

      {/* Charts Content */}
      {!isLoading && !error && (
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {viewMode === "overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Cumulative chart - full width on top */}
              <div className="lg:col-span-2">
                <ExpenseOverviewChart
                  data={overviewChartData}
                  budgetLimit={totalPlanned > 0 ? totalPlanned : undefined}
                  title="Расходы за месяц"
                  description={`Накопительный график расходов за ${currentMonthLabel}`}
                />
              </div>

              {/* Category and Tag charts side by side */}
              <ExpenseCategoryChart
                data={categoryChartData}
                title="По категориям"
                description="Распределение расходов"
              />
              <ExpenseTagChart
                data={tagChartData}
                title="По меткам"
                description="Расходы с метками"
              />
            </div>
          )}

          {viewMode === "categories" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <ExpenseCategoryChart
                  data={categoryChartData}
                  title="Расходы по категориям"
                  description={`Распределение расходов за ${currentMonthLabel}`}
                />
              </div>
            </div>
          )}

          {viewMode === "tags" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {selectedTagId && selectedTag && showTagStatistics ? (
                /* Режим статистики по тегу */
                <div className="lg:col-span-2 space-y-4">
                  <TagStatisticsView
                    tagId={selectedTagId}
                    tagName={selectedTag.name}
                    tagColor={selectedTag.color}
                    from={format(dateRange.from, "yyyy-MM-dd")}
                    to={format(dateRange.to, "yyyy-MM-dd")}
                    onBack={() => {
                      setShowTagStatistics(false)
                    }}
                    onTagClick={(id) => {
                      setSelectedTagId(id)
                      setShowTagStatistics(false)
                    }}
                  />
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowTagStatistics(false)}
                    >
                      Показать все расходы с этой меткой
                    </Button>
                  </div>
                </div>
              ) : selectedTagId && selectedTag ? (
                /* Режим списка расходов с тегом */
                <div className="lg:col-span-2">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTagId(null)
                            setShowTagStatistics(false)
                          }}
                          className="shrink-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Badge
                              variant="outline"
                              className="gap-1.5 px-2.5 py-1"
                              style={{
                                borderColor: selectedTag.color,
                                backgroundColor: `${selectedTag.color}15`,
                              }}
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: selectedTag.color }}
                              />
                              {selectedTag.name}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {filteredExpenses.length} операций на сумму {formatMoney(filteredTotal)} ₽
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Кнопка группировки */}
                      {filteredExpenses.length > 0 && (
                        <div className="flex justify-center mb-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowTagStatistics(true)}
                            className="gap-2"
                          >
                            <PieChart className="h-4 w-4" />
                            Группировать по метке «{selectedTag.name}»
                          </Button>
                        </div>
                      )}

                      {/* Список расходов */}
                      {expensesByDate.length > 0 ? (
                        <div className="space-y-4">
                          {expensesByDate.map(([date, dateExpenses]) => (
                            <div key={date}>
                              <div className="text-sm font-medium text-muted-foreground mb-2">
                                {new Date(date).toLocaleDateString("ru-RU", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "long",
                                })}
                              </div>
                              <div className="space-y-1">
                                {dateExpenses.map((expense) => (
                                  <div
                                    key={expense.id}
                                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/30 text-sm"
                                  >
                                    <div className="flex items-center gap-3">
                                      <CategoryIcon
                                        code={expense.categoryCode}
                                        color={expense.categoryColor}
                                        size="sm"
                                      />
                                      <div>
                                        <p className="font-medium">
                                          {expense.description || expense.categoryName}
                                        </p>
                                        {expense.tags && expense.tags.length > 1 && (
                                          <div className="flex gap-1 mt-0.5">
                                            {expense.tags
                                              .filter((t) => t.id !== selectedTagId)
                                              .map((tag) => (
                                                <Badge
                                                  key={tag.id}
                                                  variant="outline"
                                                  className="text-[10px] px-1.5 py-0"
                                                  style={{
                                                    borderColor: tag.color,
                                                    color: tag.color,
                                                  }}
                                                >
                                                  {tag.name}
                                                </Badge>
                                              ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-medium tabular-nums">
                                      {formatMoney(expense.amount)} ₽
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Нет расходов с этой меткой</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="lg:col-span-2">
                  <ExpenseTagChart
                    data={tagChartData}
                    title="Расходы по меткам"
                    description={`Распределение расходов с метками за ${currentMonthLabel}. Нажмите на метку для детализации.`}
                    onTagClick={(id) => {
                      setSelectedTagId(id)
                      setShowTagStatistics(false)
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {viewMode === "trends" && (
            <div className="grid gap-6">
              <ExpenseTrendChart
                data={trendChartData}
                title="Динамика расходов"
                description="Сравнение расходов по месяцам за последние 6 месяцев"
              />

              {/* Monthly comparison table */}
              {trendChartData.length > 0 && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="mb-4 font-semibold">Детализация по месяцам</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                              Месяц
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                              Расходы
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                              Изменение
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendChartData.map((item, index) => {
                            const prev = index > 0 ? trendChartData[index - 1].actual : item.actual
                            const change = prev > 0 ? ((item.actual - prev) / prev) * 100 : 0
                            return (
                              <tr
                                key={`${item.year}-${item.month}`}
                                className="border-b border-border/30"
                              >
                                <td className="py-3 font-medium">
                                  {item.monthName} {item.year}
                                </td>
                                <td className="py-3 text-right font-mono tabular-nums">
                                  {formatMoney(item.actual)} ₽
                                </td>
                                <td className="py-3 text-right">
                                  {index > 0 && (
                                    <span
                                      className={
                                        change > 0
                                          ? "text-destructive"
                                          : change < 0
                                          ? "text-chart-1"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {change > 0 ? "+" : ""}
                                      {change.toFixed(1)}%
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
