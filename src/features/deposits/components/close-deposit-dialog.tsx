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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Закрыть депозит досрочно?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Вы собираетесь досрочно закрыть депозит <strong>"{deposit.assetName}"</strong>.
            </p>
            <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Текущая сумма:</span>
                <span className="font-medium">{formatAmount(deposit.currentAmount)} {currencySymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Накопленные проценты:</span>
                <span className="font-medium text-emerald-600">+{formatAmount(deposit.totalInterest)} {currencySymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Потенциальный доход:</span>
                <span className="font-medium text-muted-foreground">{formatAmount(deposit.projectedYield)} {currencySymbol}</span>
              </div>
            </div>
            <p className="text-amber-600 dark:text-amber-400">
              Досрочное закрытие может привести к потере части начисленных процентов согласно условиям банка.
            </p>
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
