import { motion } from 'framer-motion'
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  CreditCard as CreditCardIcon,
  TrendingDown,
  Calendar,
  Percent,
  Wallet,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import type { CreditListRow } from '@/lib/api/credits'
import { CategoryIcon } from '@/components/common'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatInterestRate(rate: number): string {
  // Бэкенд возвращает ставку как десятичную дробь (0.03 = 3%, 0.125 = 12.5%)
  const percent = rate * 100
  return percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(2)
}

const STATUS_CONFIG = {
  active: { label: 'Активный', variant: 'default' as const, color: '#10b981' },
  completed: { label: 'Погашен', variant: 'secondary' as const, color: '#6b7280' },
  cancelled: { label: 'Отменён', variant: 'destructive' as const, color: '#ef4444' },
}

interface CreditCardProps {
  credit: CreditListRow
  summary?: {
    progressPercent: number
    remainingPrincipal: number
    monthlyPayment: number
  }
  onEdit?: () => void
  onDelete?: () => void
  onClick?: () => void
}

export function CreditCard({ credit, summary, onEdit, onDelete, onClick }: CreditCardProps) {
  const statusConfig = STATUS_CONFIG[credit.status]
  const progressPercent = summary?.progressPercent ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <Card
        className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-xl transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
        onClick={onClick}
      >
        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08]"
          style={{
            background: `radial-gradient(circle at top right, ${statusConfig.color} 0%, transparent 70%)`,
          }}
        />

        {/* Decorative accent line */}
        <div
          className="absolute left-0 top-0 h-full w-1 opacity-60 transition-all duration-300 group-hover:w-1.5 group-hover:opacity-100"
          style={{ backgroundColor: statusConfig.color }}
        />

        <CardContent className="relative p-6">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <motion.div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-black/5 transition-all duration-300 group-hover:shadow-xl"
                style={{ backgroundColor: `${statusConfig.color}15` }}
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                transition={{ duration: 0.5 }}
              >
                <CreditCardIcon className="h-7 w-7 transition-colors duration-300" style={{ color: statusConfig.color }} />
              </motion.div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-bold text-xl truncate transition-colors duration-200 group-hover:text-primary">
                    {credit.name}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusConfig.variant} className="font-medium">
                    {statusConfig.label}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CategoryIcon
                      code={credit.category_code}
                      color={statusConfig.color}
                      size="sm"
                    />
                    <span className="truncate">{credit.category_name}</span>
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-accent/80"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
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

          {/* Progress Section */}
          {credit.status === 'active' && summary && (
            <div className="mb-6 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Прогресс погашения
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{progressPercent.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Осталось</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-primary">
                    {formatMoney(summary.remainingPrincipal)} ₽
                  </p>
                </div>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-background/60">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
                />
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Principal Amount */}
            <div className="group/item rounded-lg p-3 transition-colors hover:bg-accent/50">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Основной долг</span>
              </div>
              <div className="font-bold text-lg tabular-nums">
                {formatMoney(credit.principal_amount)} ₽
              </div>
            </div>

            {/* Interest Rate */}
            <div className="group/item rounded-lg p-3 transition-colors hover:bg-accent/50">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Percent className="h-3.5 w-3.5" />
                <span>Ставка</span>
              </div>
              <div className="font-bold text-lg">{formatInterestRate(credit.interest_rate)}%</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {credit.term_months} месяцев
              </div>
            </div>

            {/* Monthly Payment */}
            {summary && (
              <div className="group/item rounded-lg p-3 transition-colors hover:bg-accent/50">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Платёж</span>
                </div>
                <div className="font-bold text-lg tabular-nums">
                  {formatMoney(summary.monthlyPayment)} ₽
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {credit.payment_day} число
                </div>
              </div>
            )}

            {/* Account */}
            <div className="group/item rounded-lg p-3 transition-colors hover:bg-accent/50">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                <span>Счёт</span>
              </div>
              <div className="font-medium truncate">{credit.account_name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                с {formatDate(credit.start_date)}
              </div>
            </div>
          </div>

          {/* Notes */}
          {credit.notes && (
            <div className="mt-5 pt-5 border-t border-border/50">
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{credit.notes}</p>
            </div>
          )}

          {/* View Details Indicator */}
          <div className="mt-5 flex items-center justify-end gap-2 text-sm font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100">
            <span>Подробнее</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
