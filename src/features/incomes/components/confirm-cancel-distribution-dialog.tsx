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
import { FundIcon } from '@/components/common/category-icon'
import type { IncomeDistribution } from '@/lib/api/types'

interface ConfirmCancelDistributionDialogProps {
  distribution: IncomeDistribution | null
  accountName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isCancelling?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function ConfirmCancelDistributionDialog({
  distribution,
  accountName,
  open,
  onOpenChange,
  onConfirm,
  isCancelling,
}: ConfirmCancelDistributionDialogProps) {
  if (!distribution) return null

  const amount = distribution.actual_amount ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <DialogTitle>Отменить распределение?</DialogTitle>
              <DialogDescription>
                Средства вернутся на счёт, распределение станет неподтверждённым
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Amount Display */}
          <div className="flex items-center justify-center py-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Сумма операции</p>
              <p className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-500">
                {formatMoney(amount)} ₽
              </p>
            </div>
          </div>

          {/* Original Distribution */}
          <div className="rounded-lg border border-muted/50 bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="opacity-60">Текущее распределение</span>
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Со счёта</p>
                <p className="font-semibold text-sm truncate">{accountName || 'Счёт'}</p>
              </div>
              <div className="flex h-4 w-4 shrink-0 items-center justify-center opacity-40">
                →
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">В фонд</p>
                <div className="flex items-center gap-2">
                  <FundIcon
                    name={distribution.fund_name}
                    color={distribution.fund_color}
                    size="sm"
                  />
                  <p className="font-semibold text-sm truncate">{distribution.fund_name}</p>
                </div>
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

          {/* After Cancellation */}
          <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                <Undo2 className="h-3.5 w-3.5" />
                После отмены
              </p>
              <div className="space-y-3">
                {/* Money returns to account */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Средства вернутся на счёт</p>
                    <p className="font-semibold truncate">{accountName || 'Счёт'}</p>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1">
                      +{formatMoney(amount)} ₽
                    </p>
                  </div>
                </div>

                {/* Distribution status */}
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-2 border border-amber-200 dark:border-amber-900/50">
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    Распределение вернётся в статус "Не подтверждено" и будет доступно для повторного подтверждения
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCancelling}
          >
            Назад
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            disabled={isCancelling}
            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            {isCancelling ? 'Отмена...' : 'Отменить распределение'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
