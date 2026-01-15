import { motion } from 'framer-motion'
import {
  Coins,
  TrendingUp,
  Bitcoin,
  Landmark,
  Gem,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AssetWithType } from '@/lib/api'

const ASSET_ICONS: Record<string, React.ElementType> = {
  currency: Coins,
  stock: TrendingUp,
  etf: TrendingUp,
  bond: Landmark,
  crypto: Bitcoin,
  precious_metal: Gem,
  default: Coins,
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

interface AssetCardProps {
  asset: AssetWithType
  onEdit?: () => void
  onDelete?: () => void
  onUpdatePrice?: () => void
}

export function AssetCard({
  asset,
  onEdit,
  onDelete,
  onUpdatePrice,
}: AssetCardProps) {
  const Icon = ASSET_ICONS[asset.type_code || 'default'] || ASSET_ICONS.default
  const currencyCode = typeof asset.currency === 'string' ? asset.currency : ''
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode

  // Handle Go nullable float format: {Float64: number, Valid: boolean}
  const getPrice = (): number | null => {
    const price = asset.current_price
    if (price == null) return null
    if (typeof price === 'number') return price
    // Go sql.NullFloat64 format
    if (typeof price === 'object' && 'Float64' in price && 'Valid' in price) {
      return (price as { Float64: number; Valid: boolean }).Valid
        ? (price as { Float64: number; Valid: boolean }).Float64
        : null
    }
    return null
  }

  const formatPrice = (price: number | null) => {
    if (price == null) return '—'
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const priceValue = getPrice()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="relative p-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{asset.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {asset.type_name}
                  </Badge>
                  {asset.ticker && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {asset.ticker}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onUpdatePrice && asset.type_code !== 'currency' && (
                  <DropdownMenuItem onClick={onUpdatePrice}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Обновить цену
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Price - only for non-currency assets */}
          {asset.type_code !== 'currency' && (
            <div className="rounded-lg bg-background/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Текущая цена</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatPrice(priceValue)}{' '}
                <span className="text-lg">{currencySymbol}</span>
              </p>
            </div>
          )}

          {/* Currency info - for currency assets */}
          {asset.type_code === 'currency' && (
            <div className="rounded-lg bg-background/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Код валюты</p>
              <p className="text-2xl font-bold tabular-nums">
                {asset.ticker || '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Курс задаётся в разделе «Курсы валют»
              </p>
            </div>
          )}

          {/* Details - only show for non-currency assets */}
          {asset.type_code !== 'currency' && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Валюта</span>
                <span className="font-medium">
                  {currencyCode || '—'} {currencySymbol}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
