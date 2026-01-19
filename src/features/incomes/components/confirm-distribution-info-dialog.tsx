import { Info, Wallet, PiggyBank, ArrowDown } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useAccount } from '@/features/accounts'
import { useFund } from '@/features/funds'

interface ConfirmDistributionInfoDialogProps {
  accountId: string
  fundId: string
  accountName: string
  fundName: string
  amount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function ConfirmDistributionInfoDialog({
  accountId,
  fundId,
  accountName,
  fundName,
  amount,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmDistributionInfoDialogProps) {
  // Fetch account and fund data
  const { data: accountData, isLoading: isLoadingAccount } = useAccount(accountId)
  const { data: fundData, isLoading: isLoadingFund } = useFund(fundId)

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  // Calculate balances
  const accountBalanceBefore = accountData?.current_balance ?? 0
  const accountBalanceAfter = accountBalanceBefore - amount

  const fundBalanceBefore = fundData?.fund ? fundData.totalBase : 0
  const fundBalanceAfter = fundBalanceBefore + amount

  const isLoading = isLoadingAccount || isLoadingFund

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <Info className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <DialogTitle>Подтверждение распределения</DialogTitle>
              <DialogDescription>
                Средства будут переведены со счёта в фонд
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Amount Display */}
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Сумма операции</p>
            <p className="text-4xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {formatMoney(amount)} ₽
            </p>
          </div>
        </div>

        <div className="space-y-3 py-2">
          {/* Account (Source) */}
          <Card className="border-rose-200 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/50 to-transparent dark:from-rose-950/20 dark:to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                  <Wallet className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">
                    Списание
                  </p>
                  <p className="font-semibold truncate">
                    {accountName}
                  </p>
                </div>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Остаток до перечисления:</span>
                    <span className="font-medium tabular-nums">{formatMoney(accountBalanceBefore)} ₽</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Остаток после перечисления:</span>
                    <span className="font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                      {formatMoney(accountBalanceAfter)} ₽
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flow Arrow */}
          <div className="flex justify-center -my-1">
            <div className="flex flex-col items-center">
              <div className="h-6 w-0.5 bg-gradient-to-b from-rose-300 to-blue-400 dark:from-rose-700 dark:to-blue-600" />
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 shadow-sm">
                <ArrowDown className="h-4 w-4 text-white animate-bounce" />
              </div>
              <div className="h-6 w-0.5 bg-gradient-to-b from-blue-400 to-emerald-300 dark:from-blue-600 dark:to-emerald-700" />
            </div>
          </div>

          {/* Fund (Destination) */}
          <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <PiggyBank className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                    Зачисление
                  </p>
                  <p className="font-semibold truncate">
                    {fundName}
                  </p>
                </div>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Остаток до перечисления:</span>
                    <span className="font-medium tabular-nums">{formatMoney(fundBalanceBefore)} ₽</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Остаток после перечисления:</span>
                    <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatMoney(fundBalanceAfter)} ₽
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleConfirm}>
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
