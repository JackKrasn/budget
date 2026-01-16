import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  X,
  Clock,
  CheckCircle,
  SkipForward,
  Banknote,
  RefreshCw,
  Calendar,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PlannedIncome, PlannedIncomeStatus } from '@/lib/api/types'

interface PlannedIncomesSectionProps {
  incomes: PlannedIncome[]
  onReceive: (id: string) => Promise<void>
  onSkip: (id: string) => Promise<void>
  onGenerate?: () => Promise<void>
  isGenerating?: boolean
  isPending?: boolean
  /** Слот для кнопки добавления */
  addButton?: React.ReactNode
  /** Скрыть обёртку Card и заголовок (для использования внутри CollapsibleSection) */
  hideWrapper?: boolean
  /** Callback при клике на доход (переход на страницу дохода) */
  onIncomeClick?: (incomeId: string) => void
}

const STATUS_CONFIG: Record<
  PlannedIncomeStatus,
  { label: string; icon: typeof Clock; color: string }
> = {
  pending: { label: 'Ожидается', icon: Clock, color: 'text-amber-500' },
  received: { label: 'Получено', icon: CheckCircle, color: 'text-emerald-500' },
  skipped: { label: 'Пропущено', icon: SkipForward, color: 'text-muted-foreground' },
}

export function PlannedIncomesSection({
  incomes,
  onReceive,
  onSkip,
  onGenerate,
  isGenerating,
  isPending,
  addButton,
  hideWrapper = false,
  onIncomeClick,
}: PlannedIncomesSectionProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    })
  }

  // Извлечь число из nullable типа бэкенда
  const getActualAmount = (
    value: number | { Float64: number; Valid: boolean } | null | undefined
  ): number | null => {
    if (value == null) return null
    if (typeof value === 'number') return value
    if (typeof value === 'object' && 'Valid' in value && value.Valid) {
      return value.Float64
    }
    return null
  }

  // Извлечь дату из nullable типа бэкенда
  const getDateString = (
    value: string | { Time: string; Valid: boolean } | null | undefined
  ): string | null => {
    if (value == null) return null
    if (typeof value === 'string') return value
    if (typeof value === 'object' && 'Valid' in value && value.Valid) {
      return value.Time
    }
    return null
  }

  const handleReceive = async (id: string) => {
    setProcessingId(id)
    try {
      await onReceive(id)
    } finally {
      setProcessingId(null)
    }
  }

  const handleSkip = async (id: string) => {
    setProcessingId(id)
    try {
      await onSkip(id)
    } finally {
      setProcessingId(null)
    }
  }

  // Группировка: pending сначала, потом received, потом skipped
  const sortedIncomes = [...incomes].sort((a, b) => {
    const statusOrder = { pending: 0, received: 1, skipped: 2 }
    const orderDiff = statusOrder[a.status] - statusOrder[b.status]
    if (orderDiff !== 0) return orderDiff
    const dateStrA = getDateString(a.expected_date)
    const dateStrB = getDateString(b.expected_date)
    const dateA = dateStrA ? new Date(dateStrA).getTime() : 0
    const dateB = dateStrB ? new Date(dateStrB).getTime() : 0
    return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB)
  })

  const pendingIncomes = incomes.filter((e) => e.status === 'pending')
  const receivedIncomes = incomes.filter((e) => e.status === 'received')
  const skippedIncomes = incomes.filter((e) => e.status === 'skipped')

  // Расчёт ожидаемых сумм по полученным доходам (для сравнения план/факт)
  const expectedFromReceived = receivedIncomes.reduce(
    (sum, e) => sum + e.expected_amount,
    0
  )
  const actualFromReceived = receivedIncomes.reduce(
    (sum, e) => sum + (getActualAmount(e.actual_amount) ?? e.expected_amount),
    0
  )

  const totals = {
    expected: incomes.reduce((sum, e) => sum + e.expected_amount, 0),
    received: actualFromReceived,
    receivedExpected: expectedFromReceived,
    pending: pendingIncomes.reduce((sum, e) => sum + e.expected_amount, 0),
    skipped: skippedIncomes.reduce((sum, e) => sum + e.expected_amount, 0),
  }

  // Разница между фактом и планом для полученных доходов
  const receivedDiff = totals.received - totals.receivedExpected
  // Процент выполнения
  const progressPercent = totals.expected > 0
    ? Math.round((totals.received / totals.expected) * 100)
    : 0

  // Контент секции
  const content = (
    <>
      {/* Сводка: прогресс и план/факт */}
      {incomes.length > 0 && (
        <div className="space-y-3 mb-4">
          {/* Прогресс-бар с refined gradient design */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Получено {formatMoney(totals.received)} ₽ из {formatMoney(totals.expected)} ₽
              </span>
              <span className="font-semibold">
                {progressPercent}%
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-[oklch(0.88_0.02_145)] to-[oklch(0.90_0.015_155)] dark:from-[oklch(0.28_0.02_145)] dark:to-[oklch(0.30_0.015_155)]">
              <div
                className="h-full transition-all duration-500 ease-out bg-gradient-to-r from-[oklch(0.72_0.14_150)] via-[oklch(0.75_0.13_155)] to-[oklch(0.78_0.12_160)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Карточки со сводкой */}
          <div className="grid grid-cols-3 gap-3">
            {/* Ожидается */}
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5 transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <Clock className="h-3 w-3" />
                Ожидается
              </div>
              <p className="text-lg font-bold tabular-nums text-muted-foreground">
                {formatMoney(totals.pending)} ₽
              </p>
            </div>

            {/* Получено */}
            <div className="rounded-xl border p-3.5 transition-all hover:scale-[1.02]" style={{
              borderColor: 'oklch(0.68 0.15 230 / 0.25)',
              backgroundColor: 'oklch(0.68 0.15 230 / 0.08)'
            }}>
              <div className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: 'oklch(0.68 0.15 230)' }}>
                <CheckCircle className="h-3 w-3" />
                Получено
              </div>
              <p className="text-lg font-bold tabular-nums">
                {formatMoney(totals.received)} ₽
              </p>
              {receivedDiff !== 0 && (
                <p className={cn(
                  'text-xs mt-0.5 flex items-center gap-0.5',
                  receivedDiff > 0 ? '' : 'text-red-500'
                )}
                style={receivedDiff > 0 ? { color: 'oklch(0.68 0.15 230)' } : undefined}>
                  {receivedDiff > 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {receivedDiff > 0 ? '+' : ''}{formatMoney(receivedDiff)} ₽ от плана
                </p>
              )}
            </div>

            {/* Пропущено */}
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5 transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <SkipForward className="h-3 w-3" />
                Пропущено
              </div>
              <p className="text-lg font-bold tabular-nums text-muted-foreground">
                {formatMoney(totals.skipped)} ₽
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Таблица или пустое состояние */}
      {incomes.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/30">
          <Calendar className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Нет запланированных доходов
          </p>
          {onGenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              Сгенерировать из шаблонов
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Источник</TableHead>
              <TableHead className="w-[100px] text-center">Дата</TableHead>
              <TableHead className="w-[140px] text-right">Сумма</TableHead>
              <TableHead className="w-[100px] text-center">Статус</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIncomes.map((income) => {
              const statusConfig = STATUS_CONFIG[income.status]
              const StatusIcon = statusConfig.icon
              const isProcessing = processingId === income.id
              const actualAmount = getActualAmount(income.actual_amount)
              const canNavigate = income.status === 'received' && income.actual_income_id && onIncomeClick

              return (
                <TableRow
                  key={income.id}
                  className={cn(
                    'group',
                    income.status === 'skipped' && 'opacity-50',
                    canNavigate && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={canNavigate ? () => onIncomeClick(income.actual_income_id!) : undefined}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'oklch(0.68 0.15 230 / 0.1)' }}>
                        <Banknote className="h-4 w-4" style={{ color: 'oklch(0.68 0.15 230)' }} />
                      </div>
                      <div>
                        <p className="font-medium">{income.source}</p>
                        {income.notes && (
                          <p className="text-xs text-muted-foreground">
                            {income.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center text-sm text-muted-foreground">
                    {formatDate(getDateString(income.expected_date))}
                  </TableCell>

                  <TableCell className="text-right">
                    {income.status === 'received' && actualAmount != null ? (
                      <div>
                        <span className="text-base font-semibold tabular-nums text-emerald-500">
                          +{formatMoney(actualAmount)} ₽
                        </span>
                        {actualAmount !== income.expected_amount && (
                          <p className={cn(
                            'text-xs mt-0.5 flex items-center justify-end gap-0.5',
                            actualAmount > income.expected_amount ? 'text-emerald-500' : 'text-red-500'
                          )}>
                            {actualAmount > income.expected_amount ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {actualAmount > income.expected_amount ? '+' : ''}
                            {formatMoney(actualAmount - income.expected_amount)} ₽
                          </p>
                        )}
                      </div>
                    ) : (
                      <span
                        className={cn(
                          'text-base font-semibold tabular-nums',
                          income.status === 'skipped'
                            ? 'text-muted-foreground line-through'
                            : 'text-muted-foreground'
                        )}
                      >
                        +{formatMoney(income.expected_amount)} ₽
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 text-xs',
                        statusConfig.color
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </div>
                  </TableCell>

                  <TableCell>
                    {income.status === 'pending' && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleReceive(income.id)}
                          disabled={isPending || isProcessing}
                          title="Отметить полученным"
                        >
                          <Check className="h-4 w-4" style={{ color: 'oklch(0.68 0.15 230)' }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleSkip(income.id)}
                          disabled={isPending || isProcessing}
                          title="Пропустить"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/50">
              <TableCell className="font-semibold text-base">Итого</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">
                <span className="tabular-nums font-semibold text-base">
                  +{formatMoney(totals.expected)} ₽
                </span>
                {receivedDiff !== 0 && (
                  <p className={cn(
                    'text-xs mt-0.5 flex items-center justify-end gap-0.5',
                    receivedDiff > 0 ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {receivedDiff > 0 ? '+' : ''}{formatMoney(receivedDiff)} ₽
                  </p>
                )}
              </TableCell>
              <TableCell className="text-center">
                <span className="text-sm font-medium">
                  {progressPercent}%
                </span>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </>
  )

  // Если hideWrapper, возвращаем только контент
  if (hideWrapper) {
    return <div>{content}</div>
  }

  // Иначе оборачиваем в Card с заголовком
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-4 w-4" style={{ color: 'oklch(0.68 0.15 230)' }} />
              Ожидаемые доходы
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                <Clock className="mr-1 h-3 w-3" />
                {pendingIncomes.length} ожидается
              </Badge>
              {addButton}
              {onGenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw
                    className={cn(
                      'mr-2 h-4 w-4',
                      isGenerating && 'animate-spin'
                    )}
                  />
                  Сгенерировать
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {content}
        </CardContent>
      </Card>
    </motion.div>
  )
}
