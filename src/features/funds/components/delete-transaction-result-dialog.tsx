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
import type { DeleteTransactionResponse } from '@/lib/api/types'

interface DeleteTransactionResultDialogProps {
  result: DeleteTransactionResponse | null
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

function getCurrencySymbol(currency?: string): string {
  if (!currency) return '₽'
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    GEL: '₾',
    TRY: '₺',
  }
  return symbols[currency] || currency
}

export function DeleteTransactionResultDialog({
  result,
  fundName,
  open,
  onOpenChange,
}: DeleteTransactionResultDialogProps) {
  if (!result) return null

  const { fundBalance, accountBalance } = result
  const hasAccountBalance = !!accountBalance

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <DialogTitle>Транзакция удалена</DialogTitle>
              <DialogDescription>
                {result.message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fund balance change */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Фонд: {fundName} ({fundBalance.assetName})</h4>
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">До удаления</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatMoney(fundBalance.before)} {getCurrencySymbol(fundBalance.currency)}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">После удаления</p>
                    <p className={`text-lg font-semibold tabular-nums ${
                      fundBalance.change > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatMoney(fundBalance.after)} {getCurrencySymbol(fundBalance.currency)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Изменение:{' '}
                    <span className={`font-medium ${
                      fundBalance.change > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {fundBalance.change > 0 ? '+' : ''}{formatMoney(fundBalance.change)} {getCurrencySymbol(fundBalance.currency)}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account balance change (if present) */}
          {hasAccountBalance && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Счёт: {accountBalance.assetName}</h4>
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">До удаления</p>
                      <p className="text-lg font-semibold tabular-nums">
                        {formatMoney(accountBalance.before)} {getCurrencySymbol(accountBalance.currency)}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">После удаления</p>
                      <p className={`text-lg font-semibold tabular-nums ${
                        accountBalance.change > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatMoney(accountBalance.after)} {getCurrencySymbol(accountBalance.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Изменение:{' '}
                      <span className={`font-medium ${
                        accountBalance.change > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {accountBalance.change > 0 ? '+' : ''}{formatMoney(accountBalance.change)} {getCurrencySymbol(accountBalance.currency)}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
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
