import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Receipt,
  Loader2,
  Filter,
  X,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useFundTransactions, useDeleteContribution, useDeleteTransaction, useFund } from '../hooks'
import { DeleteContributionResultDialog } from './delete-contribution-result-dialog'
import { DeleteTransactionResultDialog } from './delete-transaction-result-dialog'
import { ConfirmDeleteTransactionDialog } from './confirm-delete-transaction-dialog'
import type { FundTransaction, FundTransactionType, NullFloat64, DeleteContributionResponse, DeleteTransactionResponse } from '@/lib/api/types'
import { TRANSACTION_TYPES } from '../constants'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getNullableFloat(value: NullFloat64 | null | undefined): number | null {
  if (!value) return null
  if (typeof value === 'number') return value
  if (value.Valid) return value.Float64
  return null
}

function getTransactionIcon(type: FundTransactionType) {
  const icons = {
    buy: ShoppingCart,
    sell: DollarSign,
    transfer_in: ArrowDownLeft,
    transfer_out: ArrowUpRight,
    deposit: Plus,
    withdrawal: Receipt,
  }
  return icons[type] || ShoppingCart
}

function getTransactionColor(type: FundTransactionType): string {
  return TRANSACTION_TYPES[type]?.color || 'gray'
}

function getCounterpartLabel(tx: FundTransaction): string {
  switch (tx.transaction_type) {
    case 'buy':
    case 'sell':
      return tx.counterpart_asset_name || ''
    case 'transfer_in':
      return `← ${tx.counterpart_fund_name || ''}`
    case 'transfer_out':
      return `→ ${tx.counterpart_fund_name || ''}`
    case 'deposit':
      return tx.source_account_name || ''
    case 'withdrawal':
      return tx.note || 'Расход'
    default:
      return ''
  }
}

interface FundTransactionsHistoryProps {
  fundId: string
}

const ALL_TRANSACTION_TYPES: FundTransactionType[] = [
  'buy',
  'sell',
  'transfer_in',
  'transfer_out',
  'deposit',
  'withdrawal',
]

