import { motion } from 'framer-motion'
import { ArrowRight, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TransferWithAccounts } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

interface TransferRowProps {
  transfer: TransferWithAccounts
  onDelete?: () => void
}

export function TransferRow({ transfer, onDelete }: TransferRowProps) {
  const currencySymbol = CURRENCY_SYMBOLS[transfer.currency] || transfer.currency

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card/30 p-3 transition-all hover:border-border hover:bg-card/50"
    >
      {/* Transfer direction indicator */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
        <ArrowRight className="h-4 w-4 text-blue-500" />
      </div>

      {/* From → To */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium truncate">{transfer.from_account_name}</span>
          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="font-medium truncate">{transfer.to_account_name}</span>
        </div>
        {transfer.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {transfer.description}
          </p>
        )}
      </div>

      {/* Date */}
      <span className="text-sm text-muted-foreground shrink-0 w-16 text-right">
        {formatDate(transfer.date)}
      </span>

      {/* Amount */}
      <span className="font-semibold tabular-nums shrink-0 w-28 text-right text-blue-600 dark:text-blue-400">
        {formatMoney(transfer.amount)} {currencySymbol}
      </span>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}
