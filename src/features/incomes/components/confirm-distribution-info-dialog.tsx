import { Info, Wallet, PiggyBank, ArrowRight } from 'lucide-react'
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

interface ConfirmDistributionInfoDialogProps {
  accountName: string
  fundName: string
  amount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ConfirmDistributionInfoDialog({
  accountName,
  fundName,
  amount,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmDistributionInfoDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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

        <div className="space-y-4">
          {/* Amount */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Сумма распределения</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatMoney(amount)} ₽
              </p>
            </CardContent>
          </Card>

          {/* Account (from) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Счёт списания</h4>
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{accountName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Средства будут списаны с этого счёта
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                      -{formatMoney(amount)} ₽
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transfer arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Fund (to) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Фонд зачисления</h4>
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{fundName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Средства будут зачислены в этот фонд
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatMoney(amount)} ₽
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleConfirm}>
            Подтвердить распределение
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
