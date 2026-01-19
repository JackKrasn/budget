import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FundIcon } from '@/components/common/category-icon'
import type { IncomeDistribution } from '@/lib/api/types'

interface EditDistributionDialogProps {
  distribution: IncomeDistribution | null
  incomeAmount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (plannedAmount: number) => void
  isSaving?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

type InputMode = 'amount' | 'percent'

export function EditDistributionDialog({
  distribution,
  incomeAmount,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: EditDistributionDialogProps) {
  const [inputMode, setInputMode] = useState<InputMode>('amount')
  const [plannedAmount, setPlannedAmount] = useState(0)
  const [percentValue, setPercentValue] = useState(0)

  useEffect(() => {
    if (distribution && open) {
      setPlannedAmount(distribution.planned_amount)
      setPercentValue(
        incomeAmount > 0
          ? Math.round((distribution.planned_amount / incomeAmount) * 100 * 10) / 10
          : 0
      )
      setInputMode('amount')
    }
  }, [distribution, open, incomeAmount])

  const handleAmountChange = (value: number) => {
    setPlannedAmount(value)
    if (incomeAmount > 0) {
      setPercentValue(Math.round((value / incomeAmount) * 100 * 10) / 10)
    }
  }

  const handlePercentChange = (value: number) => {
    setPercentValue(value)
    setPlannedAmount(Math.round((value / 100) * incomeAmount))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(plannedAmount)
  }

  if (!distribution) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Изменить распределение</DialogTitle>
          <DialogDescription>
            Измените плановую сумму распределения в фонд для этого дохода
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fund info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <FundIcon
              name={distribution.fund_name}
              color={distribution.fund_color}
              size="md"
            />
            <div>
              <p className="font-medium">{distribution.fund_name}</p>
              <p className="text-sm text-muted-foreground">
                Текущий план: {formatMoney(distribution.planned_amount)} ₽
              </p>
            </div>
          </div>

          {/* Input mode toggle */}
          <div className="space-y-2">
            <Label>Способ ввода</Label>
            <ToggleGroup
              type="single"
              value={inputMode}
              onValueChange={(value) => value && setInputMode(value as InputMode)}
              className="justify-start"
            >
              <ToggleGroupItem value="amount" aria-label="Сумма">
                Сумма ₽
              </ToggleGroupItem>
              <ToggleGroupItem value="percent" aria-label="Процент">
                Процент %
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Amount/Percent field */}
          {inputMode === 'amount' ? (
            <div className="space-y-2">
              <Label htmlFor="plannedAmount">Новая сумма</Label>
              <div className="relative">
                <Input
                  id="plannedAmount"
                  type="number"
                  placeholder="0"
                  value={plannedAmount || ''}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  min={0}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₽
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Это составит <span className="font-medium text-foreground">{percentValue}%</span> от дохода
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="percentValue">Процент от дохода</Label>
              <div className="relative">
                <Input
                  id="percentValue"
                  type="number"
                  placeholder="0"
                  value={percentValue || ''}
                  onChange={(e) => handlePercentChange(Number(e.target.value))}
                  min={0}
                  max={100}
                  step={0.1}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Это составит <span className="font-medium text-foreground">{formatMoney(plannedAmount)} ₽</span>
              </p>
            </div>
          )}

          {/* Income info */}
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
            Сумма дохода: {formatMoney(incomeAmount)} ₽
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
