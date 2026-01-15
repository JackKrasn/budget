import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Loader2,
  Filter,
  X,
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
import { useFundTransactions } from '../hooks'
import type { FundTransaction, FundTransactionType, NullFloat64 } from '@/lib/api/types'
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
    default:
      return ''
  }
}

interface FundTransactionsHistoryProps {
  fundId: string
}

export function FundTransactionsHistory({ fundId }: FundTransactionsHistoryProps) {
  const [selectedTypes, setSelectedTypes] = useState<FundTransactionType[]>([
    'buy',
    'sell',
    'transfer_in',
    'transfer_out',
    'deposit',
  ])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const { data, isLoading } = useFundTransactions(fundId, {
    type: selectedTypes.length === 1 ? selectedTypes[0] : undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  })

  const transactions = data?.data ?? []

  // Filter by selected types (client-side when multiple types selected)
  const filteredTransactions =
    selectedTypes.length === 5
      ? transactions
      : transactions.filter((tx) => selectedTypes.includes(tx.transaction_type))

  const handleTypeToggle = (type: FundTransactionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleResetFilters = () => {
    setSelectedTypes(['buy', 'sell', 'transfer_in', 'transfer_out', 'deposit'])
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters =
    selectedTypes.length < 5 || dateFrom !== '' || dateTo !== ''

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
                      backgroundColor: `color-mix(in srgb, ${config.color === 'green' ? '#22c55e' : config.color === 'blue' ? '#3b82f6' : config.color === 'orange' ? '#f97316' : '#6b7280'} 20%, transparent)`,
                      color:
                        config.color === 'green'
                          ? '#16a34a'
                          : config.color === 'blue'
                            ? '#2563eb'
                            : config.color === 'orange'
                              ? '#ea580c'
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
            }

            const classes = colorClasses[color as keyof typeof colorClasses] || colorClasses.green

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center gap-3 rounded-xl ${classes.bg} p-3`}
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
                        : tx.transaction_type === 'transfer_out'
                          ? `-${formatMoney(tx.amount)}`
                          : `+${formatMoney(tx.amount)}`}{' '}
                      {tx.asset_ticker || tx.asset_name}
                    </p>
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
    </div>
  )
}
