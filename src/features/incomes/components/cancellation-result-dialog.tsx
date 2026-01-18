import { CheckCircle2, ArrowRight, Wallet, PiggyBank } from 'lucide-react'
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
import type { CancelDistributionResponse } from '@/lib/api/types'

interface CancellationResultDialogProps {
  result: CancelDistributionResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function CancellationResultDialog({
  result,
  open,
  onOpenChange,
}: CancellationResultDialogProps) {
  if (!result) return null

  const balanceChange = result.accountBalanceAfter - result.accountBalanceBefore
  const fundBalanceChange = result.fundBalanceAfter - result.fundBalanceBefore

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <DialogTitle>Операция отменена</DialogTitle>
              <DialogDescription>
                Распределение успешно отменено, средства возвращены на счёт
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount returned */}
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Сумма возврата</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(result.amount)} ₽
              </p>
            </CardContent>
          </Card>

          {/* Account balance change */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Счёт: {result.accountName}</h4>
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">До отката</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatMoney(result.accountBalanceBefore)} ₽
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">После отката</p>
                    <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatMoney(result.accountBalanceAfter)} ₽
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Изменение:{' '}
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatMoney(balanceChange)} ₽
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fund balance change */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Фонд: {result.fundName}</h4>
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">До отката</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatMoney(result.fundBalanceBefore)} ₽
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">После отката</p>
                    <p className="text-lg font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                      {formatMoney(result.fundBalanceAfter)} ₽
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Изменение:{' '}
                    <span className="font-medium text-rose-600 dark:text-rose-400">
                      {formatMoney(fundBalanceChange)} ₽
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
