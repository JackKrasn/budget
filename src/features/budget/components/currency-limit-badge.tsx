import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { CurrencyLimit, BudgetCurrency } from '@/lib/api/types'

// Currency display configuration
const CURRENCY_CONFIG: Record<BudgetCurrency, {
  symbol: string
  color: string
  bgColor: string
  borderColor: string
  name: string
}> = {
  RUB: {
    symbol: '₽',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    name: 'Рубли',
  },
  USD: {
    symbol: '$',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    name: 'Доллары',
  },
  EUR: {
    symbol: '€',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    borderColor: 'border-indigo-500/30',
    name: 'Евро',
  },
  GEL: {
    symbol: '₾',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-500/10 dark:bg-rose-500/20',
    borderColor: 'border-rose-500/30',
    name: 'Лари',
  },
  TRY: {
    symbol: '₺',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 dark:bg-red-500/20',
    borderColor: 'border-red-500/30',
    name: 'Турецкая лира',
  },
  CNY: {
    symbol: '¥',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    name: 'Юань',
  },
  AED: {
    symbol: 'د.إ',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    name: 'Дирхам ОАЭ',
  },
  USDT: {
    symbol: '₮',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-500/10 dark:bg-teal-500/20',
    borderColor: 'border-teal-500/30',
    name: 'USDT',
  },
  BTC: {
    symbol: '₿',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 dark:bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    name: 'Bitcoin',
  },
  ETH: {
    symbol: 'Ξ',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    name: 'Ethereum',
  },
  TON: {
    symbol: '💎',
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-500/10 dark:bg-sky-500/20',
    borderColor: 'border-sky-500/30',
    name: 'TON',
  },
  OTHER: {
    symbol: '¤',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-500/10 dark:bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    name: 'Прочее',
  },
}

export function getCurrencyConfig(currency: BudgetCurrency) {
  return CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.OTHER
}

interface CurrencyLimitBadgeProps {
  limit: CurrencyLimit
  compact?: boolean
  showProgress?: boolean
  onClick?: () => void
}

export function CurrencyLimitBadge({
  limit,
  compact = false,
  showProgress = true,
  onClick,
}: CurrencyLimitBadgeProps) {
  const config = getCurrencyConfig(limit.currency)
  const progress = limit.totalLimit > 0 ? (limit.actualAmount / limit.totalLimit) * 100 : 0
  const isOverBudget = limit.remaining < 0
  const isNearLimit = progress >= 80 && !isOverBudget

  const formatMoney = (amount: number, decimals = 2) => {
    if (limit.currency === 'BTC' || limit.currency === 'ETH') {
      return amount.toLocaleString('ru-RU', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      })
    }
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  if (compact) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
          'text-xs font-medium tabular-nums transition-all',
          'border',
          config.bgColor,
          config.borderColor,
          config.color,
          onClick && 'cursor-pointer hover:shadow-sm',
          isOverBudget && 'bg-destructive/10 border-destructive/30 text-destructive'
        )}
      >
        <span className="font-semibold">{config.symbol}</span>
        <span>{formatMoney(limit.actualAmount, 0)}</span>
        <span className="text-muted-foreground">/</span>
        <span>{formatMoney(limit.totalLimit, 0)}</span>
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-lg border p-3',
        'transition-all duration-200',
        config.bgColor,
        config.borderColor,
        onClick && 'cursor-pointer hover:shadow-md',
        isOverBudget && 'bg-destructive/5 border-destructive/30'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('text-lg font-bold', config.color)}>
            {config.symbol}
          </span>
          <span className="text-sm font-medium text-foreground">
            {limit.currency}
          </span>
        </div>
        <div className={cn(
          'text-xs px-2 py-0.5 rounded-full',
          isOverBudget
            ? 'bg-destructive/20 text-destructive'
            : isNearLimit
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              : 'bg-muted text-muted-foreground'
        )}>
          {isOverBudget ? 'Превышен' : isNearLimit ? 'Близко' : `${Math.round(progress)}%`}
        </div>
      </div>

      {/* Amounts */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Потрачено</span>
          <span className={cn(
            'text-sm font-semibold tabular-nums',
            isOverBudget ? 'text-destructive' : config.color
          )}>
            {config.symbol}{formatMoney(limit.actualAmount)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Лимит</span>
          <span className="text-sm tabular-nums text-foreground">
            {config.symbol}{formatMoney(limit.totalLimit)}
          </span>
        </div>
        {limit.bufferAmount > 0 && (
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">
              (план {config.symbol}{formatMoney(limit.plannedAmount)} + буфер {config.symbol}{formatMoney(limit.bufferAmount)})
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                isOverBudget
                  ? 'bg-destructive'
                  : isNearLimit
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              )}
            />
          </div>
          {isOverBudget && (
            <div className="h-1.5 w-full rounded-full bg-destructive/20 overflow-hidden -mt-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((progress - 100), 50)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full bg-destructive/50"
              />
            </div>
          )}
        </div>
      )}

      {/* Remaining */}
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Остаток</span>
        <span className={cn(
          'text-sm font-bold tabular-nums',
          isOverBudget
            ? 'text-destructive'
            : limit.remaining > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground'
        )}>
          {limit.remaining >= 0 ? '+' : ''}
          {config.symbol}{formatMoney(limit.remaining)}
        </span>
      </div>
    </motion.div>
  )
}

interface CurrencyLimitsGridProps {
  limits: CurrencyLimit[]
  onLimitClick?: (limit: CurrencyLimit) => void
  compact?: boolean
}

export function CurrencyLimitsGrid({
  limits,
  onLimitClick,
  compact = false,
}: CurrencyLimitsGridProps) {
  if (limits.length === 0) {
    return null
  }

  // Sort: RUB first, then by totalLimit descending
  const sortedLimits = [...limits].sort((a, b) => {
    if (a.currency === 'RUB') return -1
    if (b.currency === 'RUB') return 1
    return b.totalLimit - a.totalLimit
  })

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {sortedLimits.map((limit) => (
          <CurrencyLimitBadge
            key={limit.id}
            limit={limit}
            compact
            showProgress={false}
            onClick={onLimitClick ? () => onLimitClick(limit) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sortedLimits.map((limit, index) => (
        <motion.div
          key={limit.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <CurrencyLimitBadge
            limit={limit}
            onClick={onLimitClick ? () => onLimitClick(limit) : undefined}
          />
        </motion.div>
      ))}
    </div>
  )
}
