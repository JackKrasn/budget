import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Loader2,
  AlertCircle,
  Receipt,
  ArrowLeftRight,
  Plus,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  useFundDeposits,
  useDeleteFundDeposit,
  FundDepositRow,
  EditFundDepositDialog,
  BalanceChangeResultDialog,
  useAccounts,
} from '@/features/accounts'
import { AccountIcon } from '@/components/ui/account-icon'
import { DeleteTransactionResultDialog } from '@/features/funds/components'
import { DateRangePicker, DayHeader, getCurrencySymbol } from '@/components/common'
import type { ExpenseListRow, TransferWithAccounts, BalanceAdjustmentWithAccount, FundDeposit, DeleteTransactionResponse, UpdateFundDepositResponse } from '@/lib/api/types'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

type OperationType = 'expense' | 'transfer' | 'adjustment' | 'fund_deposit'

interface Operation {
  id: string
  type: OperationType
  date: string
  data: ExpenseListRow | TransferWithAccounts | BalanceAdjustmentWithAccount | FundDeposit
}

interface DayGroup {
  date: string
  operations: Operation[]
  totalExpensesByCurrency: Record<string, number>
  totalTransfersByCurrency: Record<string, number>
  totalAdjustmentsByCurrency: Record<string, number>
  totalFundDepositsByCurrency: Record<string, number>
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
  const [searchParams, setSearchParams] = useSearchParams()

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from, to }
  })

  // Helper to format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [editingExpense, setEditingExpense] = useState<ExpenseListRow | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingDeposit, setEditingDeposit] = useState<FundDeposit | null>(null)
  const [editDepositDialogOpen, setEditDepositDialogOpen] = useState(false)
  const [deleteResult, setDeleteResult] = useState<DeleteTransactionResponse | null>(null)
  const [deleteResultDialogOpen, setDeleteResultDialogOpen] = useState(false)
  const [updateResult, setUpdateResult] = useState<UpdateFundDepositResponse | null>(null)
  const [updateResultDialogOpen, setUpdateResultDialogOpen] = useState(false)
  const [deletedFundName, setDeletedFundName] = useState<string>('')
  const [updatedFundName, setUpdatedFundName] = useState<string>('')
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return searchParams.get('accountId') || 'all'
  })
  const [selectedOperationType, setSelectedOperationType] = useState<'all' | OperationType>('all')

  // Fetch accounts for filter
  const { data: accountsData } = useAccounts()

  // Sync URL params with state
  useEffect(() => {
    const accountIdFromUrl = searchParams.get('accountId')
    if (accountIdFromUrl && accountIdFromUrl !== selectedAccountId) {
      setSelectedAccountId(accountIdFromUrl)
    }
  }, [searchParams])

  // Update URL when account filter changes
  const handleAccountChange = (value: string) => {
    setSelectedAccountId(value)
    if (value === 'all') {
      searchParams.delete('accountId')
    } else {
      searchParams.set('accountId', value)
    }
    setSearchParams(searchParams, { replace: true })
  }

  // Data fetching
  const { data: expensesData, isLoading: isExpensesLoading, error: expensesError } = useExpenses({
    from: formatDateLocal(dateRange.from),
    to: formatDateLocal(dateRange.to),
  })

  const { data: transfersData, isLoading: isTransfersLoading } = useTransfers({
    from: formatDateLocal(dateRange.from),
    to: formatDateLocal(dateRange.to),
  })

  const { data: adjustmentsData, isLoading: isAdjustmentsLoading } = useBalanceAdjustments({
    from: formatDateLocal(dateRange.from),
    to: formatDateLocal(dateRange.to),
  })

  const { data: fundDepositsData, isLoading: isFundDepositsLoading } = useFundDeposits({
    from_date: formatDateLocal(dateRange.from),
    to_date: formatDateLocal(dateRange.to),
  })

  const deleteExpense = useDeleteExpense()
  const deleteTransfer = useDeleteTransfer()
  const deleteAdjustment = useDeleteBalanceAdjustment()
  const deleteFundDeposit = useDeleteFundDeposit()

  const expenses = expensesData?.data ?? []
  const transfers = transfersData?.data ?? []
  const adjustments = adjustmentsData?.data ?? []
  const fundDeposits = fundDepositsData?.data ?? []
  const accounts = accountsData?.data ?? []

  // Map accounts by ID for quick lookup
  const accountsMap = useMemo(() => {
    const map = new Map<string, typeof accounts[0]>()
    accounts.forEach(acc => map.set(acc.id, acc))
    return map
  }, [accounts])

  const isLoading = isExpensesLoading || isTransfersLoading || isAdjustmentsLoading || isFundDepositsLoading

  // Helper to check if operation involves selected account
  const operationMatchesAccount = (op: Operation): boolean => {
    if (selectedAccountId === 'all') return true

    if (op.type === 'expense') {
      return (op.data as ExpenseListRow).accountId === selectedAccountId
    }
    if (op.type === 'transfer') {
      const t = op.data as TransferWithAccounts
      return t.from_account_id === selectedAccountId || t.to_account_id === selectedAccountId
    }
    if (op.type === 'adjustment') {
      return (op.data as BalanceAdjustmentWithAccount).account_id === selectedAccountId
    }
    if (op.type === 'fund_deposit') {
      const fd = op.data as FundDeposit
      return fd.from_account_id === selectedAccountId
    }
    return false
  }

  // Group all operations by date with filters
  const dayGroups = useMemo<DayGroup[]>(() => {
    let operations: Operation[] = [
      ...expenses.map((e) => ({ id: e.id, type: 'expense' as const, date: e.date, data: e })),
      ...transfers.map((t) => ({ id: t.id, type: 'transfer' as const, date: t.date, data: t })),
      ...adjustments.map((a) => ({ id: a.id, type: 'adjustment' as const, date: a.date, data: a })),
      ...fundDeposits.map((fd) => ({ id: fd.id, type: 'fund_deposit' as const, date: fd.date, data: fd })),
    ]

    // Apply filters
    if (selectedOperationType !== 'all') {
      operations = operations.filter(op => op.type === selectedOperationType)
    }

    operations = operations.filter(operationMatchesAccount)

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
        // Sort by type: expenses first, then transfers, then fund deposits, then adjustments
        ops.sort((a, b) => {
          const typeOrder = { expense: 0, transfer: 1, fund_deposit: 2, adjustment: 3 }
          return typeOrder[a.type] - typeOrder[b.type]
        })

        // Group expenses by currency
        const totalExpensesByCurrency: Record<string, number> = {}
        ops
          .filter((op) => op.type === 'expense')
          .forEach((op) => {
            const expense = op.data as ExpenseListRow
            const currency = expense.currency || 'RUB'
            totalExpensesByCurrency[currency] = (totalExpensesByCurrency[currency] || 0) + expense.amount
          })

        // Group transfers by source currency
        const totalTransfersByCurrency: Record<string, number> = {}
        ops
          .filter((op) => op.type === 'transfer')
          .forEach((op) => {
            const transfer = op.data as TransferWithAccounts
            const currency = transfer.from_currency || 'RUB'
            totalTransfersByCurrency[currency] = (totalTransfersByCurrency[currency] || 0) + transfer.amount
          })

        // Group adjustments by currency
        const totalAdjustmentsByCurrency: Record<string, number> = {}
        ops
          .filter((op) => op.type === 'adjustment')
          .forEach((op) => {
            const adj = op.data as BalanceAdjustmentWithAccount
            const currency = adj.account_currency || 'RUB'
            totalAdjustmentsByCurrency[currency] = (totalAdjustmentsByCurrency[currency] || 0) + Math.abs(adj.amount)
          })

        // Group fund deposits by currency
        const totalFundDepositsByCurrency: Record<string, number> = {}
        ops
          .filter((op) => op.type === 'fund_deposit')
          .forEach((op) => {
            const deposit = op.data as FundDeposit
            const currency = deposit.currency || 'RUB'
            totalFundDepositsByCurrency[currency] = (totalFundDepositsByCurrency[currency] || 0) + deposit.amount
          })

        return { date, operations: ops, totalExpensesByCurrency, totalTransfersByCurrency, totalAdjustmentsByCurrency, totalFundDepositsByCurrency }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [expenses, transfers, adjustments, fundDeposits, selectedAccountId, selectedOperationType])

  // Total summary with filters applied - grouped by currency
  const totalExpensesByCurrency = useMemo(() => {
    const totals: Record<string, number> = {}
    dayGroups.forEach((group) => {
      Object.entries(group.totalExpensesByCurrency).forEach(([currency, amount]) => {
        totals[currency] = (totals[currency] || 0) + amount
      })
    })
    return totals
  }, [dayGroups])

  const totalFundDepositsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {}
    dayGroups.forEach((group) => {
      Object.entries(group.totalFundDepositsByCurrency).forEach(([currency, amount]) => {
        totals[currency] = (totals[currency] || 0) + amount
      })
    })
    return totals
  }, [dayGroups])

  // Check if there are any totals
  const hasExpenses = Object.keys(totalExpensesByCurrency).length > 0
  const hasFundDeposits = Object.keys(totalFundDepositsByCurrency).length > 0

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
    deleteTransfer.mutate(transfer.id)
  }

  const handleDeleteAdjustment = (adjustment: BalanceAdjustmentWithAccount) => {
    if (confirm('Удалить эту корректировку?')) {
      deleteAdjustment.mutate(adjustment.id)
    }
  }

  const handleEditFundDeposit = (deposit: FundDeposit) => {
    setEditingDeposit(deposit)
    setEditDepositDialogOpen(true)
  }

  const handleEditFundDepositSuccess = (result: UpdateFundDepositResponse) => {
    if (result.accountBalance || result.fundBalance) {
      setUpdateResult(result)
      setUpdatedFundName(result.deposit.fund_name || editingDeposit?.fund_name || '')
      setUpdateResultDialogOpen(true)
    }
  }

  const handleDeleteFundDeposit = async (deposit: FundDeposit) => {
    try {
      const result = await deleteFundDeposit.mutateAsync(deposit.id)

      // Show result dialog if operation returned balance info
      if (result && (result.accountBalance || result.fundBalance)) {
        setDeleteResult(result)
        setDeletedFundName(deposit.fund_name)
        setDeleteResultDialogOpen(true)
      }
    } catch (error) {
      // Error handled in mutation
      console.error('Delete fund deposit error:', error)
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

      {/* Controls - Refined Editorial Layout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-border/40">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/30 border border-border/50">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Фильтры</span>
          </div>

          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onRangeChange={(from, to) => setDateRange({ from, to })}
          />

          {/* Account Filter */}
          <Select value={selectedAccountId} onValueChange={handleAccountChange}>
            <SelectTrigger className="w-[180px] border-border/50 bg-background/50">
              <SelectValue placeholder="Все счета" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все счета</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <AccountIcon
                      bankName={account.bank_name}
                      typeCode={account.type_code}
                      color={account.color}
                      size="sm"
                      showBackground={false}
                    />
                    <span>{account.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Operation Type Filter */}
          <Select value={selectedOperationType} onValueChange={(value) => setSelectedOperationType(value as 'all' | OperationType)}>
            <SelectTrigger className="w-[180px] border-border/50 bg-background/50">
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="expense">Расходы</SelectItem>
              <SelectItem value="transfer">Переводы</SelectItem>
              <SelectItem value="adjustment">Корректировки</SelectItem>
              <SelectItem value="fund_deposit">Переводы в фонды</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters button */}
          {(selectedAccountId !== 'all' || selectedOperationType !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                handleAccountChange('all')
                setSelectedOperationType('all')
              }}
            >
              Сбросить
            </Button>
          )}
        </div>

        {/* Summary Stats - Editorial Typography */}
        <div className="flex items-center gap-6 px-1 flex-wrap">
          {hasExpenses && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Расходы</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(totalExpensesByCurrency).map(([currency, amount]) => (
                  <span key={currency} className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
                    {formatMoney(amount)} {getCurrencySymbol(currency)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasFundDeposits && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">В фонды</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(totalFundDepositsByCurrency).map(([currency, amount]) => (
                  <span key={currency} className="text-lg font-semibold tabular-nums text-purple-600 dark:text-purple-400">
                    {formatMoney(amount)} {getCurrencySymbol(currency)}
                  </span>
                ))}
              </div>
            </div>
          )}
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
              key={`${selectedOperationType}-${selectedAccountId}`}
              className="space-y-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {dayGroups.map((group) => (
                <motion.div key={group.date} variants={item}>
                  {/* Day Header */}
                  <DayHeader
                    date={group.date}
                    expensesByCurrency={Object.keys(group.totalExpensesByCurrency).length > 0 ? group.totalExpensesByCurrency : undefined}
                    transfersByCurrency={Object.keys(group.totalTransfersByCurrency).length > 0 ? group.totalTransfersByCurrency : undefined}
                    adjustmentsByCurrency={Object.keys(group.totalAdjustmentsByCurrency).length > 0 ? group.totalAdjustmentsByCurrency : undefined}
                    fundDepositsByCurrency={Object.keys(group.totalFundDepositsByCurrency).length > 0 ? group.totalFundDepositsByCurrency : undefined}
                    className="mb-3"
                  />

                  {/* Operations */}
                  <div className="space-y-2">
                    {group.operations.map((op) => {
                      if (op.type === 'expense') {
                        const expense = op.data as ExpenseListRow
                        const expenseAccount = accountsMap.get(expense.accountId)
                        return (
                          <ExpenseRow
                            key={op.id}
                            expense={expense}
                            account={expenseAccount ? {
                              name: expenseAccount.name,
                              bankName: expenseAccount.bank_name,
                              typeCode: expenseAccount.type_code,
                              color: expenseAccount.color,
                            } : undefined}
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
                      if (op.type === 'fund_deposit') {
                        const deposit = op.data as FundDeposit
                        return (
                          <FundDepositRow
                            key={op.id}
                            deposit={deposit}
                            onEdit={() => handleEditFundDeposit(deposit)}
                            onDelete={() => handleDeleteFundDeposit(deposit)}
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

      {/* Edit Fund Deposit Dialog */}
      <EditFundDepositDialog
        deposit={editingDeposit}
        open={editDepositDialogOpen}
        onOpenChange={setEditDepositDialogOpen}
        onSuccess={handleEditFundDepositSuccess}
      />

      {/* Delete Fund Deposit Result Dialog */}
      <DeleteTransactionResultDialog
        result={deleteResult}
        fundName={deletedFundName}
        open={deleteResultDialogOpen}
        onOpenChange={setDeleteResultDialogOpen}
      />

      {/* Update Fund Deposit Result Dialog */}
      <BalanceChangeResultDialog
        title="Перевод обновлён"
        message={updateResult?.message}
        fundName={updatedFundName}
        accountBalance={updateResult?.accountBalance}
        fundBalance={updateResult?.fundBalance}
        open={updateResultDialogOpen}
        onOpenChange={setUpdateResultDialogOpen}
      />
    </div>
  )
}
