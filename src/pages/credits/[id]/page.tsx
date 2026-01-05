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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCredit, useCreditSummary, useCreditPayments } from '@/features/credits'
import { ConfirmPaymentDialog } from '@/features/credits/components'
import type { ScheduleItem, PaymentHistoryItem } from '@/lib/api/credits'

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
}: {
  schedule: ScheduleItem[]
  onConfirmPayment: (item: ScheduleItem) => void
}) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">#</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead className="text-right">Основной долг</TableHead>
            <TableHead className="text-right">Проценты</TableHead>
            <TableHead className="text-right">Всего</TableHead>
            <TableHead className="text-right">Остаток</TableHead>
            <TableHead className="w-[120px] text-center">Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.map((item) => (
            <TableRow key={item.id} className={item.isPaid ? 'opacity-60' : ''}>
              <TableCell className="font-medium">{item.paymentNumber}</TableCell>
              <TableCell>{formatDate(item.dueDate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(item.principalPart)} ₽
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(item.interestPart)} ₽
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatMoney(item.totalPayment)} ₽
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatMoney(item.remainingBalance)} ₽
              </TableCell>
              <TableCell className="text-center">
                {item.isPaid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 inline" />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onConfirmPayment(item)}
                    className="h-8"
                  >
                    Оплатить
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PaymentsTable({ payments }: { payments: PaymentHistoryItem[] }) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">#</TableHead>
            <TableHead>Дата платежа</TableHead>
            <TableHead>Дата по плану</TableHead>
            <TableHead className="text-right">Основной долг</TableHead>
            <TableHead className="text-right">Проценты</TableHead>
            <TableHead className="text-right">Всего</TableHead>
            <TableHead className="w-[100px]">Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
              <TableCell>{formatDate(payment.paymentDate)}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(payment.dueDate)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(payment.principalPaid)} ₽
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(payment.interestPaid)} ₽
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatMoney(payment.totalPaid)} ₽
              </TableCell>
              <TableCell>
                <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                  {payment.status === 'completed' ? 'Оплачен' : payment.status}
                </Badge>
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

  const { data: credit, isLoading, error } = useCredit(id!)
  const { data: summary, isLoading: isSummaryLoading } = useCreditSummary(id!)
  const { data: payments, isLoading: isPaymentsLoading } = useCreditPayments(id!)

  const handleConfirmPayment = (item: ScheduleItem) => {
    setSelectedPayment(item)
    setConfirmDialogOpen(true)
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
                {credit.category_name} • {credit.account_name}
              </p>
            </div>
          </div>
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
              <ScheduleTable schedule={credit.schedule} onConfirmPayment={handleConfirmPayment} />
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
    </div>
  )
}
