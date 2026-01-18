import { useState } from 'react'
import { TrendingUp, MoreVertical, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDeleteDepositDialog } from './confirm-delete-deposit-dialog'
import type { FundDeposit } from '@/lib/api/types'

interface FundDepositRowProps {
  deposit: FundDeposit
  onDelete?: (id: string) => void
  isDeleting?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function getFundIcon(_icon: string | null): React.ReactNode {
  // Можно расширить, если иконки фондов — это lucide icons
  return <TrendingUp className="h-4 w-4" />
}

export function FundDepositRow({ deposit, onDelete, isDeleting }: FundDepositRowProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const handleDeleteClick = () => {
    setConfirmDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(deposit.id)
    }
    setConfirmDialogOpen(false)
  }

  const isIncomeDistribution = !!deposit.contribution_income_id

  return (
    <>
    <ConfirmDeleteDepositDialog
      deposit={deposit}
      open={confirmDialogOpen}
      onOpenChange={setConfirmDialogOpen}
      onConfirm={handleConfirmDelete}
      isDeleting={isDeleting}
    />
    <div
      className="group relative flex items-center gap-3 rounded-lg border border-border/30 bg-background/50 p-3 pl-4 transition-all hover:border-border/60 hover:bg-background/80 hover:shadow-sm overflow-hidden"
    >
      {/* Colorful left border for fund deposits */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-opacity group-hover:opacity-90"
        style={{ backgroundColor: deposit.fund_color || '#8b5cf6' }}
      />

      {/* Icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: deposit.fund_color
            ? `${deposit.fund_color}15`
            : 'rgba(139, 92, 246, 0.1)',
          color: deposit.fund_color || '#8b5cf6',
        }}
      >
        {getFundIcon(deposit.fund_icon)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium leading-none">
            Пополнение фонда "{deposit.fund_name}"
          </p>
          {isIncomeDistribution && (
            <Badge variant="secondary" className="text-xs">
              Из дохода
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {deposit.account_name}
          {deposit.note && ` • ${deposit.note}`}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className="font-semibold tabular-nums text-destructive">
          -{formatMoney(deposit.amount)} {deposit.currency}
        </p>
      </div>

      {/* Actions */}
      {onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDeleteClick}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
    </>
  )
}
