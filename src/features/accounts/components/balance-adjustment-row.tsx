import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, MoreHorizontal, Trash2, TrendingUp, TrendingDown, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditAdjustmentDialog } from './edit-adjustment-dialog'
import type { BalanceAdjustmentWithAccount } from '@/lib/api/types'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
  }
  return symbols[currency] || currency
}

interface BalanceAdjustmentRowProps {
  adjustment: BalanceAdjustmentWithAccount
  onDelete?: () => void
}

export function BalanceAdjustmentRow({ adjustment, onDelete }: BalanceAdjustmentRowProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const isPositive = adjustment.amount >= 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group relative flex items-center gap-3 rounded-lg border border-border/30 bg-background/50 p-3 pl-4 transition-all hover:border-border/60 hover:bg-background/80 hover:shadow-sm"
    >
      {/* Subtle left accent for adjustments */}
      <div
        className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-colors ${
          isPositive
            ? 'bg-emerald-500/40 group-hover:bg-emerald-500/60'
            : 'bg-amber-500/40 group-hover:bg-amber-500/60'
        }`}
      />

      {/* Adjustment icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isPositive ? 'bg-emerald-500/10' : 'bg-amber-500/10'
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-amber-500" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="font-medium truncate">{adjustment.account_name}</span>
        </div>
        {adjustment.reason && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {adjustment.reason}
          </p>
        )}
      </div>

      {/* Date */}
      <span className="text-sm text-muted-foreground shrink-0 w-16 text-right">
        {formatDate(adjustment.date)}
      </span>

      {/* Amount */}
      <span
        className={`font-semibold tabular-nums shrink-0 w-28 text-right ${
          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
        }`}
      >
        {isPositive ? '+' : '-'}{formatMoney(adjustment.amount)} {getCurrencySymbol(adjustment.account_currency)}
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
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
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

      {/* Edit Adjustment Dialog */}
      <EditAdjustmentDialog
        adjustment={adjustment}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </motion.div>
  )
}
