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
import type { DeleteContributionResponse } from '@/lib/api/types'

interface DeleteContributionResultDialogProps {
  result: DeleteContributionResponse | null
  fundName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function DeleteContributionResultDialog({
  result,
  fundName,
  open,
  onOpenChange,
}: DeleteContributionResultDialogProps) {
  if (!result) return null

  const { fundBalances, accountBalances } = result
  const hasAccountBalances = accountBalances && accountBalances.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <DialogTitle>Пополнение удалено</DialogTitle>
              <DialogDescription>
                {result.message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fund balances */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Фонд: {fundName}</h4>
            </div>
            <div className="space-y-2">
              {fundBalances.map((balance) => (
                <Card key={balance.assetId}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">{balance.assetName}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">До удаления</p>
                        <p className="text-lg font-semibold tabular-nums">
                          {formatMoney(balance.before)} ₽
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">После удаления</p>
                        <p className={`text-lg font-semibold tabular-nums ${
                          balance.change > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {formatMoney(balance.after)} ₽
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Изменение:{' '}
                        <span className={`font-medium ${
                          balance.change > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {balance.change > 0 ? '+' : ''}{formatMoney(balance.change)} ₽
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Account balances (if present) */}
          {hasAccountBalances && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Счета</h4>
              </div>
              <div className="space-y-2">
                {accountBalances.map((balance) => (
                  <Card key={balance.assetId}>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">{balance.assetName}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">До удаления</p>
                          <p className="text-lg font-semibold tabular-nums">
                            {formatMoney(balance.before)} ₽
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">После удаления</p>
                          <p className={`text-lg font-semibold tabular-nums ${
                            balance.change > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {formatMoney(balance.after)} ₽
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                          Изменение:{' '}
                          <span className={`font-medium ${
                            balance.change > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {balance.change > 0 ? '+' : ''}{formatMoney(balance.change)} ₽
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
