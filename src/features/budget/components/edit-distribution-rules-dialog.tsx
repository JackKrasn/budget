import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FundIcon } from '@/components/common/category-icon'
import type { FundDistributionSummary, DistributionRule } from '@/lib/api/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { distributionRulesApi } from '@/lib/api'
import { toast } from 'sonner'

interface EditDistributionRulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fundDistributions: FundDistributionSummary[]
  totalIncome: number
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function EditDistributionRulesDialog({
  open,
  onOpenChange,
  fundDistributions,
  totalIncome,
}: EditDistributionRulesDialogProps) {
  const [percentages, setPercentages] = useState<Record<string, number>>({})
  const queryClient = useQueryClient()

  const { data: rulesData } = useQuery({
    queryKey: ['distribution-rules'],
    queryFn: () => distributionRulesApi.list(),
    enabled: open,
  })

  const updateRule = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { value: number } }) =>
      distributionRulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution-rules'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  const rules = rulesData?.data ?? []

  useEffect(() => {
    if (open && rules.length > 0) {
      const initial: Record<string, number> = {}
      rules.forEach((rule: DistributionRule) => {
        initial[rule.fund_id] = rule.value ?? 0
      })
      setPercentages(initial)
    }
  }, [open, rules])

  const totalPercentage = Object.values(percentages).reduce(
    (sum, p) => sum + (p || 0),
    0
  )

  const remainingPercentage = 100 - totalPercentage
  const isValid = totalPercentage <= 100

  const handlePercentChange = (fundId: string, value: string) => {
    const percent = parseFloat(value) || 0
    setPercentages((prev) => ({
      ...prev,
      [fundId]: percent,
    }))
  }

  const handleSave = async () => {
    try {
      // Обновляем правила распределения
      for (const rule of rules) {
        const newPercent = percentages[rule.fund_id]
        if (newPercent !== undefined && newPercent !== rule.value) {
          await updateRule.mutateAsync({
            id: rule.id,
            data: {
              value: newPercent,
            },
          })
        }
      }
      toast.success('Правила распределения обновлены')
      onOpenChange(false)
    } catch (error) {
      // Error handled in hook
    }
  }

  // Группируем фонды с их правилами
  const fundsWithRules = fundDistributions.map((fund) => {
    const rule = rules.find((r) => r.fund_id === fund.fundId)
    const percentage = percentages[fund.fundId] || 0
    const plannedAmount = Math.round((totalIncome * percentage) / 100)

    return {
      ...fund,
      rule,
      percentage,
      plannedAmount,
    }
  })

  const totalPlannedAmount = fundsWithRules.reduce(
    (sum, f) => sum + f.plannedAmount,
    0
  )
  const remainingForBudget = totalIncome - totalPlannedAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настроить правила распределения</DialogTitle>
          <DialogDescription>
            Установите процент от дохода для каждого фонда. Эти правила будут
            применяться ко всем новым доходам автоматически.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Общий %</p>
                <p
                  className={`text-lg font-semibold tabular-nums ${
                    totalPercentage > 100
                      ? 'text-destructive'
                      : totalPercentage === 100
                        ? 'text-emerald-500'
                        : 'text-foreground'
                  }`}
                >
                  {totalPercentage.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">В фонды (пример)</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatMoney(totalPlannedAmount)} ₽
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">На расходы (пример)</p>
                <p className="text-lg font-semibold tabular-nums text-cyan-500">
                  {formatMoney(remainingForBudget)} ₽
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Пример расчёта для дохода {formatMoney(totalIncome)} ₽
            </p>
          </div>

          {/* Warning if over 100% */}
          {!isValid && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">
                Общий процент не может превышать 100%. Сейчас: {totalPercentage.toFixed(1)}%
              </p>
            </div>
          )}

          {remainingPercentage > 0 && remainingPercentage < 100 && (
            <div className="rounded-lg border border-border bg-muted/50 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Остаток {remainingPercentage.toFixed(1)}% будет доступен на текущие расходы
              </p>
            </div>
          )}

          {/* Fund Rules Inputs */}
          <div className="space-y-3">
            {fundsWithRules.map((fund) => (
              <div
                key={fund.fundId}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FundIcon
                      name={fund.fundName}
                      color={fund.fundColor}
                      size="sm"
                    />
                    <span className="font-medium">{fund.fundName}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ≈ {formatMoney(fund.plannedAmount)} ₽
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={fund.percentage}
                    onChange={(e) =>
                      handlePercentChange(fund.fundId, e.target.value)
                    }
                    min={0}
                    max={100}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-6">%</span>
                </div>
              </div>
            ))}
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
            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              disabled={!isValid || updateRule.isPending}
            >
              {updateRule.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
