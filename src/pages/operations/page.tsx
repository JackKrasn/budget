import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2,
  AlertCircle,
  Receipt,
  ArrowLeftRight,
  RefreshCw,
  TrendingDown,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useExpenses,
  useDeleteExpense,
  ExpenseRow,
  CreateExpenseDialog,
  EditExpenseDialog,
} from '@/features/expenses'
import {
  useTransfers,
  useDeleteTransfer,
  TransferRow,
  TransferDialog,
  useBalanceAdjustments,
  useDeleteBalanceAdjustment,
  BalanceAdjustmentRow,
} from '@/features/accounts'
import { DateRangePicker } from '@/components/common'
import type { ExpenseListRow, TransferWithAccounts, BalanceAdjustmentWithAccount } from '@/lib/api/types'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateHeader(date: string): string {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) {
    return 'Сегодня'
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Вчера'
  }

  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

type OperationType = 'expense' | 'transfer' | 'adjustment'

interface Operation {
  id: string
  type: OperationType
  date: string
  data: ExpenseListRow | TransferWithAccounts | BalanceAdjustmentWithAccount
}

interface DayGroup {
  date: string
  operations: Operation[]
  totalExpenses: number
  totalTransfers: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function OperationsPage() {
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from, to }
  })

  const [editingExpense, setEditingExpense] = useState<ExpenseListRow | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Data fetching
  const { data: expensesData, isLoading: isExpensesLoading, error: expensesError } = useExpenses({
    from: dateRange.from.toISOString().split('T')[0],
    to: dateRange.to.toISOString().split('T')[0],
  })

  const { data: transfersData, isLoading: isTransfersLoading } = useTransfers({
    from: dateRange.from.toISOString().split('T')[0],
    to: dateRange.to.toISOString().split('T')[0],
  })

  const { data: adjustmentsData, isLoading: isAdjustmentsLoading } = useBalanceAdjustments({
    from: dateRange.from.toISOString().split('T')[0],
    to: dateRange.to.toISOString().split('T')[0],
  })

  const deleteExpense = useDeleteExpense()
  const deleteTransfer = useDeleteTransfer()
  const deleteAdjustment = useDeleteBalanceAdjustment()

  const expenses = expensesData?.data ?? []
  const transfers = transfersData?.data ?? []
  const adjustments = adjustmentsData?.data ?? []

  const isLoading = isExpensesLoading || isTransfersLoading || isAdjustmentsLoading

  // Group all operations by date
  const dayGroups = useMemo<DayGroup[]>(() => {
    const operations: Operation[] = [
      ...expenses.map((e) => ({ id: e.id, type: 'expense' as const, date: e.date, data: e })),
      ...transfers.map((t) => ({ id: t.id, type: 'transfer' as const, date: t.date, data: t })),
      ...adjustments.map((a) => ({ id: a.id, type: 'adjustment' as const, date: a.date, data: a })),
    ]

    // Group by date
    const groups: Record<string, Operation[]> = {}
    operations.forEach((op) => {
      const dateKey = op.date.split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(op)
    })

    // Sort operations within each day and calculate totals
    return Object.entries(groups)
      .map(([date, ops]) => {
        // Sort by type: expenses first, then transfers, then adjustments
        ops.sort((a, b) => {
          const typeOrder = { expense: 0, transfer: 1, adjustment: 2 }
          return typeOrder[a.type] - typeOrder[b.type]
        })

        const totalExpenses = ops
          .filter((op) => op.type === 'expense')
          .reduce((sum, op) => sum + (op.data as ExpenseListRow).amount, 0)

        const totalTransfers = ops
          .filter((op) => op.type === 'transfer')
          .reduce((sum, op) => sum + (op.data as TransferWithAccounts).amount, 0)

        return { date, operations: ops, totalExpenses, totalTransfers }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [expenses, transfers, adjustments])

  // Total summary
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0)

  const handleEditExpense = (expense: ExpenseListRow) => {
    setEditingExpense(expense)
    setEditDialogOpen(true)
  }

  const handleDeleteExpense = (expense: ExpenseListRow) => {
    if (confirm('Удалить этот расход?')) {
      deleteExpense.mutate(expense.id)
    }
  }

  const handleDeleteTransfer = (transfer: TransferWithAccounts) => {
    if (confirm('Удалить этот перевод?')) {
      deleteTransfer.mutate(transfer.id)
    }
  }

  const handleDeleteAdjustment = (adjustment: BalanceAdjustmentWithAccount) => {
    if (confirm('Удалить эту корректировку?')) {
      deleteAdjustment.mutate(adjustment.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Операции
          </h1>
          <p className="mt-1 text-muted-foreground">
            Все расходы, переводы и корректировки
          </p>
        </div>
        <div className="flex gap-2">
          <TransferDialog>
            <Button variant="outline" size="sm">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Перевод
            </Button>
          </TransferDialog>
          <CreateExpenseDialog>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Расход
            </Button>
          </CreateExpenseDialog>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-4"
      >
        <DateRangePicker
          from={dateRange.from}
          to={dateRange.to}
          onRangeChange={(from, to) => setDateRange({ from, to })}
        />

        <div className="flex-1" />

        {/* Summary stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            <span className="text-muted-foreground">Расходы:</span>
            <span className="font-semibold tabular-nums">{formatMoney(totalExpenses)} ₽</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Переводы:</span>
            <span className="font-semibold tabular-nums">{formatMoney(totalTransfers)} ₽</span>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {expensesError && (
        <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <p>Ошибка загрузки данных</p>
        </div>
      )}

      {/* Operations List */}
      {!isLoading && !expensesError && (
        <>
          {dayGroups.length > 0 ? (
            <motion.div
              className="space-y-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {dayGroups.map((group) => (
                <motion.div key={group.date} variants={item}>
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-muted-foreground capitalize">
                      {formatDateHeader(group.date)}
                    </h2>
                    <div className="flex items-center gap-3 text-xs">
                      {group.totalExpenses > 0 && (
                        <span className="text-rose-500 font-medium tabular-nums">
                          −{formatMoney(group.totalExpenses)} ₽
                        </span>
                      )}
                      {group.totalTransfers > 0 && (
                        <span className="text-blue-500 font-medium tabular-nums">
                          ↔ {formatMoney(group.totalTransfers)} ₽
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Operations */}
                  <div className="space-y-2">
                    {group.operations.map((op) => {
                      if (op.type === 'expense') {
                        const expense = op.data as ExpenseListRow
                        return (
                          <ExpenseRow
                            key={op.id}
                            expense={expense}
                            onEdit={() => handleEditExpense(expense)}
                            onDelete={() => handleDeleteExpense(expense)}
                          />
                        )
                      }
                      if (op.type === 'transfer') {
                        const transfer = op.data as TransferWithAccounts
                        return (
                          <TransferRow
                            key={op.id}
                            transfer={transfer}
                            onDelete={() => handleDeleteTransfer(transfer)}
                          />
                        )
                      }
                      if (op.type === 'adjustment') {
                        const adjustment = op.data as BalanceAdjustmentWithAccount
                        return (
                          <BalanceAdjustmentRow
                            key={op.id}
                            adjustment={adjustment}
                            onDelete={() => handleDeleteAdjustment(adjustment)}
                          />
                        )
                      }
                      return null
                    })}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30">
              <Receipt className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium">Нет операций</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  За выбранный период операции не найдены
                </p>
              </div>
              <CreateExpenseDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить расход
                </Button>
              </CreateExpenseDialog>
            </div>
          )}
        </>
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
