import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Calendar } from 'lucide-react'
import { format, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Budget } from '@/lib/api/types'

interface CopyBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetYear: number
  targetMonth: number
  previousBudgets: Budget[]
  onCopy: (sourceBudgetId: string) => Promise<void>
  isPending?: boolean
}

export function CopyBudgetDialog({
  open,
  onOpenChange,
  targetYear,
  targetMonth,
  previousBudgets,
  onCopy,
  isPending,
}: CopyBudgetDialogProps) {
  const targetDate = new Date(targetYear, targetMonth - 1, 1)
  const prevMonth = subMonths(targetDate, 1)

  // Найти бюджет предыдущего месяца
  const prevBudget = previousBudgets.find(
    (b) =>
      b.year === prevMonth.getFullYear() && b.month === prevMonth.getMonth() + 1
  )

  const handleCopyFromPrev = async () => {
    if (prevBudget) {
      await onCopy(prevBudget.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Скопировать бюджет
          </DialogTitle>
          <DialogDescription>
            Скопируйте план расходов из предыдущего месяца в{' '}
            <span className="font-medium capitalize">
              {format(targetDate, 'LLLL yyyy', { locale: ru })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {prevBudget ? (
            <button
              onClick={handleCopyFromPrev}
              disabled={isPending}
              className="flex w-full items-center gap-4 rounded-lg border border-border/50 bg-card p-4 text-left transition-all hover:border-border hover:bg-muted/50 disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium capitalize">
                  {format(prevMonth, 'LLLL yyyy', { locale: ru })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Всего запланировано:{' '}
                  {prevBudget.total_planned.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </button>
          ) : (
            <div className="rounded-lg border border-dashed border-border/50 bg-muted/30 p-6 text-center">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">Нет бюджета за прошлый месяц</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Создайте план с нуля или скопируйте из другого месяца
              </p>
            </div>
          )}

          {previousBudgets.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Другие месяцы
              </p>
              {previousBudgets
                .filter((b) => b.id !== prevBudget?.id)
                .slice(0, 3)
                .map((budget) => {
                  const budgetDate = new Date(budget.year, budget.month - 1, 1)
                  return (
                    <button
                      key={budget.id}
                      onClick={() => onCopy(budget.id)}
                      disabled={isPending}
                      className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3 text-left transition-all hover:border-border hover:bg-muted/50 disabled:opacity-50"
                    >
                      <span className="capitalize">
                        {format(budgetDate, 'LLLL yyyy', { locale: ru })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {budget.total_planned.toLocaleString('ru-RU')} ₽
                      </span>
                    </button>
                  )
                })}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
