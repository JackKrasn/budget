import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, RefreshCw, Coins, TrendingUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CategoryIcon } from '@/components/common'
import { cn } from '@/lib/utils'
import { getCurrencyConfig } from './currency-limit-badge'
import type { BudgetCurrency, BudgetItemWithCategory } from '@/lib/api/types'

const ALL_CURRENCIES: BudgetCurrency[] = ['RUB', 'USD', 'EUR', 'GEL', 'TRY', 'CNY', 'AED', 'USDT', 'BTC', 'ETH', 'TON', 'OTHER']

interface CurrencyBufferInput {
  currency: BudgetCurrency
  bufferAmount: string
  plannedAmount: number
  actualAmount: number
  isNew?: boolean
}

interface CurrencyLimitsEditorProps {
  item: BudgetItemWithCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (buffers: { currency: BudgetCurrency; bufferAmount: number }[]) => Promise<void>
  onRecalculate?: () => Promise<void>
  isPending?: boolean
}

export function CurrencyLimitsEditor({
  item,
  open,
  onOpenChange,
  onSave,
  onRecalculate,
  isPending,
}: CurrencyLimitsEditorProps) {
  const [buffers, setBuffers] = useState<CurrencyBufferInput[]>([])
  const [isRecalculating, setIsRecalculating] = useState(false)

  useEffect(() => {
    if (item?.currencyLimits && item.currencyLimits.length > 0) {
      setBuffers(
        item.currencyLimits.map((limit) => ({
          currency: limit.currency,
          bufferAmount: String(limit.bufferAmount),
          plannedAmount: limit.plannedAmount,
          actualAmount: limit.actualAmount,
        }))
      )
    } else {
      // Default to RUB if no limits exist
      setBuffers([{
        currency: 'RUB',
        bufferAmount: '',
        plannedAmount: item?.plannedExpensesSum ?? 0,
        actualAmount: item?.actualAmount ?? 0,
        isNew: true,
      }])
    }
  }, [item])

  const handleBufferChange = (index: number, value: string) => {
    const newBuffers = [...buffers]
    newBuffers[index].bufferAmount = value.replace(/[^\d]/g, '')
    setBuffers(newBuffers)
  }

  const handleAddCurrency = (currency: BudgetCurrency) => {
    if (buffers.some((b) => b.currency === currency)) return
    setBuffers([...buffers, {
      currency,
      bufferAmount: '',
      plannedAmount: 0,
      actualAmount: 0,
      isNew: true,
    }])
  }

  const handleRemoveCurrency = (index: number) => {
    const newBuffers = buffers.filter((_, i) => i !== index)
    setBuffers(newBuffers)
  }

  const handleRecalculate = async () => {
    if (!onRecalculate) return
    setIsRecalculating(true)
    try {
      await onRecalculate()
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleSubmit = async () => {
    const data = buffers
      .filter((b) => b.bufferAmount !== '' || b.plannedAmount > 0)
      .map((b) => ({
        currency: b.currency,
        bufferAmount: parseFloat(b.bufferAmount) || 0,
      }))
    await onSave(data)
    onOpenChange(false)
  }

  const usedCurrencies = new Set(buffers.map((b) => b.currency))
  const availableCurrencies = ALL_CURRENCIES.filter((c) => !usedCurrencies.has(c))

  const formatMoney = (amount: number, currency: BudgetCurrency) => {
    if (currency === 'BTC' || currency === 'ETH') {
      return amount.toLocaleString('ru-RU', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      })
    }
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Calculate totals
  const totals = buffers.reduce(
    (acc, b) => {
      const buffer = parseFloat(b.bufferAmount) || 0
      const total = b.plannedAmount + buffer
      return {
        planned: acc.planned + b.plannedAmount,
        buffer: acc.buffer + buffer,
        total: acc.total + total,
        actual: acc.actual + b.actualAmount,
      }
    },
    { planned: 0, buffer: 0, total: 0, actual: 0 }
  )

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-3">
            <CategoryIcon
              code={item.categoryCode}
              iconName={item.categoryIcon}
              color={item.categoryColor}
              size="lg"
            />
            <div>
              <span>{item.categoryName}</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                Мультивалютные лимиты
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Настройка буферов по валютам для категории {item.categoryName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Общая статистика (в базовой валюте)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Запланировано</p>
                <p className="text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {formatMoney(totals.planned, 'RUB')} ₽
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Буфер</p>
                <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  +{formatMoney(totals.buffer, 'RUB')} ₽
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Общий лимит</p>
                <p className="text-lg font-bold tabular-nums">
                  {formatMoney(totals.total, 'RUB')} ₽
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Потрачено</p>
                <p className={cn(
                  'text-lg font-bold tabular-nums',
                  totals.actual > totals.total ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                )}>
                  {formatMoney(totals.actual, 'RUB')} ₽
                </p>
              </div>
            </div>
          </motion.div>

          {/* Currency Buffers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                Буферы по валютам
              </Label>
              {onRecalculate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                  className="h-7 text-xs"
                >
                  <RefreshCw className={cn('h-3 w-3 mr-1.5', isRecalculating && 'animate-spin')} />
                  Пересчитать
                </Button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {buffers.map((buffer, index) => {
                const config = getCurrencyConfig(buffer.currency)
                const totalLimit = buffer.plannedAmount + (parseFloat(buffer.bufferAmount) || 0)
                const remaining = totalLimit - buffer.actualAmount
                const progress = totalLimit > 0 ? (buffer.actualAmount / totalLimit) * 100 : 0

                return (
                  <motion.div
                    key={buffer.currency}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    layout
                    className={cn(
                      'rounded-lg border p-3 space-y-3',
                      config.bgColor,
                      config.borderColor
                    )}
                  >
                    {/* Currency Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xl font-bold', config.color)}>
                          {config.symbol}
                        </span>
                        <div>
                          <span className="font-medium">{buffer.currency}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {Math.round(progress)}%
                          </Badge>
                        </div>
                      </div>
                      {buffers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveCurrency(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">План</p>
                        <p className="font-semibold tabular-nums">
                          {config.symbol}{formatMoney(buffer.plannedAmount, buffer.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Факт</p>
                        <p className={cn(
                          'font-semibold tabular-nums',
                          buffer.actualAmount > totalLimit && 'text-destructive'
                        )}>
                          {config.symbol}{formatMoney(buffer.actualAmount, buffer.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Остаток</p>
                        <p className={cn(
                          'font-semibold tabular-nums',
                          remaining < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                        )}>
                          {remaining >= 0 ? '+' : ''}{config.symbol}{formatMoney(remaining, buffer.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Buffer Input */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap min-w-[80px]">
                        Буфер ({config.symbol})
                      </Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={buffer.bufferAmount}
                        onChange={(e) => handleBufferChange(index, e.target.value)}
                        placeholder="0"
                        className={cn(
                          'h-8 text-right tabular-nums font-medium',
                          'bg-background/50'
                        )}
                      />
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full rounded-full bg-background/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          'h-full rounded-full',
                          progress > 100 ? 'bg-destructive' : progress > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Add Currency */}
          {availableCurrencies.length > 0 && (
            <div className="flex items-center gap-2">
              <Select onValueChange={(value) => handleAddCurrency(value as BudgetCurrency)}>
                <SelectTrigger className="w-full h-9">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="h-4 w-4" />
                    <SelectValue placeholder="Добавить валюту..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((currency) => {
                    const config = getCurrencyConfig(currency)
                    return (
                      <SelectItem key={currency} value={currency}>
                        <div className="flex items-center gap-2">
                          <span className={cn('font-bold', config.color)}>{config.symbol}</span>
                          <span>{currency}</span>
                          <span className="text-muted-foreground">— {config.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t">
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
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