export function FundTransactionsHistory({ fundId }: FundTransactionsHistoryProps) {
  const navigate = useNavigate()
  const [selectedTypes, setSelectedTypes] = useState<FundTransactionType[]>(ALL_TRANSACTION_TYPES)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [deleteContributionResult, setDeleteContributionResult] = useState<DeleteContributionResponse | null>(null)
  const [deleteContributionResultDialogOpen, setDeleteContributionResultDialogOpen] = useState(false)
  const [deleteTransactionResult, setDeleteTransactionResult] = useState<DeleteTransactionResponse | null>(null)
  const [deleteTransactionResultDialogOpen, setDeleteTransactionResultDialogOpen] = useState(false)
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<FundTransaction | null>(null)

  const { data: fundData } = useFund(fundId)
  const { data, isLoading } = useFundTransactions(fundId, {
    type: selectedTypes.length === 1 ? selectedTypes[0] : undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  })

  const deleteContribution = useDeleteContribution()
  const deleteTransaction = useDeleteTransaction()

  const fundName = fundData?.fund.name || ''

  const transactions = data?.data ?? []

  // Filter by selected types (client-side when multiple types selected)
  const filteredTransactions =
    selectedTypes.length === ALL_TRANSACTION_TYPES.length
      ? transactions
      : transactions.filter((tx) => selectedTypes.includes(tx.transaction_type))

  const handleTypeToggle = (type: FundTransactionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleResetFilters = () => {
    setSelectedTypes(ALL_TRANSACTION_TYPES)
    setDateFrom('')
    setDateTo('')
  }

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return

    setConfirmDeleteDialogOpen(false)

    try {
      // Use different endpoints based on transaction type
      if (transactionToDelete.contribution_id) {
        // Deposit with contribution_id - use contribution endpoint
        const result = await deleteContribution.mutateAsync({
          fundId,
          contributionId: transactionToDelete.contribution_id,
        })

        // Show delete contribution result dialog if operation returned balance info
        if (result && (result.fundBalances.length > 0 || result.accountBalances)) {
          setDeleteContributionResult(result)
          setDeleteContributionResultDialogOpen(true)
        }
      } else {
        // Other transaction types - use transaction endpoint
        const result = await deleteTransaction.mutateAsync({
          fundId,
          transactionId: transactionToDelete.id,
        })

        // Show delete transaction result dialog
        if (result) {
          setDeleteTransactionResult(result)
          setDeleteTransactionResultDialogOpen(true)
        }
      }
    } catch (error) {
      console.error('Delete transaction error:', error)
      // Error handled in mutation
    } finally {
      setTransactionToDelete(null)
    }
  }

  const hasActiveFilters =
    selectedTypes.length < ALL_TRANSACTION_TYPES.length || dateFrom !== '' || dateTo !== ''

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          История операций
        </h3>
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`gap-1.5 ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
            >
              <Filter className="h-3.5 w-3.5" />
              Фильтры
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {selectedTypes.length < 5 ? selectedTypes.length : ''}
                  {dateFrom || dateTo ? '•' : ''}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Фильтры</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={handleResetFilters}
                  >
                    <X className="h-3 w-3" />
                    Сбросить
                  </Button>
                )}
              </div>

              {/* Type filters */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Тип операции</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TRANSACTION_TYPES) as FundTransactionType[]).map(
                    (type) => (
                      <label
                        key={type}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 p-2 transition-colors hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => handleTypeToggle(type)}
                        />
                        <span className="text-sm">
                          {TRANSACTION_TYPES[type].label}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Date filters */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Период</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      placeholder="От"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      placeholder="До"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Type badges */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(TRANSACTION_TYPES) as FundTransactionType[]).map((type) => {
          const config = TRANSACTION_TYPES[type]
          const isActive = selectedTypes.includes(type)
          return (
            <Badge
              key={type}
              variant={isActive ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                isActive
                  ? `bg-${config.color}-500/20 text-${config.color}-600 hover:bg-${config.color}-500/30 dark:text-${config.color}-400`
                  : 'hover:bg-muted'
              }`}
              onClick={() => handleTypeToggle(type)}
              style={
                isActive
                  ? {
                      backgroundColor: `color-mix(in srgb, ${config.color === 'green' ? '#22c55e' : config.color === 'blue' ? '#3b82f6' : config.color === 'orange' ? '#f97316' : config.color === 'red' ? '#f43f5e' : '#6b7280'} 20%, transparent)`,
                      color:
                        config.color === 'green'
                          ? '#16a34a'
                          : config.color === 'blue'
                            ? '#2563eb'
                            : config.color === 'orange'
                              ? '#ea580c'
                              : config.color === 'red'
                                ? '#e11d48'
                                : '#4b5563',
                    }
                  : {}
              }
            >
              {config.label}
            </Badge>
          )
        })}
      </div>

      {/* Transactions list */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-2">
          {filteredTransactions.map((tx, index) => {
            const Icon = getTransactionIcon(tx.transaction_type)
            const color = getTransactionColor(tx.transaction_type)
            const pricePerUnit = getNullableFloat(tx.price_per_unit)
            const totalValue = getNullableFloat(tx.total_value)
            const counterpart = getCounterpartLabel(tx)

            const colorClasses = {
              green: {
                bg: 'bg-emerald-500/10',
                iconBg: 'bg-emerald-500/20',
                icon: 'text-emerald-500',
                text: 'text-emerald-600 dark:text-emerald-400',
              },
              blue: {
                bg: 'bg-blue-500/10',
                iconBg: 'bg-blue-500/20',
                icon: 'text-blue-500',
                text: 'text-blue-600 dark:text-blue-400',
              },
              orange: {
                bg: 'bg-orange-500/10',
                iconBg: 'bg-orange-500/20',
                icon: 'text-orange-500',
                text: 'text-orange-600 dark:text-orange-400',
              },
              red: {
                bg: 'bg-rose-500/10',
                iconBg: 'bg-rose-500/20',
                icon: 'text-rose-500',
                text: 'text-rose-600 dark:text-rose-400',
              },
            }

            const classes = colorClasses[color as keyof typeof colorClasses] || colorClasses.green
            const isWithdrawal = tx.transaction_type === 'withdrawal'
            const isDeposit = tx.transaction_type === 'deposit'
            const isIncomeDistribution = isDeposit && !!tx.contribution_income_id
            // Can delete: deposits with contribution_id OR other transaction types (buy, sell, transfer)
            const canDelete = (isDeposit && !!tx.contribution_id) || (!isDeposit && !isWithdrawal)

            const handleClick = () => {
              if (isWithdrawal) {
                navigate(`/expenses?fund=${fundId}`)
              }
            }

            const handleDeleteClick = (e: React.MouseEvent) => {
              e.stopPropagation()
              if (!canDelete) return

              setTransactionToDelete(tx)
              setConfirmDeleteDialogOpen(true)
            }

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center gap-3 rounded-xl ${classes.bg} p-3 ${
                  isWithdrawal ? 'cursor-pointer hover:ring-2 hover:ring-rose-500/30 transition-all' : ''
                }`}
                onClick={handleClick}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${classes.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${classes.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${classes.text}`}>
                      {tx.transaction_type === 'buy' || tx.transaction_type === 'sell'
                        ? `${tx.transaction_type === 'buy' ? '+' : '-'}${formatMoney(tx.amount)}`
                        : tx.transaction_type === 'transfer_out' || tx.transaction_type === 'withdrawal'
                          ? `-${formatMoney(tx.amount)}`
                          : `+${formatMoney(tx.amount)}`}{' '}
                      {tx.asset_ticker || tx.asset_name}
                    </p>
                    {isIncomeDistribution && (
                      <Badge variant="secondary" className="text-xs">
                        Из дохода
                      </Badge>
                    )}
                    {isWithdrawal && (
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(tx.date)}</span>
                    {pricePerUnit !== null && (
                      <span>• {formatMoney(pricePerUnit)} за ед.</span>
                    )}
                    {totalValue !== null && (
                      <span>• {formatMoney(totalValue)} {tx.currency}</span>
                    )}
                    {counterpart && <span>• {counterpart}</span>}
                    {tx.note && <span>• {tx.note}</span>}
                  </div>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={handleDeleteClick}
                    disabled={deleteContribution.isPending || deleteTransaction.isPending}
                  >
                    {deleteContribution.isPending || deleteTransaction.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </motion.div>
            )
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/30 text-center"
        >
          <ShoppingCart className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'Нет операций по выбранным фильтрам'
              : 'История операций пуста'}
          </p>
        </motion.div>
      )}

      {/* Delete Contribution Result Dialog */}
      <DeleteContributionResultDialog
        result={deleteContributionResult}
        fundName={fundName}
        open={deleteContributionResultDialogOpen}
        onOpenChange={setDeleteContributionResultDialogOpen}
      />

      {/* Delete Transaction Result Dialog */}
      <DeleteTransactionResultDialog
        result={deleteTransactionResult}
        fundName={fundName}
        open={deleteTransactionResultDialogOpen}
        onOpenChange={setDeleteTransactionResultDialogOpen}
      />

      {/* Confirm Delete Transaction Dialog */}
      <ConfirmDeleteTransactionDialog
        transaction={transactionToDelete}
        fundName={fundName}
        open={confirmDeleteDialogOpen}
        onOpenChange={setConfirmDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteContribution.isPending || deleteTransaction.isPending}
      />
    </div>
  )
}
