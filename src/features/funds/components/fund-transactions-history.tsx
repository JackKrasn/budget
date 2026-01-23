import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  Wallet,
  Pencil,
  CalendarDays,
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
import { useFundTransactions, useFundContributions, useDeleteContribution, useDeleteTransaction, useFund } from '../hooks'
import { DeleteContributionResultDialog } from './delete-contribution-result-dialog'
import { DeleteTransactionResultDialog } from './delete-transaction-result-dialog'
import { ConfirmDeleteTransactionDialog } from './confirm-delete-transaction-dialog'
import { EditFundTransactionDialog } from './edit-fund-transaction-dialog'
import type { FundTransaction, FundTransactionType, FundContribution, NullFloat64, DeleteContributionResponse, DeleteTransactionResponse } from '@/lib/api/types'
import { TRANSACTION_TYPES } from '../constants'

// Unified history item type
type HistoryItem =
  | (FundTransaction & { itemType: 'transaction' })
  | (FundContribution & { itemType: 'contribution'; transaction_type: 'contribution' })

interface DayGroup {
  date: string
  items: HistoryItem[]
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(price)
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    GEL: '₾',
    TRY: '₺',
  }
  return symbols[currency] || currency
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
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
    weekday: 'short',
    day: 'numeric',
    month: 'long',
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
    contribution: Wallet,
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
  assetId?: string
  assetName?: string
  onClearAssetFilter?: () => void
}

