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
import { Info, ArrowRight, Undo2, Wallet, Trash2 } from 'lucide-react'
import type { PlannedExpenseWithDetails } from '@/lib/api/types'
import { CURRENCY_SYMBOLS } from '@/types'

interface UnconfirmPlannedExpenseDialogProps {
  expense: PlannedExpenseWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isPending?: boolean
}

export function UnconfirmPlannedExpenseDialog({
  expense,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: UnconfirmPlannedExpenseDialogProps) {
  if (!expense) return null

  const currency = expense.currency || 'RUB'
  const currencySymbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency

  const formatAmount = (amount: number | undefined | null) => {
    if (amount == null) return '0.00'
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Helper для извлечения даты из разных форматов
  const getDateString = (
    value: string | { Time: string; Valid: boolean } | null | undefined
  ): string => {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object' && 'Valid' in value && value.Valid) {
      return value.Time
    }
    return ''
  }

  const formatDate = (date: string | { Time: string; Valid: boolean } | null | undefined) => {
    const dateStr = getDateString(date)
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    })
  }

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-amber-500" />
            Отменить подтверждение?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-foreground">
              Вы отменяете подтверждение расхода <strong>"{expense.name}"</strong>
            </p>

            <Alert className="border-amber-500/50 bg-amber-500/10">
              <Info className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
                Деньги будут возвращены на счёт, а связанный фактический расход будет удалён
              </AlertDescription>
            </Alert>

            <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
              {/* Информация о расходе */}
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Сумма:</span>
                  <span className="font-medium text-foreground">
                    {formatAmount(expense.planned_amount)} {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Дата:</span>
                  <span className="font-medium text-foreground">
                    {formatDate(expense.planned_date)}
                  </span>
                </div>
                {expense.category_name && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Категория:</span>
                    <span className="font-medium text-foreground">
                      {expense.category_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Что произойдёт */}
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Что произойдёт:
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Деньги вернутся на счёт</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    <span>Фактический расход будет удалён</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <ArrowRight className="h-3.5 w-3.5 text-amber-500" />
                    <span>Статус изменится на "Ожидает"</span>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isPending ? 'Отмена...' : 'Отменить подтверждение'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
