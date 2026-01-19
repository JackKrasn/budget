import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  TrendingDown,
  Percent,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Pencil,
  PiggyBank,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  useCredit,
  useCreditSummary,
  useCreditPayments,
  useEarlyPayments,
  useDeleteEarlyPayment,
  useRegenerateCreditSchedule,
} from '@/features/credits'
import {
  ConfirmPaymentDialog,
  EarlyPaymentDialog,
  EditScheduleItemDialog,
} from '@/features/credits/components'
import type { ScheduleItem, PaymentHistoryItem, EarlyPayment } from '@/lib/api/credits'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
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

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduleTable({
  schedule,
  onConfirmPayment,
  onEditPayment,
}: {
  schedule: ScheduleItem[]
  onConfirmPayment: (item: ScheduleItem) => void
  onEditPayment: (item: ScheduleItem) => void
}) {
  return (
    <TooltipProvider>
      <div className="border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 hover:bg-transparent">
              <TableHead className="w-[80px] font-bold">#</TableHead>
              <TableHead className="font-bold">Дата</TableHead>
              <TableHead className="text-right font-bold">Основной долг</TableHead>
              <TableHead className="text-right font-bold">Проценты</TableHead>
              <TableHead className="text-right font-bold">Всего</TableHead>
              <TableHead className="text-right font-bold">Остаток</TableHead>
              <TableHead className="w-[180px] text-center font-bold">Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((item, index) => (
              <TableRow
                key={item.id}
                className={cn(
                  'transition-all duration-200',
                  item.isPaid
                    ? 'opacity-50 bg-muted/30'
                    : 'hover:bg-accent/50',
                  index === 0 && !item.isPaid && 'bg-primary/5'
                )}
              >
                <TableCell className="font-bold text-base">
                  <span className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    item.isPaid ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                  )}>
                    {item.paymentNumber}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{formatDate(item.dueDate)}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatMoney(item.principalPart)} ₽
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium text-muted-foreground">
                  {formatMoney(item.interestPart)} ₽
                </TableCell>
                <TableCell className="text-right tabular-nums font-bold text-base">
                  <div className="flex items-center justify-end gap-1">
                    {formatMoney(item.totalPayment)} ₽
                    {item.isManual && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Pencil className="h-3 w-3 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Изменён вручную</p>
                          {item.originalTotalPayment && (
                            <p className="text-xs text-muted-foreground">
                              Было: {formatMoney(item.originalTotalPayment)} ₽
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                  {formatMoney(item.remainingBalance)} ₽
                </TableCell>
                <TableCell className="text-center">
                  {item.isPaid ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Оплачен</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditPayment(item)}
                        className="h-9 w-9 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={index === 0 ? 'default' : 'outline'}
                        onClick={() => onConfirmPayment(item)}
                        className="h-9 font-medium"
                      >
                        {index === 0 ? 'Оплатить' : 'Оплатить'}
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}

function PaymentsTable({ payments }: { payments: PaymentHistoryItem[] }) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b-2 hover:bg-transparent">
            <TableHead className="w-[80px] font-bold">#</TableHead>
            <TableHead className="font-bold">Дата платежа</TableHead>
            <TableHead className="font-bold">Дата по плану</TableHead>
            <TableHead className="text-right font-bold">Основной долг</TableHead>
            <TableHead className="text-right font-bold">Проценты</TableHead>
            <TableHead className="text-right font-bold">Всего</TableHead>
            <TableHead className="w-[110px] font-bold">Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="hover:bg-accent/50 transition-colors">
              <TableCell className="font-bold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                  {payment.paymentNumber}
                </span>
              </TableCell>
              <TableCell className="font-semibold">{formatDate(payment.paymentDate)}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(payment.dueDate)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatMoney(payment.principalPaid)} ₽
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium text-muted-foreground">
                {formatMoney(payment.interestPaid)} ₽
              </TableCell>
              <TableCell className="text-right tabular-nums font-bold text-base">
                {formatMoney(payment.totalPaid)} ₽
              </TableCell>
              <TableCell>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Оплачен</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function EarlyPaymentsTable({
  earlyPayments,
  onDelete,
  isDeleting,
}: {
  earlyPayments: EarlyPayment[]
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b-2 hover:bg-transparent">
            <TableHead className="font-bold">Дата</TableHead>
            <TableHead className="text-right font-bold">Сумма</TableHead>
            <TableHead className="font-bold">Тип</TableHead>
            <TableHead className="text-right font-bold">Остаток до</TableHead>
            <TableHead className="text-right font-bold">Остаток после</TableHead>
            <TableHead className="font-bold">Комментарий</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {earlyPayments.map((payment) => (
            <TableRow key={payment.id} className="hover:bg-accent/50 transition-colors">
              <TableCell className="font-medium">{formatDate(payment.paymentDate)}</TableCell>
              <TableCell className="text-right tabular-nums font-bold text-green-600">
                {formatMoney(payment.amount)} ₽
              </TableCell>
              <TableCell>
                <Badge variant={payment.reductionType === 'reduce_term' ? 'default' : 'secondary'}>
                  {payment.reductionType === 'reduce_term' ? 'Срок' : 'Платёж'}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatMoney(payment.balanceBefore)} ₽
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(payment.balanceAfter)} ₽
              </TableCell>
              <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                {payment.notes || '—'}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDelete(payment.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function CreditDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedPayment, setSelectedPayment] = useState<ScheduleItem | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [earlyPaymentDialogOpen, setEarlyPaymentDialogOpen] = useState(false)
  const [editScheduleItem, setEditScheduleItem] = useState<ScheduleItem | null>(null)
  const [editScheduleDialogOpen, setEditScheduleDialogOpen] = useState(false)

  const { data: credit, isLoading, error } = useCredit(id!)
  const { data: summary, isLoading: isSummaryLoading } = useCreditSummary(id!)
  const { data: payments, isLoading: isPaymentsLoading } = useCreditPayments(id!)
  const { data: earlyPayments, isLoading: isEarlyPaymentsLoading } = useEarlyPayments(id!)
  const deleteEarlyPayment = useDeleteEarlyPayment()
  const regenerateSchedule = useRegenerateCreditSchedule()

  const handleConfirmPayment = (item: ScheduleItem) => {
    setSelectedPayment(item)
    setConfirmDialogOpen(true)
  }

  const handleEditPayment = (item: ScheduleItem) => {
    setEditScheduleItem(item)
    setEditScheduleDialogOpen(true)
  }

  const handleDeleteEarlyPayment = (earlyPaymentId: string) => {
    if (!id) return
    deleteEarlyPayment.mutate({ creditId: id, earlyPaymentId })
  }

  const handleRegenerateSchedule = () => {
    if (!id) return
    regenerateSchedule.mutate(id)
  }

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>ID кредита не указан</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/credits')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ошибка при загрузке кредита: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading || !credit) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[credit.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button variant="ghost" onClick={() => navigate('/credits')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${statusConfig.color}20` }}
            >
              <CreditCard className="h-8 w-8" style={{ color: statusConfig.color }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{credit.name}</h1>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <p className="text-muted-foreground">
                {credit.category_name ? `${credit.category_name} • ` : ''}{credit.account_name || 'Без счёта'}
              </p>
            </div>
          </div>
          {credit.status === 'active' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEarlyPaymentDialogOpen(true)}
              >
                <PiggyBank className="mr-2 h-4 w-4" />
                Внести ЧДП
              </Button>
              <Button
                variant="outline"
                onClick={handleRegenerateSchedule}
                disabled={regenerateSchedule.isPending}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", regenerateSchedule.isPending && "animate-spin")} />
                Пересчитать
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Progress */}
      {credit.status === 'active' && summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Прогресс погашения</span>
                <span className="text-2xl font-bold tabular-nums">
                  {summary.progressPercent.toFixed(1)}%
                </span>
              </div>
              <Progress value={summary.progressPercent} className="h-3" />
              <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                <span>
                  Платежей сделано: {summary.paymentsMade} из {summary.totalPayments}
                </span>
                <span>Осталось: {summary.paymentsRemaining}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Cards */}
      {!isSummaryLoading && summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <SummaryCard
            title="Основной долг"
            value={`${formatMoney(credit.principal_amount)} ₽`}
            subtitle={`Осталось: ${formatMoney(summary.remainingPrincipal)} ₽`}
            icon={TrendingDown}
            color="#8b5cf6"
          />
          <SummaryCard
            title="Процентная ставка"
            value={`${formatInterestRate(credit.interest_rate)}%`}
            subtitle={`${credit.term_months} месяцев`}
            icon={Percent}
            color="#f59e0b"
          />
          <SummaryCard
            title="Ежемесячный платёж"
            value={`${formatMoney(summary.monthlyPayment)} ₽`}
            subtitle={`${credit.payment_day} число`}
            icon={Calendar}
            color="#3b82f6"
          />
          <SummaryCard
            title="Выплачено процентов"
            value={`${formatMoney(summary.totalInterestPaid)} ₽`}
            subtitle={`Всего к уплате: ${formatMoney(summary.totalInterestToPay)} ₽`}
            icon={Wallet}
            color="#10b981"
          />
        </motion.div>
      )}

      {/* Payment History */}
      {!isPaymentsLoading && payments && payments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>История платежей</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentsTable payments={payments} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Early Payments */}
      {!isEarlyPaymentsLoading && earlyPayments && earlyPayments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Частично-досрочные погашения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EarlyPaymentsTable
                earlyPayments={earlyPayments}
                onDelete={handleDeleteEarlyPayment}
                isDeleting={deleteEarlyPayment.isPending}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payment Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>График платежей</CardTitle>
          </CardHeader>
          <CardContent>
            {credit.schedule && credit.schedule.length > 0 ? (
              <ScheduleTable
                schedule={credit.schedule}
                onConfirmPayment={handleConfirmPayment}
                onEditPayment={handleEditPayment}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                График платежей отсутствует
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Notes */}
      {credit.notes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Примечания</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{credit.notes}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Confirm Payment Dialog */}
      <ConfirmPaymentDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        scheduleItem={selectedPayment}
        plannedExpenseId={selectedPayment?.id}
        creditId={id!}
        defaultAccountId={credit?.account_id}
      />

      {/* Early Payment Dialog */}
      <EarlyPaymentDialog
        open={earlyPaymentDialogOpen}
        onOpenChange={setEarlyPaymentDialogOpen}
        creditId={id!}
        creditName={credit.name}
        currentBalance={credit.current_balance}
      />

      {/* Edit Schedule Item Dialog */}
      <EditScheduleItemDialog
        open={editScheduleDialogOpen}
        onOpenChange={setEditScheduleDialogOpen}
        creditId={id!}
        scheduleItem={editScheduleItem}
      />
    </div>
  )
}
