import { motion, AnimatePresence } from 'framer-motion'
import {
  Landmark,
  Calendar,
  Percent,
  Clock,
  TrendingUp,
  ArrowRight,
  Wallet,
  History,
  XCircle,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Deposit, DepositAccrual } from '@/lib/api'
import { useDepositAccruals } from '../hooks'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

// Helper to parse dates that may come as string or { Time: string; Valid: boolean }
function parseDateSafe(dateValue: string | { Time: string; Valid: boolean } | null | undefined): Date | null {
  if (!dateValue) return null
  if (typeof dateValue === 'string') {
    return parseISO(dateValue)
  }
  if (typeof dateValue === 'object' && 'Time' in dateValue && dateValue.Valid) {
    return parseISO(dateValue.Time)
  }
  return null
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Активен', variant: 'default' },
  matured: { label: 'Погашен', variant: 'secondary' },
  closed_early: { label: 'Закрыт досрочно', variant: 'outline' },
}

const PERIOD_LABELS: Record<string, string> = {
  monthly: 'Ежемесячно',
  quarterly: 'Ежеквартально',
  annually: 'Ежегодно',
  at_maturity: 'В конце срока',
}

const ACCRUAL_TYPE_LABELS: Record<string, string> = {
  regular: 'Регулярное',
  early_closure: 'Досрочное закрытие',
  maturity: 'При погашении',
}

interface DepositDetailsSheetProps {
  deposit: Deposit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
  onCloseEarly?: () => void
}

export function DepositDetailsSheet({
  deposit,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onCloseEarly,
}: DepositDetailsSheetProps) {
  const { data: accrualsData } = useDepositAccruals(
    deposit?.id || ''
  )

  if (!deposit) return null

  const currencySymbol = CURRENCY_SYMBOLS[deposit.currency] || deposit.currency
  const statusConfig = STATUS_CONFIG[deposit.status] || STATUS_CONFIG.active
  const isActive = deposit.status === 'active'

  // Calculate progress
  const startDate = parseDateSafe(deposit.startDate)
  const maturityDate = parseDateSafe(deposit.maturityDate)
  const totalDays = startDate && maturityDate ? differenceInDays(maturityDate, startDate) : 0
  const passedDays = totalDays - (deposit.daysRemaining || 0)
  const termProgress = totalDays > 0 ? Math.min(100, Math.max(0, (passedDays / totalDays) * 100)) : 0

  // Calculate yield progress
  const yieldProgress = deposit.projectedYield > 0
    ? (deposit.totalInterest / deposit.projectedYield) * 100
    : 0

  const formatAmount = (amount: number | undefined | null) => {
    if (amount == null) return '0.00'
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatRate = (rate: number | undefined | null) => {
    if (rate == null) return '—'
    return `${(rate * 100).toFixed(2)}%`
  }

  const accruals: DepositAccrual[] = accrualsData?.data || []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[540px] p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            <SheetHeader className="pb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
                    <Landmark className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{deposit.assetName}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      {deposit.fundName && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span>{deposit.fundName}</span>
                        </>
                      )}
                    </SheetDescription>
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* Main Amount Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 ring-1 ring-primary/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Текущая сумма
                  </p>
                  <p className="text-3xl font-bold tabular-nums mt-1">
                    {formatAmount(deposit.currentAmount)}
                    <span className="ml-2 text-xl text-muted-foreground">{currencySymbol}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-500">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xl font-bold tabular-nums">
                      +{formatAmount(deposit.totalInterest)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">накоплено</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">Начальная сумма:</span>
                <span className="font-medium tabular-nums">
                  {formatAmount(deposit.principalAmount)} {currencySymbol}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{formatAmount(deposit.projectedYield)} {currencySymbol}
                </span>
                <span className="text-muted-foreground">прогноз</span>
              </div>
            </motion.div>

            {/* Progress Section */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Прогресс срока</span>
                    </div>
                    <span className="font-medium tabular-nums">
                      {passedDays} из {totalDays} дней ({termProgress.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={termProgress} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span>Доходность</span>
                    </div>
                    <span className="font-medium tabular-nums">
                      {formatAmount(deposit.totalInterest)} из {formatAmount(deposit.projectedYield)} {currencySymbol} ({yieldProgress.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={yieldProgress} className="h-2 [&>div]:bg-emerald-500" />
                </div>
              </motion.div>
            )}

            <Separator className="my-6" />

            {/* Details Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Percent className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Ставка</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{formatRate(deposit.interestRate)}</p>
                <p className="text-xs text-muted-foreground">годовых</p>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Срок</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{deposit.termMonths}</p>
                <p className="text-xs text-muted-foreground">месяцев</p>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <History className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Начисление</span>
                </div>
                <p className="text-lg font-semibold">{PERIOD_LABELS[deposit.accrualPeriod]}</p>
                <p className="text-xs text-muted-foreground">
                  {deposit.hasCapitalization ? 'с капитализацией' : 'без капитализации'}
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">До погашения</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{deposit.daysRemaining}</p>
                <p className="text-xs text-muted-foreground">дней</p>
              </div>
            </motion.div>

            {/* Dates */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 space-y-3"
            >
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Дата открытия</span>
                <span className="text-sm font-medium">
                  {startDate ? format(startDate, 'd MMMM yyyy', { locale: ru }) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Дата погашения</span>
                <span className="text-sm font-medium">
                  {maturityDate ? format(maturityDate, 'd MMMM yyyy', { locale: ru }) : '—'}
                </span>
              </div>
              {deposit.nextAccrualDate && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Следующее начисление</span>
                  <span className="text-sm font-medium">
                    {(() => {
                      const nextDate = parseDateSafe(deposit.nextAccrualDate)
                      return nextDate ? format(nextDate, 'd MMMM yyyy', { locale: ru }) : '—'
                    })()}
                  </span>
                </div>
              )}
              {deposit.fundName && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Привязан к фонду</span>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{deposit.fundName}</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Notes */}
            {deposit.notes && (
              <>
                <Separator className="my-6" />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  <h4 className="text-sm font-medium mb-2">Заметки</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {deposit.notes}
                  </p>
                </motion.div>
              </>
            )}

            {/* Accruals History */}
            {accruals.length > 0 && (
              <>
                <Separator className="my-6" />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    История начислений
                  </h4>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Дата</TableHead>
                          <TableHead className="text-xs text-right">Сумма до</TableHead>
                          <TableHead className="text-xs text-right">Проценты</TableHead>
                          <TableHead className="text-xs text-right">Сумма после</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {accruals.map((accrual, index) => (
                            <motion.tr
                              key={accrual.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="text-sm"
                            >
                              <TableCell className="py-2">
                                <div>
                                  <p className="font-medium">
                                    {(() => {
                                      const date = parseDateSafe(accrual.accrualDate)
                                      return date ? format(date, 'd MMM', { locale: ru }) : '—'
                                    })()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {ACCRUAL_TYPE_LABELS[accrual.accrualType]}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums py-2">
                                {formatAmount(accrual.principalAtStart)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums py-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                +{formatAmount(accrual.interestAccrued)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums py-2 font-medium">
                                {formatAmount(accrual.principalAtEnd)}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>
              </>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3 mt-8 pt-6 border-t"
            >
              <Button
                variant="outline"
                className="flex-1"
                onClick={onEdit}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
              {isActive && onCloseEarly && (
                <Button
                  variant="outline"
                  onClick={onCloseEarly}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Закрыть досрочно
                </Button>
              )}
              <Button
                variant="destructive"
                size="icon"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
