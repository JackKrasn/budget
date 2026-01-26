import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertCircle,
  Coins,
  TrendingUp,
  Landmark,
  Banknote,
  Bitcoin,
  BarChart3,
  Wallet,
  Home,
  ShoppingBag,
  Calendar,
  Plane,
  PiggyBank,
  Gift,
  Car,
  Briefcase,
  GraduationCap,
  Heart,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InteractiveDonutChart } from '@/components/charts'
import { cn } from '@/lib/utils'
import { useFunds } from '../hooks'
import type { FundBalance } from '@/lib/api/types'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatCompactMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`
  }
  return formatMoney(amount)
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

// Иконки для типов активов
const ASSET_TYPE_ICONS: Record<string, React.ElementType> = {
  currency: Banknote,
  etf: BarChart3,
  stock: TrendingUp,
  bond: Landmark,
  deposit: Coins,
  crypto: Bitcoin,
}

// Иконки для фондов (зарезервировано для будущего использования)
const _FUND_ICONS: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  home: Home,
  'shopping-bag': ShoppingBag,
  calendar: Calendar,
  plane: Plane,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  gift: Gift,
  car: Car,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  heart: Heart,
}
void _FUND_ICONS

/** Сгруппированный актив */
interface GroupedAsset {
  assetId: string
  assetName: string
  assetTicker: string | null
  assetCurrency: string
  assetTypeCode: string
  assetTypeName: string
  currentPrice: number
  totalAmount: number
  totalValue: number
  funds: {
    fundId: string
    fundName: string
    fundIcon: string
    fundColor: string
    amount: number
    value: number
  }[]
}

/** Группировка активов из данных фондов */
function groupAssetsByFunds(funds: FundBalance[]): GroupedAsset[] {
  const assetMap = new Map<string, GroupedAsset>()

  for (const fundBalance of funds) {
    const { fund, assets } = fundBalance

    for (const assetBalance of assets) {
      const { asset, amount, valueBase } = assetBalance
      const assetId = asset.id

      if (!assetMap.has(assetId)) {
        const typeNames: Record<string, string> = {
          currency: 'Валюта',
          etf: 'ETF',
          stock: 'Акции',
          bond: 'Облигации',
          deposit: 'Депозит',
          crypto: 'Криптовалюта',
        }

        assetMap.set(assetId, {
          assetId,
          assetName: asset.name,
          assetTicker: asset.ticker || null,
          assetCurrency: asset.currency,
          assetTypeCode: asset.typeCode,
          assetTypeName: typeNames[asset.typeCode] || asset.typeCode,
          currentPrice: asset.currentPrice ?? 1,
          totalAmount: 0,
          totalValue: 0,
          funds: [],
        })
      }

      const grouped = assetMap.get(assetId)!
      grouped.totalAmount += amount
      grouped.totalValue += valueBase
      grouped.funds.push({
        fundId: fund.id,
        fundName: fund.name,
        fundIcon: fund.icon,
        fundColor: fund.color,
        amount,
        value: valueBase,
      })
    }
  }

  return Array.from(assetMap.values()).sort((a, b) => b.totalValue - a.totalValue)
}

interface AssetRowProps {
  asset: GroupedAsset
  index: number
}

function AssetRow({ asset, index }: AssetRowProps) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredFundId, setHoveredFundId] = useState<string | null>(null)
  const currencySymbol = CURRENCY_SYMBOLS[asset.assetCurrency] ?? asset.assetCurrency

  const TypeIcon = ASSET_TYPE_ICONS[asset.assetTypeCode] || Coins

  const handleFundClick = (fundId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/funds/${fundId}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      {/* Main Row */}
      <div
        className={cn(
          'flex cursor-pointer items-center gap-4 py-3 px-3 -mx-3 rounded-lg transition-colors hover:bg-primary/5',
          isExpanded && 'bg-primary/10'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Asset Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 shrink-0">
          <TypeIcon className="h-5 w-5 text-sky-500" />
        </div>

        {/* Asset Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{asset.assetName}</span>
            {asset.assetTicker && (
              <span className="text-xs text-muted-foreground font-mono">
                {asset.assetTicker}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{asset.assetTypeName}</span>
            <span>•</span>
            <span>{asset.funds.length} {asset.funds.length === 1 ? 'фонд' : asset.funds.length < 5 ? 'фонда' : 'фондов'}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0 w-32">
          <p className="text-sm tabular-nums text-muted-foreground">
            {formatMoney(asset.totalAmount)} {currencySymbol}
          </p>
        </div>

        {/* Value */}
        <div className="text-right shrink-0 w-32">
          <p className="text-sm font-medium tabular-nums">
            {formatMoney(asset.totalValue)} ₽
          </p>
        </div>

        {/* Expand indicator */}
        <motion.div
          className="shrink-0"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
        </motion.div>
      </div>

      {/* Expanded Fund Breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-14 pr-4 pt-4 pb-4">
              <div className="flex gap-10">
                {/* Donut Chart */}
                <div className="shrink-0 pt-1">
                  <InteractiveDonutChart
                    funds={asset.funds.map(f => ({
                      fundId: f.fundId,
                      fundName: f.fundName,
                      fundColor: f.fundColor,
                      value: f.value,
                    }))}
                    size={80}
                    strokeWidth={10}
                    hoveredFundId={hoveredFundId}
                    onHoverFund={setHoveredFundId}
                    labelSize="sm"
                  />
                </div>

                {/* Fund list */}
                <div className="flex-1 min-w-0">
                  {/* Table header */}
                  <div className="flex items-center gap-3 pb-2 mb-2 border-b border-border/30 text-xs text-muted-foreground/70">
                    <div className="w-2 shrink-0" />
                    <div className="flex-1">Фонд</div>
                    <div className="w-24 text-right">Кол-во</div>
                    <div className="w-24 text-right">Стоимость</div>
                    <div className="w-12 text-right">%</div>
                    <div className="w-4 shrink-0" />
                  </div>

                  {/* Fund rows */}
                  <div>
                    {asset.funds
                      .sort((a, b) => b.value - a.value)
                      .map((fund, fundIndex) => (
                        <FundRow
                          key={fund.fundId}
                          fund={fund}
                          currency={asset.assetCurrency}
                          totalAmount={asset.totalAmount}
                          totalValue={asset.totalValue}
                          onFundClick={(e) => handleFundClick(fund.fundId, e)}
                          index={fundIndex}
                          isHovered={hoveredFundId === fund.fundId}
                          onHover={setHoveredFundId}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface FundRowProps {
  fund: GroupedAsset['funds'][0]
  currency: string
  totalAmount: number
  totalValue: number
  onFundClick: (e: React.MouseEvent) => void
  index: number
  isHovered?: boolean
  onHover?: (fundId: string | null) => void
}

function FundRow({ fund, currency, totalValue, onFundClick, index, isHovered, onHover }: FundRowProps) {
  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency
  const percentage = totalValue > 0 ? (fund.value / totalValue) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={cn(
        'group/row flex cursor-pointer items-center gap-3 py-2 transition-colors',
        isHovered ? 'bg-primary/10' : 'hover:bg-primary/5'
      )}
      onClick={onFundClick}
      onMouseEnter={() => onHover?.(fund.fundId)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Color indicator */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: fund.fundColor }}
      />

      {/* Fund Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{fund.fundName}</p>
      </div>

      {/* Amount in asset currency */}
      <div className="text-right shrink-0 w-24">
        <p className="text-sm tabular-nums text-muted-foreground">
          {formatMoney(fund.amount)} {currencySymbol}
        </p>
      </div>

      {/* Value in RUB */}
      <div className="text-right shrink-0 w-24">
        <p className="text-sm tabular-nums">
          {formatMoney(fund.value)} ₽
        </p>
      </div>

      {/* Percentage */}
      <div className="text-right shrink-0 w-12">
        <p className="text-sm tabular-nums text-muted-foreground">
          {percentage.toFixed(1)}%
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 transition-colors group-hover/row:text-muted-foreground" />
    </motion.div>
  )
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export function AssetsByFundList() {
  const { data, isLoading, error } = useFunds()

  const groupedAssets = useMemo(() => {
    if (!data?.data) return []
    return groupAssetsByFunds(data.data)
  }, [data?.data])

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Загрузка активов...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-[400px] flex-col items-center justify-center gap-4 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <p className="font-medium">Ошибка загрузки</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Попробовать снова
        </Button>
      </motion.div>
    )
  }

  if (groupedAssets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-[400px] flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-border/50 bg-gradient-to-b from-muted/30 to-transparent"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-muted to-muted/50">
            <Coins className="h-10 w-10 text-muted-foreground/50" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg">Нет активов в фондах</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Добавьте активы в ваши фонды, чтобы увидеть их распределение здесь
          </p>
        </div>
      </motion.div>
    )
  }

  // Calculate totals
  const totalValue = groupedAssets.reduce((sum, asset) => sum + asset.totalValue, 0)
  const totalAssets = groupedAssets.length

  // Group by asset type for summary
  const byType = groupedAssets.reduce((acc, asset) => {
    const type = asset.assetTypeCode
    if (!acc[type]) {
      acc[type] = { count: 0, value: 0 }
    }
    acc[type].count++
    acc[type].value += asset.totalValue
    return acc
  }, {} as Record<string, { count: number; value: number }>)

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-background border border-border/50 p-6"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          {/* Total Value */}
          <div>
            <p className="text-sm font-medium text-primary/80 mb-1">Общая стоимость активов</p>
            <p className="text-3xl font-bold tabular-nums tracking-tight">
              {formatMoney(totalValue)}
              <span className="text-xl font-normal text-primary/60 ml-1">₽</span>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            {Object.entries(byType)
              .sort(([, a], [, b]) => b.value - a.value)
              .slice(0, 4)
              .map(([type, stats]) => {
                const Icon = ASSET_TYPE_ICONS[type] || Coins
                const typeNames: Record<string, string> = {
                  currency: 'Валюта',
                  etf: 'ETF',
                  stock: 'Акции',
                  bond: 'Облигации',
                  deposit: 'Депозит',
                  crypto: 'Крипто',
                }
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                      <Icon className="h-4 w-4 text-sky-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{typeNames[type] || type}</p>
                      <p className="text-sm font-semibold tabular-nums">{formatCompactMoney(stats.value)}</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Asset count badge */}
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="font-mono">
            {totalAssets} {totalAssets === 1 ? 'актив' : totalAssets < 5 ? 'актива' : 'активов'}
          </Badge>
        </div>
      </motion.div>

      {/* Assets List */}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {groupedAssets.map((asset, index) => (
          <AssetRow key={asset.assetId} asset={asset} index={index} />
        ))}
      </motion.div>
    </div>
  )
}
