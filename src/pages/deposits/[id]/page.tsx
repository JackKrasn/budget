import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Landmark,
  ArrowLeft,
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
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  useDeposit,
  useDepositAccruals,
  EditDepositDialog,
  CloseDepositDialog,
  DeleteDepositDialog,
} from '@/features/deposits'
import type { DepositAccrual } from '@/lib/api'

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

export default function DepositDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCloseOpen, setIsCloseOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: deposit, isLoading, error } = useDeposit(id || '')
  const { data: accrualsData, isLoading: isLoadingAccruals } = useDepositAccruals(id || '')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !deposit) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold mb-2">Депозит не найден</h2>
        <p className="text-muted-foreground mb-4">
          Возможно, он был удалён или вы перешли по неверной ссылке
        </p>
        <Button variant="outline" onClick={() => navigate('/deposits')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к списку
        </Button>
      </div>
    )
  }

  const currencySymbol = CURRENCY_SYMBOLS[deposit.currency] || deposit.currency
  const statusConfig = STATUS_CONFIG[deposit.status] || STATUS_CONFIG.active
  const isActive = deposit.status === 'active'

  const startDate = parseDateSafe(deposit.startDate)
  const maturityDate = parseDateSafe(deposit.maturityDate)
  const totalDays = startDate && maturityDate ? differenceInDays(maturityDate, startDate) : 0
  const passedDays = totalDays - (deposit.daysRemaining || 0)
  const termProgress = totalDays > 0 ? Math.min(100, Math.max(0, (passedDays / totalDays) * 100)) : 0
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
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/deposits">Депозиты</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{deposit.assetName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
            <Landmark className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{deposit.assetName}</h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {deposit.fundName && (
                <>
                  <Wallet className="h-4 w-4" />
                  <span>{deposit.fundName}</span>
                  <span>•</span>
                </>
              )}
              <span>{deposit.currency}</span>
              <span>•</span>
              <span>{PERIOD_LABELS[deposit.accrualPeriod]}</span>
              {deposit.hasCapitalization && (
                <>
                  <span>•</span>
                  <span>с капитализацией</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
          {isActive && (
            <Button variant="outline" onClick={() => setIsCloseOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Закрыть досрочно
            </Button>
          )}
          <Button variant="destructive" size="icon" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Main Amount Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Текущая сумма
                </p>
                <p className="text-4xl font-bold tabular-nums">
                  {formatAmount(deposit.currentAmount)}
                  <span className="ml-2 text-2xl text-muted-foreground">{currencySymbol}</span>
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-muted-foreground">
                    Начальная: {formatAmount(deposit.principalAmount)} {currencySymbol}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Прогноз: +{formatAmount(deposit.projectedYield)} {currencySymbol}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-emerald-500">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-3xl font-bold tabular-nums">
                    +{formatAmount(deposit.totalInterest)}
                  </span>
                  <span className="text-xl">{currencySymbol}</span>
                </div>
                <p className="text-sm text-muted-foreground">накопленные проценты</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Cards */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Прогресс срока
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {passedDays} из {totalDays} дней
                  </span>
                  <span className="font-medium">{termProgress.toFixed(0)}%</span>
                </div>
                <Progress value={termProgress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{startDate ? format(startDate, 'd MMM yyyy', { locale: ru }) : '—'}</span>
                  <span>{maturityDate ? format(maturityDate, 'd MMM yyyy', { locale: ru }) : '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Доходность
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatAmount(deposit.totalInterest)} из {formatAmount(deposit.projectedYield)} {currencySymbol}
                  </span>
                  <span className="font-medium">{yieldProgress.toFixed(0)}%</span>
                </div>
                <Progress value={yieldProgress} className="h-3 [&>div]:bg-emerald-500" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Накоплено</span>
                  <span>Прогноз на конец срока</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Details Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <Percent className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold tabular-nums">{formatRate(deposit.interestRate)}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">годовых</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold tabular-nums">{deposit.termMonths}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">месяцев</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold tabular-nums">{deposit.daysRemaining}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">дней осталось</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <History className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-lg font-semibold">{PERIOD_LABELS[deposit.accrualPeriod]}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {deposit.hasCapitalization ? 'с капит.' : 'без капит.'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dates & Notes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid md:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Даты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Дата открытия</span>
              <span className="font-medium">{startDate ? format(startDate, 'd MMMM yyyy', { locale: ru }) : '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Дата погашения</span>
              <span className="font-medium">{maturityDate ? format(maturityDate, 'd MMMM yyyy', { locale: ru }) : '—'}</span>
            </div>
            {deposit.nextAccrualDate && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Следующее начисление</span>
                <span className="font-medium">
                  {(() => {
                    const nextDate = parseDateSafe(deposit.nextAccrualDate)
                    return nextDate ? format(nextDate, 'd MMMM yyyy', { locale: ru }) : '—'
                  })()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {deposit.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Заметки</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {deposit.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Accruals History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              История начислений
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAccruals ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : accruals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Начисления пока отсутствуют</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Период</TableHead>
                      <TableHead className="text-right">Сумма до</TableHead>
                      <TableHead className="text-right">Проценты</TableHead>
                      <TableHead className="text-right">Сумма после</TableHead>
                      <TableHead>Тип</TableHead>
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
                        >
                          <TableCell>
                            {(() => {
                              const date = parseDateSafe(accrual.accrualDate)
                              return date ? format(date, 'd MMM yyyy', { locale: ru }) : '—'
                            })()}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {(() => {
                              const start = parseDateSafe(accrual.periodStart)
                              const end = parseDateSafe(accrual.periodEnd)
                              if (start && end) {
                                return `${format(start, 'd MMM', { locale: ru })} — ${format(end, 'd MMM', { locale: ru })}`
                              }
                              return '—'
                            })()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatAmount(accrual.principalAtStart)} {currencySymbol}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                            +{formatAmount(accrual.interestAccrued)} {currencySymbol}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatAmount(accrual.principalAtEnd)} {currencySymbol}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {ACCRUAL_TYPE_LABELS[accrual.accrualType]}
                              {accrual.isCapitalized && ' (капит.)'}
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <EditDepositDialog
        deposit={deposit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <CloseDepositDialog
        deposit={deposit}
        open={isCloseOpen}
        onOpenChange={setIsCloseOpen}
      />

      <DeleteDepositDialog
        deposit={deposit}
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) {
            // Check if we should navigate away
          }
        }}
      />
    </div>
  )
}
