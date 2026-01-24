import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, ArrowRight } from 'lucide-react'
import type { Deposit } from '@/lib/api'
import { useCloseDepositEarly } from '../hooks'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

interface CloseDepositDialogProps {
  deposit: Deposit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CloseDepositDialog({
  deposit,
  open,
  onOpenChange,
}: CloseDepositDialogProps) {
  const closeDeposit = useCloseDepositEarly()

  if (!deposit) return null

  const currencySymbol = CURRENCY_SYMBOLS[deposit.currency] || deposit.currency

  const formatAmount = (amount: number | undefined | null) => {
    if (amount == null) return '0.00'
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const calculateReturnAmount = () => {
    return (deposit.principalAmount || 0) + (deposit.totalInterest || 0)
  }

  const handleClose = async () => {
    try {
      await closeDeposit.mutateAsync(deposit.id)
      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Закрыть депозит досрочно?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-foreground">
              Вы собираетесь досрочно закрыть депозит <strong>"{deposit.assetName}"</strong>.
            </p>

            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm text-blue-700 dark:text-blue-400">
                При закрытии депозита средства будут возвращены на валютный актив {deposit.currency}
                {deposit.fundName ? ` в фонде "${deposit.fundName}"` : ' в фонде'}
              </AlertDescription>
            </Alert>

            <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Основная сумма:</span>
                  <span className="font-medium text-foreground">
                    {formatAmount(deposit.principalAmount)} {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Начисленные проценты:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    +{formatAmount(deposit.totalInterest)} {currencySymbol}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-2.5">
                <div className="flex justify-between font-semibold">
                  <span>Итого к возврату:</span>
                  <span className="text-foreground">
                    {formatAmount(calculateReturnAmount())} {currencySymbol}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-2.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">Куда вернутся средства:</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 rounded-md bg-background/50 px-3 py-2 text-xs">
                  <span className="font-medium">Валютный актив {deposit.currency}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Фонд "{deposit.fundName || 'Не указан'}"
                  </span>
                </div>
              </div>
            </div>

            {deposit.projectedYield > deposit.totalInterest && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Недополучено дохода:{' '}
                <span className="font-medium">
                  {formatAmount(deposit.projectedYield - deposit.totalInterest)} {currencySymbol}
                </span>
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClose}
            disabled={closeDeposit.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {closeDeposit.isPending ? 'Закрытие...' : 'Закрыть досрочно'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
