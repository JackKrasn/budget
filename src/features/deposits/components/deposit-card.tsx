import { motion } from 'framer-motion'
import {
  Landmark,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  TrendingUp,
  Calendar,
  Percent,
  XCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Deposit } from '@/lib/api'
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
  monthly: 'ежемесячно',
  quarterly: 'ежеквартально',
  annually: 'ежегодно',
  at_maturity: 'в конце срока',
}

interface DepositCardProps {
  deposit: Deposit
  onEdit?: () => void
  onDelete?: () => void
  onCloseEarly?: () => void
  onClick?: () => void
}

export function DepositCard({
  deposit,
  onEdit,
  onDelete,
  onCloseEarly,
  onClick,
}: DepositCardProps) {
  const currencySymbol = CURRENCY_SYMBOLS[deposit.currency] || deposit.currency
  const statusConfig = STATUS_CONFIG[deposit.status] || STATUS_CONFIG.active

  // Calculate progress
  const startDate = parseDateSafe(deposit.startDate)
  const maturityDate = parseDateSafe(deposit.maturityDate)
  const totalDays = startDate && maturityDate ? differenceInDays(maturityDate, startDate) : 0
  const passedDays = totalDays - (deposit.daysRemaining || 0)
  const progress = totalDays > 0 ? Math.min(100, Math.max(0, (passedDays / totalDays) * 100)) : 0

  // Format rate as percentage
  const formatRate = (rate: number | undefined | null) => {
    if (rate == null) return '—'
    return `${(rate * 100).toFixed(2)}%`
  }

  // Format currency amount
  const formatAmount = (amount: number | undefined | null) => {
    if (amount == null) return '0.00'
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const isActive = deposit.status === 'active'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card
        className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
        onClick={onClick}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-amber-500/[0.02] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Status indicator bar */}
        <div
          className={`absolute left-0 top-0 h-1 w-full transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500'
              : deposit.status === 'matured'
              ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500'
          }`}
        />

        <CardContent className="relative p-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold tracking-tight leading-none">
                  {deposit.assetName}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig.variant} className="text-[10px] font-medium">
                    {statusConfig.label}
                  </Badge>
                  {deposit.fundName && (
                    <span className="text-xs text-muted-foreground">
                      {deposit.fundName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
                {isActive && onCloseEarly && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCloseEarly(); }}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Закрыть досрочно
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Amount Display */}
          <div className="mb-4 rounded-xl bg-gradient-to-br from-background/80 to-background/40 p-4 ring-1 ring-border/50">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Текущая сумма
                </p>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {formatAmount(deposit.currentAmount)}
                  <span className="ml-1 text-lg text-muted-foreground">{currencySymbol}</span>
                </p>
              </div>
              <div className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-emerald-500">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          +{formatAmount(deposit.totalInterest)} {currencySymbol}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Накопленные проценты</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <p className="text-xs text-muted-foreground mt-0.5">
                  из {formatAmount(deposit.principalAmount)} {currencySymbol}
                </p>
              </div>
            </div>
          </div>

          {/* Rate and Terms */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-background/50 p-2.5 text-center ring-1 ring-border/30">
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                <Percent className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-bold tabular-nums">{formatRate(deposit.interestRate)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">годовых</p>
            </div>
            <div className="rounded-lg bg-background/50 p-2.5 text-center ring-1 ring-border/30">
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-bold tabular-nums">{deposit.termMonths}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">мес.</p>
            </div>
            <div className="rounded-lg bg-background/50 p-2.5 text-center ring-1 ring-border/30">
              <div className="flex items-center justify-center gap-1 text-violet-500 mb-1">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-bold tabular-nums">{deposit.daysRemaining}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">дней</p>
            </div>
          </div>

          {/* Progress with Yield */}
          {isActive && (
            <div className="mb-4 space-y-3">
              {/* Term Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Срок</span>
                  <span className="font-medium tabular-nums">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              {/* Yield Progress */}
              {deposit.projectedYield > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Доход</span>
                    <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatAmount(deposit.totalInterest)} / {formatAmount(deposit.projectedYield)} {currencySymbol}
                    </span>
                  </div>
                  <Progress
                    value={deposit.projectedYield > 0 ? (deposit.totalInterest / deposit.projectedYield) * 100 : 0}
                    className="h-1.5 [&>div]:bg-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer Details */}
          <div className="flex items-center justify-between border-t border-border/30 pt-3 text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>
                {PERIOD_LABELS[deposit.accrualPeriod]}
                {deposit.hasCapitalization && ', с капит.'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>до {maturityDate ? format(maturityDate, 'd MMM yyyy', { locale: ru }) : '—'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
