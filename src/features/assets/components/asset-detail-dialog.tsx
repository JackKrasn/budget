import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Coins,
  TrendingUp,
  Bitcoin,
  Landmark,
  Gem,
  Banknote,
  Loader2,
  AlertCircle,
  ChevronRight,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { InteractiveDonutChart } from '@/components/charts'
import type { AssetWithType } from '@/lib/api'
import { useAssetByFund } from '../hooks'

const ASSET_ICONS: Record<string, React.ElementType> = {
  currency: Banknote,
  stock: TrendingUp,
  etf: TrendingUp,
  bond: Landmark,
  crypto: Bitcoin,
  precious_metal: Gem,
  deposit: Coins,
  default: Coins,
}

const FUND_ICONS: Record<string, React.ElementType> = {
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

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface AssetDetailDialogProps {
  asset: AssetWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssetDetailDialog({
  asset,
  open,
  onOpenChange,
}: AssetDetailDialogProps) {
  const navigate = useNavigate()
  const { data, isLoading, error } = useAssetByFund(asset?.id)
  const [hoveredFundId, setHoveredFundId] = useState<string | null>(null)

  if (!asset) return null

  const Icon = ASSET_ICONS[asset.type_code || 'default'] || ASSET_ICONS.default
  const currencyCode = typeof asset.currency === 'string' ? asset.currency : ''
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode

  const getPrice = (): number | null => {
    const price = asset.current_price
    if (price == null) return null
    if (typeof price === 'number') return price
    if (typeof price === 'object' && 'Float64' in price && 'Valid' in price) {
      return (price as { Float64: number; Valid: boolean }).Valid
        ? (price as { Float64: number; Valid: boolean }).Float64
        : null
    }
    return null
  }

  const priceValue = getPrice()
  const assetData = data?.data?.[0]

  const handleFundClick = (fundId: string) => {
    onOpenChange(false)
    navigate(`/funds/${fundId}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              <Icon className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <span className="block">{asset.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs font-normal">
                  {asset.type_name}
                </Badge>
                {asset.ticker && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {asset.ticker}
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Price Info */}
          <div className="rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-border/50 p-4">
            <p className="text-sm text-muted-foreground mb-1">Текущая цена</p>
            <p className="text-3xl font-bold tabular-nums">
              {priceValue != null ? formatMoney(priceValue) : '—'}{' '}
              <span className="text-xl text-muted-foreground">{currencySymbol}</span>
            </p>
          </div>

          {/* Funds Section */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              В каких фондах представлен
            </h4>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-6 w-6 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">Ошибка загрузки</p>
              </div>
            )}

            {!isLoading && !error && assetData && assetData.funds.length > 0 && (
              <div className="space-y-4">
                {/* Chart and Legend */}
                <div className="flex gap-6 items-start">
                  {/* Donut Chart */}
                  <div className="shrink-0">
                    <InteractiveDonutChart
                      funds={assetData.funds.map(f => ({
                        fundId: f.fundId,
                        fundName: f.fundName,
                        fundColor: f.fundColor,
                        value: f.value,
                      }))}
                      size={100}
                      strokeWidth={14}
                      hoveredFundId={hoveredFundId}
                      onHoverFund={setHoveredFundId}
                    />
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {assetData.funds
                      .sort((a, b) => b.value - a.value)
                      .map((fund) => {
                        const percentage = assetData.totalValue > 0
                          ? (fund.value / assetData.totalValue) * 100
                          : 0
                        const isHovered = hoveredFundId === fund.fundId
                        return (
                          <div
                            key={fund.fundId}
                            className={`flex items-center gap-2 px-2 py-1 -mx-2 rounded-md cursor-pointer transition-colors ${
                              isHovered ? 'bg-muted/50' : 'hover:bg-muted/30'
                            }`}
                            onMouseEnter={() => setHoveredFundId(fund.fundId)}
                            onMouseLeave={() => setHoveredFundId(null)}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: fund.fundColor || '#6366f1' }}
                            />
                            <span className="text-sm truncate flex-1">{fund.fundName}</span>
                            <span className="text-sm font-medium tabular-nums">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Table */}
                <div className="space-y-1 pt-2">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground/70 border-b border-border/30">
                    <div className="w-2 shrink-0" />
                    <div className="flex-1">Фонд</div>
                    <div className="w-24 text-right">Кол-во</div>
                    <div className="w-24 text-right">Стоимость</div>
                    <div className="w-4 shrink-0" />
                  </div>

                  {/* Rows */}
                  {assetData.funds
                    .sort((a, b) => b.value - a.value)
                    .map((fund, index) => {
                      const isHovered = hoveredFundId === fund.fundId
                      return (
                        <motion.div
                          key={fund.fundId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`group flex cursor-pointer items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            isHovered ? 'bg-primary/10' : 'hover:bg-primary/5'
                          }`}
                          onClick={() => handleFundClick(fund.fundId)}
                          onMouseEnter={() => setHoveredFundId(fund.fundId)}
                          onMouseLeave={() => setHoveredFundId(null)}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: fund.fundColor || '#6366f1' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{fund.fundName}</p>
                          </div>
                          <div className="text-right shrink-0 w-24">
                            <p className="text-sm tabular-nums text-muted-foreground">
                              {formatMoney(fund.amount)} {currencySymbol}
                            </p>
                          </div>
                          <div className="text-right shrink-0 w-24">
                            <p className="text-sm tabular-nums">
                              {formatMoney(fund.value)} ₽
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 transition-colors group-hover:text-muted-foreground" />
                        </motion.div>
                      )
                    })}

                  {/* Total */}
                  {assetData.funds.length > 1 && (
                    <div className="flex items-center gap-3 px-3 py-2.5 mt-2 border-t border-border/30 text-sm font-medium">
                      <div className="w-2 shrink-0" />
                      <div className="flex-1">Итого</div>
                      <div className="w-24 text-right tabular-nums">
                        {formatMoney(assetData.totalAmount)} {currencySymbol}
                      </div>
                      <div className="w-24 text-right tabular-nums">
                        {formatMoney(assetData.totalValue)} ₽
                      </div>
                      <div className="w-4 shrink-0" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isLoading && !error && (!assetData || assetData.funds.length === 0) && (
              <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-border/50">
                <Wallet className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Актив не представлен ни в одном фонде
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
