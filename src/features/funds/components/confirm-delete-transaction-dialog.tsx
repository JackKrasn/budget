import { AlertTriangle, Wallet, Undo2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FundTransaction } from '@/lib/api/types'
import { TRANSACTION_TYPES } from '../constants'

interface ConfirmDeleteTransactionDialogProps {
  transaction: FundTransaction | null
  fundName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function ConfirmDeleteTransactionDialog({
  transaction,
  fundName,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: ConfirmDeleteTransactionDialogProps) {
  if (!transaction) return null

  const transactionType = TRANSACTION_TYPES[transaction.transaction_type]
  const isIncomeDistribution = !!(transaction.contribution_id || transaction.contribution_income_id)
  const sourceAccountName = transaction.source_account_name

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Удалить операцию?</DialogTitle>
              <DialogDescription>
                Операция будет удалена без возможности восстановления
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Transaction Info */}
          <Card className="border-muted">
            <CardContent className="p-4 space-y-3">
              {/* Transaction Type */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Тип операции:</span>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${transactionType?.color}20`,
                    color: transactionType?.color,
                  }}
                >
                  {transactionType?.label}
                </Badge>
              </div>

              {/* Fund */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Фонд:</span>
                <span className="font-semibold">{fundName}</span>
              </div>

              {/* Asset */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Актив:</span>
                <span className="font-semibold">{transaction.asset_name}</span>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Количество:</span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(transaction.amount)}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Дата:</span>
                <span className="font-semibold">{formatDate(transaction.date)}</span>
              </div>

              {/* Note if exists */}
              {transaction.note && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Примечание:</p>
                  <p className="text-sm">{transaction.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning and return info for income distribution transactions */}
          {isIncomeDistribution && sourceAccountName && (
            <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                  <Undo2 className="h-3.5 w-3.5" />
                  После удаления
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Средства вернутся на счёт
                    </p>
                    <p className="font-semibold truncate">{sourceAccountName}</p>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1">
                      +{formatMoney(transaction.amount)} {transaction.currency}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning if no account info available */}
          {isIncomeDistribution && !sourceAccountName && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Внимание:</strong> Эта операция связана с распределением дохода.
                При удалении средства вернутся на счёт источника.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
