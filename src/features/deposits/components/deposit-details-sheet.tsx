import { motion, AnimatePresence } from 'framer-motion'
import {
  Landmark,
  Calendar,
  Percent,
  Clock,
  TrendingUp,
  Wallet,
  History,
  XCircle,
  Pencil,
  Trash2,
  BadgeCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
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
import { getBankByName } from '@/lib/banks'
import { useDepositAccruals } from '../hooks'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'

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

const STATUS_CONFIG: Record<string, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  color: string
  bgColor: string
  icon: typeof CheckCircle2
}> = {
  active: {
    label: 'Активен',
    variant: 'default',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: CheckCircle2
  },
  matured: {
    label: 'Погашен',
    variant: 'secondary',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: BadgeCheck
  },
  closed_early: {
    label: 'Закрыт досрочно',
    variant: 'outline',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: AlertTriangle
  },
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24
    }
  },
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
  const StatusIcon = statusConfig.icon
  const isActive = deposit.status === 'active'
  const bank = deposit.bank ? getBankByName(deposit.bank) : undefined

  // Calculate progress
  const startDate = parseDateSafe(deposit.startDate)
  const maturityDate = parseDateSafe(deposit.maturityDate)
  const totalDays = startDate && maturityDate ? differenceInDays(maturityDate, startDate) : 0
  const passedDays = totalDays - (deposit.daysRemaining || 0)
  const termProgress = totalDays > 0 ? Math.min(100, Math.max(0, (passedDays / totalDays) * 100)) : 0

  // Calculate yield progress
  const yieldProgress = deposit.projectedYield > 0
    ? Math.min(100, (deposit.totalInterest / deposit.projectedYield) * 100)
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
      <SheetContent className="w-full sm:max-w-[560px] p-0 overflow-hidden border-l-0 bg-gradient-to-b from-background via-background to-muted/20">
        <ScrollArea className="h-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative"
          >
            {/* Hero Header with Bank Branding */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-[0.03]">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }} />
              </div>

              {/* Gradient Overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-50",
                isActive
                  ? "from-emerald-500/10 via-transparent to-transparent"
                  : deposit.status === 'matured'
                    ? "from-blue-500/10 via-transparent to-transparent"
                    : "from-amber-500/10 via-transparent to-transparent"
              )} />

              <div className="relative px-6 pt-6 pb-8">
                <SheetHeader className="space-y-0">
                  {/* Bank Logo & Status Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Bank Logo */}
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl ring-1 shadow-lg",
                          bank
                            ? "bg-white dark:bg-zinc-900 ring-border/50"
                            : "bg-gradient-to-br from-primary/15 to-primary/5 ring-primary/20"
                        )}
                      >
                        {bank ? (
                          <img
                            src={bank.logo}
                            alt={bank.name}
                            className="h-9 w-9 object-contain"
                          />
                        ) : (
                          <Landmark className="h-7 w-7 text-primary" />
                        )}
                      </motion.div>

                      {/* Bank Name or Generic Label */}
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {bank ? bank.name : deposit.bank || 'Банковский вклад'}
                        </p>
                        <SheetTitle className="text-xl font-bold tracking-tight">
                          {deposit.assetName}
                        </SheetTitle>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                        statusConfig.bgColor,
                        statusConfig.color
                      )}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </div>
                    </motion.div>
                  </div>

                  <SheetDescription className="sr-only">
                    Детальная информация о депозите {deposit.assetName}
                  </SheetDescription>
                </SheetHeader>

                {/* Main Amount Display */}
                <motion.div
                  variants={itemVariants}
                  className="mt-4"
                >
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                    Текущий баланс
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tabular-nums tracking-tight">
                      {formatAmount(deposit.currentAmount)}
                    </span>
                    <span className="text-2xl font-medium text-muted-foreground">
                      {currencySymbol}
                    </span>
                  </div>

                  {/* Interest Badge */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold tabular-nums">
                      +{formatAmount(deposit.totalInterest)} {currencySymbol}
                    </span>
                    <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                      накоплено
                    </span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            <div className="px-6 pb-6 space-y-6">
              {/* Key Metrics Cards */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-3 gap-3"
              >
                {/* Interest Rate */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 ring-1 ring-amber-500/20 transition-all hover:ring-amber-500/40">
                  <div className="absolute top-2 right-2">
                    <Percent className="h-4 w-4 text-amber-500/40" />
                  </div>
                  <p className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {formatRate(deposit.interestRate)}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">годовых</p>
                </div>

                {/* Term */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 ring-1 ring-blue-500/20 transition-all hover:ring-blue-500/40">
                  <div className="absolute top-2 right-2">
                    <Calendar className="h-4 w-4 text-blue-500/40" />
                  </div>
                  <p className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                    {deposit.termMonths}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">месяцев</p>
                </div>

                {/* Days Remaining */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-4 ring-1 ring-violet-500/20 transition-all hover:ring-violet-500/40">
                  <div className="absolute top-2 right-2">
                    <Clock className="h-4 w-4 text-violet-500/40" />
                  </div>
                  <p className="text-3xl font-bold tabular-nums text-violet-600 dark:text-violet-400">
                    {deposit.daysRemaining}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">дней</p>
                </div>
              </motion.div>

              {/* Progress Section */}
              {isActive && (
                <motion.div
                  variants={itemVariants}
                  className="space-y-4 rounded-2xl bg-muted/30 p-4 ring-1 ring-border/50"
                >
                  {/* Term Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="font-medium">Прогресс срока</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">
                        {passedDays} / {totalDays} дн.
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-primary/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${termProgress}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right tabular-nums">
                      {termProgress.toFixed(1)}% завершено
                    </p>
                  </div>

                  {/* Yield Progress */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium">Накопленный доход</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">
                        {formatAmount(deposit.totalInterest)} / {formatAmount(deposit.projectedYield)} {currencySymbol}
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-emerald-500/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${yieldProgress}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.7 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right tabular-nums">
                      {yieldProgress.toFixed(1)}% от прогноза
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Details List */}
              <motion.div variants={itemVariants} className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Параметры вклада
                </h4>

                <div className="rounded-2xl bg-card ring-1 ring-border/50 divide-y divide-border/50 overflow-hidden">
                  {/* Accrual Period */}
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <History className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm">Начисление процентов</span>
                    </div>
                    <span className="text-sm font-medium">
                      {PERIOD_LABELS[deposit.accrualPeriod]}
                    </span>
                  </div>

                  {/* Capitalization */}
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm">Капитализация</span>
                    </div>
                    <Badge variant={deposit.hasCapitalization ? 'default' : 'secondary'}>
                      {deposit.hasCapitalization ? 'Есть' : 'Нет'}
                    </Badge>
                  </div>

                  {/* Principal */}
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm">Начальная сумма</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatAmount(deposit.principalAmount)} {currencySymbol}
                    </span>
                  </div>

                  {/* Projected Yield */}
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-sm">Ожидаемый доход</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{formatAmount(deposit.projectedYield)} {currencySymbol}
                    </span>
                  </div>

                  {/* Start Date */}
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm">Дата открытия</span>
                    </div>
                    <span className="text-sm font-medium">
                      {startDate ? format(startDate, 'd MMMM yyyy', { locale: ru }) : '—'}
                    </span>
                  </div>

                  {/* Maturity Date */}
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm">Дата погашения</span>
                    </div>
                    <span className="text-sm font-medium">
                      {maturityDate ? format(maturityDate, 'd MMMM yyyy', { locale: ru }) : '—'}
                    </span>
                  </div>

                  {/* Next Accrual */}
                  {deposit.nextAccrualDate && (
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors bg-amber-500/5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                          <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                        <span className="text-sm">Следующее начисление</span>
                      </div>
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        {(() => {
                          const nextDate = parseDateSafe(deposit.nextAccrualDate)
                          return nextDate ? format(nextDate, 'd MMMM yyyy', { locale: ru }) : '—'
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Fund */}
                  {deposit.fundName && (
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm">Привязан к фонду</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{deposit.fundName}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {/* Bank (if not already shown in header) */}
                  {deposit.bank && !bank && (
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Landmark className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm">Банк</span>
                      </div>
                      <span className="text-sm font-medium">{deposit.bank}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Notes */}
              {deposit.notes && (
                <motion.div variants={itemVariants}>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Заметки
                  </h4>
                  <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {deposit.notes}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Accruals History */}
              {accruals.length > 0 && (
                <motion.div variants={itemVariants}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <History className="h-4 w-4" />
                      История начислений
                    </h4>
                    <Badge variant="outline" className="text-xs tabular-nums">
                      {accruals.length} операций
                    </Badge>
                  </div>
                  <div className="rounded-2xl ring-1 ring-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="text-xs font-semibold">Дата</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Было</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Начислено</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Стало</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {accruals.map((accrual, index) => (
                            <motion.tr
                              key={accrual.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="text-sm hover:bg-muted/20"
                            >
                              <TableCell className="py-3">
                                <div>
                                  <p className="font-medium">
                                    {(() => {
                                      const date = parseDateSafe(accrual.accrualDate)
                                      return date ? format(date, 'd MMM yyyy', { locale: ru }) : '—'
                                    })()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {ACCRUAL_TYPE_LABELS[accrual.accrualType]}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums py-3 text-muted-foreground">
                                {formatAmount(accrual.principalAtStart)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums py-3">
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <TrendingUp className="h-3 w-3" />
                                  +{formatAmount(accrual.interestAccrued)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right tabular-nums py-3 font-semibold">
                                {formatAmount(accrual.principalAtEnd)}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                variants={itemVariants}
                className="flex gap-3 pt-4"
              >
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={onEdit}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </Button>
                {isActive && onCloseEarly && (
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={onCloseEarly}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Закрыть
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
