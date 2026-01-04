import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  CalendarIcon,
  Check,
  ChevronRight,
  Wallet,
  TrendingUp,
  Home,
  ShoppingBag,
  Calendar,
  Plane,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useDataStore } from '@/stores/data-store'
import {
  INCOME_SOURCE_LABELS,
  CURRENCY_SYMBOLS,
  type IncomeSource,
  type Fund,
} from '@/types'
import { cn } from '@/lib/utils'

const FUND_ICONS: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  home: Home,
  'shopping-bag': ShoppingBag,
  calendar: Calendar,
  plane: Plane,
  wallet: Wallet,
}

interface DistributionItem {
  fund: Fund
  plannedAmount: number
  actualAmount: number
  isEditing: boolean
  isCompleted: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(amount)
}

export function IncomeDistributionForm() {
  const { funds, addIncome, getTotalDistributionPercentage } = useDataStore()

  const [step, setStep] = useState<'input' | 'distribute'>('input')
  const [source, setSource] = useState<IncomeSource>('salary')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [distributions, setDistributions] = useState<DistributionItem[]>([])

  const totalPercentage = getTotalDistributionPercentage()
  const parsedAmount = parseInt(amount.replace(/\s/g, '')) || 0

  // Рассчитываем распределение при изменении суммы
  const calculatedDistributions = useMemo(() => {
    if (parsedAmount <= 0) return []

    return funds
      .filter((f) => f.status === 'active')
      .map((fund) => {
        let plannedAmount = 0
        if (fund.distributionRule.type === 'percentage' && fund.distributionRule.value) {
          plannedAmount = Math.round((parsedAmount * fund.distributionRule.value) / 100)
        } else if (fund.distributionRule.type === 'fixed' && fund.distributionRule.value) {
          plannedAmount = fund.distributionRule.value
        }
        return {
          fund,
          plannedAmount,
          actualAmount: plannedAmount,
          isEditing: false,
          isCompleted: false,
        }
      })
  }, [parsedAmount, funds])

  const totalDistributed = distributions.reduce((sum, d) => sum + d.actualAmount, 0)
  const remainingForBudget = parsedAmount - totalDistributed

  const handleAmountChange = (value: string) => {
    // Форматируем число с пробелами
    const cleanValue = value.replace(/\s/g, '').replace(/\D/g, '')
    if (cleanValue) {
      setAmount(formatMoney(parseInt(cleanValue)))
    } else {
      setAmount('')
    }
  }

  const handleProceed = () => {
    if (parsedAmount > 0) {
      setDistributions(calculatedDistributions)
      setStep('distribute')
    }
  }

  const handleEditAmount = (fundId: string, newAmount: number) => {
    setDistributions((prev) =>
      prev.map((d) =>
        d.fund.id === fundId
          ? { ...d, actualAmount: newAmount, isEditing: false }
          : d
      )
    )
  }

  const handleToggleComplete = (fundId: string) => {
    setDistributions((prev) =>
      prev.map((d) =>
        d.fund.id === fundId ? { ...d, isCompleted: !d.isCompleted } : d
      )
    )
  }

  const handleConfirm = () => {
    const income = addIncome({
      source,
      amount: parsedAmount,
      currency: 'RUB',
      date,
    })

    // Обновляем распределения с фактическими суммами
    distributions.forEach((d) => {
      if (d.isCompleted) {
        useDataStore.getState().confirmDistribution(income.id, d.fund.id, d.actualAmount)
      }
    })

    // Сброс формы
    setStep('input')
    setAmount('')
    setDistributions([])
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-primary" />
          Распределить доход
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {step === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Источник дохода */}
              <div className="space-y-2">
                <Label>Источник</Label>
                <Select value={source} onValueChange={(v) => setSource(v as IncomeSource)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INCOME_SOURCE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Сумма */}
              <div className="space-y-2">
                <Label>Сумма</Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="300 000"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pr-8 text-lg font-medium tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {CURRENCY_SYMBOLS.RUB}
                  </span>
                </div>
              </div>

              {/* Дата */}
              <div className="space-y-2">
                <Label>Дата</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Превью распределения */}
              {parsedAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-lg bg-muted/50 p-4"
                >
                  <p className="mb-2 text-sm text-muted-foreground">
                    Будет распределено ({totalPercentage}%):
                  </p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatMoney(calculatedDistributions.reduce((s, d) => s + d.plannedAmount, 0))}{' '}
                    {CURRENCY_SYMBOLS.RUB}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    На текущие расходы:{' '}
                    <span className="font-medium text-primary">
                      {formatMoney(parsedAmount - calculatedDistributions.reduce((s, d) => s + d.plannedAmount, 0))}{' '}
                      {CURRENCY_SYMBOLS.RUB}
                    </span>
                  </p>
                </motion.div>
              )}

              <Button
                onClick={handleProceed}
                disabled={parsedAmount <= 0}
                className="w-full"
              >
                Продолжить
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="distribute"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Заголовок */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {INCOME_SOURCE_LABELS[source]} • {format(new Date(date), 'd MMMM', { locale: ru })}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {formatMoney(parsedAmount)} {CURRENCY_SYMBOLS.RUB}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('input')}>
                  Изменить
                </Button>
              </div>

              <Separator />

              {/* Список фондов */}
              <div className="space-y-3">
                {distributions.map((dist, index) => {
                  const Icon = FUND_ICONS[dist.fund.icon] || Wallet
                  const percentage = dist.fund.distributionRule.value || 0

                  return (
                    <motion.div
                      key={dist.fund.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'group rounded-lg border p-4 transition-all',
                        dist.isCompleted
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border/50 bg-card/30 hover:border-border'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${dist.fund.color}20` }}
                          >
                            <Icon
                              className="h-5 w-5"
                              style={{ color: dist.fund.color }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{dist.fund.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {percentage}%
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Баланс: {formatMoney(dist.fund.currentBalance)} {CURRENCY_SYMBOLS.RUB}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {dist.isEditing ? (
                            <Input
                              type="text"
                              defaultValue={formatMoney(dist.actualAmount)}
                              className="w-32 text-right tabular-nums"
                              autoFocus
                              onBlur={(e) => {
                                const value = parseInt(e.target.value.replace(/\s/g, '')) || 0
                                handleEditAmount(dist.fund.id, value)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const value = parseInt((e.target as HTMLInputElement).value.replace(/\s/g, '')) || 0
                                  handleEditAmount(dist.fund.id, value)
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                {dist.actualAmount !== dist.plannedAmount && (
                                  <p className="text-xs text-muted-foreground line-through">
                                    {formatMoney(dist.plannedAmount)}
                                  </p>
                                )}
                                <p className="font-semibold tabular-nums">
                                  {formatMoney(dist.actualAmount)} {CURRENCY_SYMBOLS.RUB}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() =>
                                  setDistributions((prev) =>
                                    prev.map((d) =>
                                      d.fund.id === dist.fund.id
                                        ? { ...d, isEditing: true }
                                        : d
                                    )
                                  )
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Отметка о переводе */}
                      <div className="mt-3 flex items-center justify-between">
                        {dist.fund.targetAmount && (
                          <div className="flex-1 pr-4">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-muted-foreground">Цель</span>
                              <span>
                                {Math.round(
                                  ((dist.fund.currentBalance + (dist.isCompleted ? dist.actualAmount : 0)) /
                                    dist.fund.targetAmount) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                ((dist.fund.currentBalance + (dist.isCompleted ? dist.actualAmount : 0)) /
                                  dist.fund.targetAmount) *
                                100
                              }
                              className="h-1.5"
                            />
                          </div>
                        )}
                        <Button
                          variant={dist.isCompleted ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleComplete(dist.fund.id)}
                          className={cn(
                            'min-w-[120px]',
                            dist.isCompleted && 'bg-primary text-primary-foreground'
                          )}
                        >
                          {dist.isCompleted ? (
                            <>
                              <Check className="mr-1.5 h-4 w-4" />
                              Переведено
                            </>
                          ) : (
                            'Отметить'
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <Separator />

              {/* Итого */}
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Распределено в фонды</span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(totalDistributed)} {CURRENCY_SYMBOLS.RUB}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">На текущие расходы</span>
                  <span className="text-xl font-bold tabular-nums text-primary">
                    {formatMoney(remainingForBudget)} {CURRENCY_SYMBOLS.RUB}
                  </span>
                </div>
              </div>

              <Button onClick={handleConfirm} className="w-full" size="lg">
                Подтвердить распределение
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