const ALL_TRANSACTION_TYPES: FundTransactionType[] = [
  'contribution',
  'buy',
  'sell',
  'transfer_in',
  'transfer_out',
  'deposit',
  'withdrawal',
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const dayItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export function FundTransactionsHistory({ fundId, assetId, assetName, onClearAssetFilter }: FundTransactionsHistoryProps) {
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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<FundTransaction | null>(null)

  const { data: fundData } = useFund(fundId)

  // Only fetch transactions if contribution is not the only selected type
  const shouldFetchTransactions = selectedTypes.some(t => t !== 'contribution')
  // Note: assetId filtering is done client-side as backend doesn't support it
  const { data: transactionsData, isLoading: isLoadingTransactions } = useFundTransactions(fundId, {
    type: selectedTypes.length === 1 && selectedTypes[0] !== 'contribution' ? selectedTypes[0] : undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  })

  // Fetch contributions
  const shouldFetchContributions = selectedTypes.includes('contribution')
  const { data: contributionsData, isLoading: isLoadingContributions } = useFundContributions(fundId)

  const deleteContribution = useDeleteContribution()
  const deleteTransaction = useDeleteTransaction()

  const fundName = fundData?.fund.name || ''

  const transactions = transactionsData?.data ?? []
  const contributions = contributionsData?.data ?? []

  // Combine, filter by type, and group by date
  const dayGroups = useMemo<DayGroup[]>(() => {
    const items: HistoryItem[] = []

    // Add transactions
    if (shouldFetchTransactions) {
      transactions.forEach(tx => {
        // Filter by assetId if set
        if (assetId && tx.asset_id !== assetId) return

        items.push({ ...tx, itemType: 'transaction' })
      })
    }

    // Add contributions (converted to HistoryItem format)
    // Note: Contributions don't have asset_id - they are fund-level operations
    // When filtering by asset, we hide contributions as they don't belong to specific assets
    if (shouldFetchContributions && !assetId) {
      contributions.forEach(c => {
        // Filter by date if filters are set
        if (dateFrom && c.date < dateFrom) return
        if (dateTo && c.date > dateTo) return

        items.push({
          ...c,
          itemType: 'contribution',
          transaction_type: 'contribution' as const
        })
      })
    }

    // Filter by selected types
    const filteredItems = selectedTypes.length === ALL_TRANSACTION_TYPES.length
      ? items
      : items.filter((item) => selectedTypes.includes(item.transaction_type))

    // Group by date
    const groups: Record<string, HistoryItem[]> = {}
    filteredItems.forEach((item) => {
      const dateKey = item.date.split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(item)
    })

    // Sort and return
    return Object.entries(groups)
      .map(([date, dayItems]) => ({
        date,
        items: dayItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, contributions, shouldFetchTransactions, shouldFetchContributions, dateFrom, dateTo, assetId, selectedTypes])

  const isLoading = isLoadingTransactions || isLoadingContributions

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
    selectedTypes.length < ALL_TRANSACTION_TYPES.length || dateFrom !== '' || dateTo !== '' || !!assetId

  const totalTransactions = dayGroups.reduce((sum, group) => sum + group.items.length, 0)

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            История операций
          </h3>
          {assetId && assetName && (
            <Badge variant="secondary" className="gap-1">
              {assetName}
              {onClearAssetFilter && (
                <button
                  onClick={onClearAssetFilter}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          )}
          {totalTransactions > 0 && (
            <span className="text-xs text-muted-foreground">
              ({totalTransactions})
            </span>
          )}
        </div>
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

      {/* Transactions list grouped by day */}
      <AnimatePresence mode="wait">
        {dayGroups.length > 0 ? (
          <motion.div
            key="transactions-list"
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {dayGroups.map((group) => (
              <motion.div key={group.date} variants={dayItem}>
                {/* Day Header */}
                <div className="sticky top-0 z-10 -mx-1 mb-3 flex items-center gap-2 bg-background/95 px-1 py-2 backdrop-blur-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium capitalize text-foreground/80">
                    {formatDateHeader(group.date)}
                  </h3>
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-xs text-muted-foreground">
                    {group.items.length} {group.items.length === 1 ? 'операция' : group.items.length < 5 ? 'операции' : 'операций'}
                  </span>
                </div>

                {/* Day Transactions */}
                <div className="space-y-2 pl-9">
                  {group.items.map((item, index) => {
                    const Icon = getTransactionIcon(item.transaction_type)
                    const color = getTransactionColor(item.transaction_type)
                    const isContribution = item.itemType === 'contribution'

                    // Get transaction-specific values
                    const pricePerUnit = !isContribution ? getNullableFloat(item.price_per_unit) : null
                    const totalValue = !isContribution ? getNullableFloat(item.total_value) : null
                    const counterpart = !isContribution ? getCounterpartLabel(item) : null

                    const classes = colorClasses[color as keyof typeof colorClasses] || colorClasses.green

                    // Transaction-specific flags
                    const isWithdrawal = item.transaction_type === 'withdrawal'
                    const isDeposit = item.transaction_type === 'deposit'
                    const isIncomeDistribution = !isContribution && isDeposit && !!item.contribution_income_id

                    // Can delete: contributions OR all deposits OR other transaction types (buy, sell, transfer)
                    // Only withdrawals cannot be deleted (they are managed through expenses)
                    const canDelete = isContribution ||
                      (!isContribution && !isWithdrawal)

                    const handleClick = () => {
                      if (isWithdrawal) {
                        navigate(`/expenses?fund=${fundId}`)
                      }
                    }

                    const handleDeleteClick = (e: React.MouseEvent) => {
                      e.stopPropagation()
                      if (!canDelete) return

                      if (isContribution) {
                        // For contributions, we need to call delete contribution with the contribution id
                        deleteContribution.mutateAsync({
                          fundId,
                          contributionId: item.id,
                        }).then(result => {
                          if (result && (result.fundBalances.length > 0 || result.accountBalances)) {
                            setDeleteContributionResult(result)
                            setDeleteContributionResultDialogOpen(true)
                          }
                        }).catch(error => {
                          console.error('Delete contribution error:', error)
                        })
                      } else {
                        setTransactionToDelete(item)
                        setConfirmDeleteDialogOpen(true)
                      }
                    }

                    // Get display amount and label
                    const displayAmount = isContribution ? item.total_amount : item.amount
                    const displayCurrency = item.currency || ''
                    const displayLabel = isContribution
                      ? (item.note === 'Начальный остаток' ? 'Начальный остаток' : 'Поступление в фонд')
                      : (!isContribution ? (item.asset_ticker || item.asset_name) : '')

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`group flex items-center gap-3 rounded-xl ${classes.bg} p-3 transition-all ${
                          isWithdrawal ? 'cursor-pointer hover:ring-2 hover:ring-rose-500/30' : 'hover:shadow-sm'
                        }`}
                        onClick={handleClick}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${classes.iconBg} transition-transform group-hover:scale-105`}
                        >
                          <Icon className={`h-4 w-4 ${classes.icon}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${classes.text}`}>
                              {isContribution
                                ? `+${formatMoney(displayAmount)} ${getCurrencySymbol(displayCurrency)}`
                                : item.transaction_type === 'buy' || item.transaction_type === 'sell'
                                  ? `${item.transaction_type === 'buy' ? '+' : '-'}${formatMoney(displayAmount)}`
                                  : item.transaction_type === 'transfer_out' || item.transaction_type === 'withdrawal'
                                    ? `-${formatMoney(displayAmount)}`
                                    : `+${formatMoney(displayAmount)}`}{' '}
                              {!isContribution && displayLabel}
                            </p>
                            {isContribution && (
                              <Badge variant="secondary" className="text-xs">
                                {displayLabel}
                              </Badge>
                            )}
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
                            {pricePerUnit !== null && (
                              <span>{formatPrice(pricePerUnit)} за ед.</span>
                            )}
                            {totalValue !== null && !isContribution && (
                              <span>• {formatMoney(totalValue)} {item.currency}</span>
                            )}
                            {counterpart && <span>• {counterpart}</span>}
                            {!isContribution && item.note && <span>• {item.note}</span>}
                            {isContribution && item.note && item.note !== 'Начальный остаток' && (
                              <span>• {item.note}</span>
                            )}
                          </div>
                        </div>
                        {/* Edit button - only for non-contribution transactions */}
                        {!isContribution && !isWithdrawal && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTransactionToEdit(item as FundTransaction)
                              setEditDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
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
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
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
      </AnimatePresence>

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

      {/* Edit Fund Transaction Dialog */}
      <EditFundTransactionDialog
        transaction={transactionToEdit}
        fundId={fundId}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setTransactionToEdit(null)
        }}
      />
    </div>
  )
}
