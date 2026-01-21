import { AlertTriangle, Wallet, ArrowRight, Undo2 } from 'lucide-react'
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
import type { TransferWithAccounts } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

interface ConfirmDeleteTransferDialogProps {
  transfer: TransferWithAccounts | null
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

export function ConfirmDeleteTransferDialog({
  transfer,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: ConfirmDeleteTransferDialogProps) {
  if (!transfer) return null

  const fromCurrencySymbol = CURRENCY_SYMBOLS[transfer.from_currency] || transfer.from_currency
  const toCurrencySymbol = CURRENCY_SYMBOLS[transfer.to_currency] || transfer.to_currency
  const isDifferentCurrencies = transfer.from_currency !== transfer.to_currency

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
              <DialogTitle>Удалить перевод?</DialogTitle>
              <DialogDescription>
                Операция будет отменена, балансы счетов восстановлены
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Amount Display */}
          <div className="flex items-center justify-center py-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Сумма перевода</p>
              {isDifferentCurrencies ? (
                <div className="space-y-1">
                  <p className="text-2xl font-bold tabular-nums text-destructive">
                    {formatMoney(transfer.amount)} {fromCurrencySymbol}
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-muted-foreground">
                    → {formatMoney(transfer.to_amount || transfer.amount)} {toCurrencySymbol}
                  </p>
                </div>
              ) : (
                <p className="text-3xl font-bold tabular-nums text-destructive">
                  {formatMoney(transfer.amount)} {fromCurrencySymbol}
                </p>
              )}
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
                <p className="text-xs text-muted-foreground mb-0.5">Откуда</p>
                <p className="font-semibold text-sm truncate">{transfer.from_account_name}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Куда</p>
                <p className="font-semibold text-sm truncate">{transfer.to_account_name}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Wallet className="h-4 w-4 text-muted-foreground" />
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
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                <Undo2 className="h-3.5 w-3.5" />
                После удаления
              </p>
              <div className="space-y-3">
                {/* From account gets money back */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Вернётся на счёт</p>
                    <p className="font-semibold truncate">{transfer.from_account_name}</p>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                      +{formatMoney(transfer.amount + (transfer.fee_amount || 0))} {fromCurrencySymbol}
                      {transfer.fee_amount && transfer.fee_amount > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (вкл. комиссию {formatMoney(transfer.fee_amount)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* To account loses money */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Wallet className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Спишется со счёта</p>
                    <p className="font-semibold truncate">{transfer.to_account_name}</p>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400 mt-0.5">
                      −{formatMoney(transfer.to_amount || transfer.amount)} {toCurrencySymbol}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {transfer.description && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-medium mb-1">Примечание:</p>
              <p>{transfer.description}</p>
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
