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
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5">
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
          style={{
            background: `linear-gradient(135deg, ${statusConfig.color} 0%, transparent 60%)`,
          }}
        />

        <CardContent className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${statusConfig.color}20` }}
              >
                <CreditCardIcon className="h-6 w-6" style={{ color: statusConfig.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className="font-semibold text-lg truncate cursor-pointer hover:text-primary transition-colors"
                    onClick={onClick}
                  >
                    {credit.name}
                  </h3>
                  <Badge variant={statusConfig.variant} className="shrink-0">
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CategoryIcon
                    code={credit.category_code}
                    color={statusConfig.color}
                    size="sm"
                  />
                  <span className="truncate">{credit.category_name}</span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress */}
          {credit.status === 'active' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Прогресс погашения</span>
                <span className="font-medium">{progressPercent.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Principal Amount */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Основной долг</span>
              </div>
              <div className="font-semibold tabular-nums">
                {formatMoney(credit.principal_amount)} ₽
              </div>
              {summary && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Осталось: {formatMoney(summary.remainingPrincipal)} ₽
                </div>
              )}
            </div>

            {/* Interest Rate */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Percent className="h-3.5 w-3.5" />
                <span>Ставка</span>
              </div>
              <div className="font-semibold">{credit.interest_rate}%</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {credit.term_months} мес.
              </div>
            </div>

            {/* Monthly Payment */}
            {summary && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Ежемесячный платёж</span>
                </div>
                <div className="font-semibold tabular-nums">
                  {formatMoney(summary.monthlyPayment)} ₽
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {credit.payment_day} число
                </div>
              </div>
            )}

            {/* Account */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Wallet className="h-3.5 w-3.5" />
                <span>Счёт списания</span>
              </div>
              <div className="font-medium truncate">{credit.account_name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                С {formatDate(credit.start_date)}
              </div>
            </div>
          </div>

          {/* Notes */}
          {credit.notes && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground line-clamp-2">{credit.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
