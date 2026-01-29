import { Loader2, CheckCircle2, Info } from 'lucide-react'
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
import { useApplyReserves } from '../hooks'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface ApplyReservesDialogProps {
  creditCardId: string
  selectedReserveIds: string[]
  selectedAmount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ApplyReservesDialog({
  creditCardId,
  selectedReserveIds,
  selectedAmount,
  open,
  onOpenChange,
  onSuccess,
}: ApplyReservesDialogProps) {
  const applyReserves = useApplyReserves()

  const handleConfirm = async () => {
    if (selectedReserveIds.length === 0) {
      return
    }

    try {
      await applyReserves.mutateAsync({
        creditCardId,
        data: {
          reserveIds: selectedReserveIds,
        },
      })
      onOpenChange(false)
      onSuccess?.()
    } catch {
      // Error handled in mutation
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Применить резервы?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-foreground">
              Вы применяете резервы для учёта погашения кредитной карты.
            </p>

            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm text-blue-700 dark:text-blue-400">
                Это учётная операция. Резервы будут помечены как использованные —
                средства фонда считаются потраченными на погашение кредитной карты.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Резервов к применению:</span>
                <span className="font-medium text-foreground">
                  {selectedReserveIds.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Сумма:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(selectedAmount)} ₽
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={applyReserves.isPending}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={applyReserves.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {applyReserves.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Применение...
              </>
            ) : (
              'Применить'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
