import { AlertTriangle, Wallet, ArrowLeft, PiggyBank, Undo2 } from 'lucide-react'
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
import type { FundDeposit } from '@/lib/api/types'

interface ConfirmDeleteDepositDialogProps {
  deposit: FundDeposit | null
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

export function ConfirmDeleteDepositDialog({
  deposit,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: ConfirmDeleteDepositDialogProps) {
  if (!deposit) return null

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
              <DialogTitle>Удалить перевод в фонд?</DialogTitle>
              <DialogDescription>
                Операция будет отменена, средства вернутся на счёт
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Amount Display */}
          <div className="flex items-center justify-center py-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Сумма операции</p>
              <p className="text-3xl font-bold tabular-nums text-destructive">
                {formatMoney(deposit.amount)} {deposit.currency}
              </p>
            </div>
          </div>

          {/* Original Transfer */}
          <div className="rounded-lg border border-muted/50 bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="opacity-60">Оригинальная операция</span>
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Счёт</p>
                <p className="font-semibold text-sm truncate">{deposit.account_name}</p>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0 opacity-40" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Фонд</p>
                <p className="font-semibold text-sm truncate">{deposit.fund_name}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Return Flow */}
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-md">
                <Undo2 className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="h-8" />
          </div>

          {/* After Deletion */}
          <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                <Undo2 className="h-3.5 w-3.5" />
                После удаления
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Средства вернутся на счёт</p>
                  <p className="font-semibold truncate">{deposit.account_name}</p>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1">
                    +{formatMoney(deposit.amount)} {deposit.currency}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {deposit.note && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-medium mb-1">Примечание:</p>
              <p>{deposit.note}</p>
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
