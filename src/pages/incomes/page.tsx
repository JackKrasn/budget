import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Banknote,
  AlertCircle,
  Loader2,
  TrendingUp,
  Calendar,
  Wallet,
  PiggyBank,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  useIncomes,
  useDeleteIncome,
  CreateIncomeDialog,
  IncomeRow,
  SourceFilter,
  IncomeDetailSheet,
} from '@/features/incomes'
import { useAccounts } from '@/features/accounts'
import { AccountFilter } from '@/features/expenses'

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

export default function IncomesPage() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [selectedIncomeId, setSelectedIncomeId] = useState<string | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)

  // Get current month date range
  const dateRange = useMemo(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      from: firstDay.toISOString().split('T')[0],
      to: lastDay.toISOString().split('T')[0],
    }
  }, [])

  const { data: incomesData, isLoading, error, refetch } = useIncomes({
    from: dateRange.from,
    to: dateRange.to,
    source: selectedSource || undefined,
    accountId: selectedAccountId || undefined,
  })
  const { data: accountsData } = useAccounts()
  const deleteIncome = useDeleteIncome()

  const incomes = incomesData?.data ?? []
  const summary = incomesData?.summary
  const accounts = accountsData?.data ?? []

  // Get unique sources from incomes
  const sources = useMemo(() => {
    const sourceSet = new Set<string>()
    incomes.forEach((income) => {
      if (income.source) {
        sourceSet.add(income.source)
      }
    })
    return Array.from(sourceSet).sort()
  }, [incomes])

  // Group incomes by date
  const incomesByDate = useMemo(() => {
    const groups: Record<string, typeof incomes> = {}
    incomes.forEach((income) => {
      const dateKey = income.date.split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(income)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [incomes])

  // Calculate stats by source
  const statsBySource = useMemo(() => {
    const stats: Record<string, number> = {}
    incomes.forEach((income) => {
      stats[income.source] = (stats[income.source] || 0) + income.amount
    })
    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }, [incomes])

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот доход?')) {
      deleteIncome.mutate(id)
    }
  }

  const handleIncomeClick = (id: string) => {
    setSelectedIncomeId(id)
    setDetailSheetOpen(true)
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

  const totalAmount = summary?.totalAmount ?? 0
  const remainingForBudget = incomes.reduce(
    (sum, i) => sum + (i.remaining_for_budget ?? 0),
    0
  )
  const distributedAmount = totalAmount - remainingForBudget
  const distributedPercent =
    totalAmount > 0 ? Math.round((distributedAmount / totalAmount) * 100) : 0

  const currentMonthName = new Date().toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

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
            Доходы
          </h1>
          <p className="mt-1 text-muted-foreground capitalize">
            {currentMonthName}
          </p>
        </div>
        <CreateIncomeDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Добавить доход
          </Button>
        </CreateIncomeDialog>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Total Income */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Получено</p>
                <p className="text-xl font-bold tabular-nums text-emerald-500">
                  +{formatMoney(totalAmount)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remaining for Budget */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <Wallet className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">На расходы</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(remainingForBudget)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distributed to Funds */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <PiggyBank className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">В фонды</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(distributedAmount)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records Count */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Записей</p>
                <p className="text-xl font-bold tabular-nums">
                  {incomes.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Distribution Progress */}
      {totalAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Распределение доходов</span>
                <span className="text-sm text-muted-foreground">
                  {distributedPercent}% в фонды
                </span>
              </div>
              <Progress value={distributedPercent} className="h-3" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{formatMoney(distributedAmount)} ₽ в фонды</span>
                <span>{formatMoney(remainingForBudget)} ₽ на расходы</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top Sources */}
      {statsBySource.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-medium mb-4">По источникам</h3>
              <div className="space-y-3">
                {statsBySource.map(([source, amount]) => {
                  const percent =
                    totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0
                  return (
                    <div key={source} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{source}</span>
                        <span className="font-medium tabular-nums">
                          {formatMoney(amount)} ₽ ({percent}%)
                        </span>
                      </div>
                      <Progress value={percent} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap items-center gap-4"
      >
        {sources.length > 0 && (
          <SourceFilter
            sources={sources}
            selectedSource={selectedSource}
            onSelect={setSelectedSource}
          />
        )}

        {accounts.length > 0 && (
          <AccountFilter
            accounts={accounts}
            selectedId={selectedAccountId}
            onSelect={setSelectedAccountId}
          />
        )}
      </motion.div>

      {/* Loading State */}
      {isLoading && (
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
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <AnimatePresence mode="wait">
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {incomesByDate.length > 0 ? (
              incomesByDate.map(([date, dateIncomes]) => {
                const dayTotal = dateIncomes.reduce((sum, i) => sum + i.amount, 0)
                return (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground capitalize">
                        {formatDateHeader(date)}
                      </h3>
                      <span className="text-sm font-semibold tabular-nums text-emerald-500">
                        +{formatMoney(dayTotal)} ₽
                      </span>
                    </div>
                    <motion.div
                      className="space-y-2"
                      variants={container}
                      initial="hidden"
                      animate="show"
                    >
                      {dateIncomes.map((income) => (
                        <motion.div key={income.id} variants={item}>
                          <IncomeRow
                            income={income}
                            onClick={() => handleIncomeClick(income.id)}
                            onEdit={() => {
                              // TODO: implement edit
                            }}
                            onDelete={() => handleDelete(income.id)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )
              })
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30">
                <Banknote className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-medium">Нет доходов</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedSource
                      ? 'Доходы из этого источника не найдены'
                      : 'За этот месяц доходы не найдены'}
                  </p>
                </div>
                <CreateIncomeDialog>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить доход
                  </Button>
                </CreateIncomeDialog>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Income Detail Sheet */}
      <IncomeDetailSheet
        incomeId={selectedIncomeId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </div>
  )
}
