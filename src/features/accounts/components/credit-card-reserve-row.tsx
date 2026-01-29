import { motion } from 'framer-motion'
import { Clock, ShoppingCart } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { CreditCardReserve } from '@/lib/api/types'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
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

interface CreditCardReserveRowProps {
  reserve: CreditCardReserve
  isSelected: boolean
  onSelect: (id: string, selected: boolean) => void
}

export function CreditCardReserveRow({ reserve, isSelected, onSelect }: CreditCardReserveRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group relative flex items-center gap-3 rounded-lg border border-border/30 bg-background/50 p-3 pl-4 transition-all hover:border-border/60 hover:bg-background/80 hover:shadow-sm"
    >
      {/* Subtle left accent */}
      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-amber-500/40 transition-colors group-hover:bg-amber-500/60" />

      {/* Checkbox for selection */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(reserve.id, checked === true)}
        className="shrink-0"
      />

      {/* Reserve icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
        <Clock className="h-4 w-4 text-amber-500" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="font-medium truncate">
            {reserve.expenseDescription || 'Расход'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          Фонд: {reserve.fundName || 'Не указан'}
        </p>
      </div>

      {/* Date */}
      <span className="text-sm text-muted-foreground shrink-0 w-16 text-right">
        {formatDate(reserve.expenseDate)}
      </span>

      {/* Amounts */}
      <div className="shrink-0 text-right">
        {/* Remaining - main amount */}
        <p className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
          {formatMoney(reserve.remaining)} {getCurrencySymbol(reserve.currency)}
        </p>
        {/* Applied and total - secondary info */}
        {reserve.appliedAmount > 0 && (
          <p className="text-xs text-muted-foreground tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400">
              -{formatMoney(reserve.appliedAmount)}
            </span>
            {' '}из {formatMoney(reserve.amount)}
          </p>
        )}
      </div>
    </motion.div>
  )
}
