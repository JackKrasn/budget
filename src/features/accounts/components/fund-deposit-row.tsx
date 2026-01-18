import { TrendingUp, MoreVertical, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { FundDeposit } from '@/lib/api/types'

interface FundDepositRowProps {
  deposit: FundDeposit
  onDelete?: (id: string) => void
  isDeleting?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getFundIcon(icon: string | null): React.ReactNode {
  // Можно расширить, если иконки фондов — это lucide icons
  return <TrendingUp className="h-4 w-4" />
}

export function FundDepositRow({ deposit, onDelete, isDeleting }: FundDepositRowProps) {
  const handleDelete = () => {
    if (onDelete && confirm('Вы уверены, что хотите удалить эту операцию?')) {
      onDelete(deposit.id)
    }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
      style={{ borderColor: deposit.fund_color || undefined }}
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{
          backgroundColor: deposit.fund_color
            ? `${deposit.fund_color}20`
            : 'rgba(139, 92, 246, 0.1)',
          color: deposit.fund_color || '#8b5cf6',
        }}
      >
        {getFundIcon(deposit.fund_icon)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-none">
          Пополнение фонда "{deposit.fund_name}"
        </p>
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
              className="h-8 w-8 shrink-0"
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
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
