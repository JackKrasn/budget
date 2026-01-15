import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FundIcon } from '@/components/common/category-icon'
import { useFunds } from '@/features/funds'
import type { IncomeDistribution } from '@/lib/api/types'

interface AddDistributionDialogProps {
  incomeAmount: number
  existingDistributions: IncomeDistribution[]
  onAdd: (fundId: string, plannedAmount: number) => void
  isAdding?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

type InputMode = 'amount' | 'percent'

export function AddDistributionDialog({
  incomeAmount,
  existingDistributions,
  onAdd,
  isAdding,
}: AddDistributionDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFundId, setSelectedFundId] = useState('')
  const [inputMode, setInputMode] = useState<InputMode>('amount')
  const [plannedAmount, setPlannedAmount] = useState(0)
  const [percentValue, setPercentValue] = useState(0)

  const { data: fundsData } = useFunds()
  const funds = fundsData?.data ?? []

  // Фильтруем фонды, для которых уже есть распределение
  const existingFundIds = new Set(existingDistributions.map((d) => d.fund_id))
  const availableFunds = funds.filter((f) => !existingFundIds.has(f.fund.id))

  const selectedFund = funds.find((f) => f.fund.id === selectedFundId)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedFundId('')
      setPlannedAmount(0)
      setPercentValue(0)
      setInputMode('amount')
    }
  }, [open])

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
    if (!selectedFundId || plannedAmount <= 0) return
    onAdd(selectedFundId, plannedAmount)
    setOpen(false)
  }

  const isValid = selectedFundId && plannedAmount > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Добавить фонд
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить распределение в фонд</DialogTitle>
          <DialogDescription>
            Выберите фонд и укажите сумму для распределения из этого дохода
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fund selector */}
          <div className="space-y-2">
            <Label htmlFor="fund">Фонд</Label>
            {availableFunds.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Все фонды уже добавлены в распределение
              </p>
            ) : (
              <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите фонд" />
                </SelectTrigger>
                <SelectContent>
                  {availableFunds.map((fundBalance) => (
                    <SelectItem key={fundBalance.fund.id} value={fundBalance.fund.id}>
                      <div className="flex items-center gap-2">
                        <FundIcon
                          name={fundBalance.fund.name}
                          color={fundBalance.fund.color}
                          size="sm"
                        />
                        <span>{fundBalance.fund.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected fund info */}
          {selectedFund && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FundIcon
                name={selectedFund.fund.name}
                color={selectedFund.fund.color}
                size="md"
              />
              <div>
                <p className="font-medium">{selectedFund.fund.name}</p>
                <p className="text-sm text-muted-foreground">
                  Текущий баланс: {formatMoney(selectedFund.totalBase)} ₽
                </p>
              </div>
            </div>
          )}

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
              <Label htmlFor="plannedAmount">Сумма</Label>
              <div className="relative">
                <Input
                  id="plannedAmount"
                  type="number"
                  placeholder="0"
                  value={plannedAmount || ''}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  min={1}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₽
                </span>
              </div>
              {plannedAmount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Это составит <span className="font-medium text-foreground">{percentValue}%</span> от дохода
                </p>
              )}
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
              {percentValue > 0 && (
                <p className="text-sm text-muted-foreground">
                  Это составит <span className="font-medium text-foreground">{formatMoney(plannedAmount)} ₽</span>
                </p>
              )}
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
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isValid || isAdding || availableFunds.length === 0}
            >
              {isAdding ? 'Добавление...' : 'Добавить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
