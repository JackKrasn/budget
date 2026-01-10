import { motion } from 'framer-motion'
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  CreditCard as CreditCardIcon,
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
import type { CreditListRow } from '@/lib/api/credits'

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-md"
        onClick={onClick}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${statusConfig.color}20` }}
              >
                <CreditCardIcon className="h-5 w-5" style={{ color: statusConfig.color }} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base truncate mb-1">
                  {credit.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig.variant} className="text-xs">
                    {statusConfig.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate">
                    {credit.category_name}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
            <div className="mb-4 rounded-lg bg-muted/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Прогресс погашения</p>
                  <p className="text-xl font-bold tabular-nums">{progressPercent.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Осталось</p>
                  <p className="text-base font-semibold tabular-nums">
                    {formatMoney(summary.remainingPrincipal)} ₽
                  </p>
                </div>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-background/60">
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
          <div className="grid grid-cols-2 gap-3">
            {/* Principal Amount */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Основной долг</p>
              <p className="font-semibold tabular-nums">
                {formatMoney(credit.principal_amount)} ₽
              </p>
            </div>

            {/* Interest Rate */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ставка</p>
              <p className="font-semibold">{formatInterestRate(credit.interest_rate)}%</p>
              <p className="text-xs text-muted-foreground">
                {credit.term_months} мес
              </p>
            </div>

            {/* Monthly Payment */}
            {summary && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Ежемесячный платёж</p>
                <p className="font-semibold tabular-nums">
                  {formatMoney(summary.monthlyPayment)} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  {credit.payment_day} число
                </p>
              </div>
            )}

            {/* Account */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Счёт</p>
              <p className="font-medium text-sm truncate">{credit.account_name}</p>
              <p className="text-xs text-muted-foreground">
                с {formatDate(credit.start_date)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {credit.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground line-clamp-2">{credit.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
