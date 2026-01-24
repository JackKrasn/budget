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
  Shield,
  Zap,
  CircleDollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { getBankByName } from '@/lib/banks'

// Helper to parse dates
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
  glow: string
}> = {
  active: {
    label: 'Активен',
    variant: 'default',
    color: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/20'
  },
  matured: {
    label: 'Погашен',
    variant: 'secondary',
    color: 'from-blue-500 to-indigo-500',
    glow: 'shadow-blue-500/20'
  },
  closed_early: {
    label: 'Закрыт досрочно',
    variant: 'outline',
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20'
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

// Animated circular progress component
function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'stroke-emerald-500',
  bgColor = 'stroke-muted/20',
  children
}: {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
  children?: React.ReactNode
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          className={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{
            strokeDasharray: circumference,
            strokeLinecap: 'round',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// Container animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  },
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-80 bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl animate-pulse" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted/30 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  if (error || !deposit) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24"
      >
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Landmark className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Депозит не найден</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Возможно, он был удалён или вы перешли по неверной ссылке
        </p>
        <Button variant="outline" size="lg" onClick={() => navigate('/deposits')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к списку
        </Button>
      </motion.div>
    )
  }

  const currencySymbol = CURRENCY_SYMBOLS[deposit.currency] || deposit.currency
  const statusConfig = STATUS_CONFIG[deposit.status] || STATUS_CONFIG.active
  const isActive = deposit.status === 'active'
  const bank = deposit.bank ? getBankByName(deposit.bank) : undefined

  const startDate = parseDateSafe(deposit.startDate)
  const maturityDate = parseDateSafe(deposit.maturityDate)
  const totalDays = startDate && maturityDate ? differenceInDays(maturityDate, startDate) : 0
  const passedDays = totalDays - (deposit.daysRemaining || 0)
  const termProgress = totalDays > 0 ? Math.min(100, Math.max(0, (passedDays / totalDays) * 100)) : 0
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-8"
    >
      {/* Breadcrumb */}
      <motion.div variants={itemVariants}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/deposits" className="hover:text-foreground transition-colors">Депозиты</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{deposit.assetName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Hero Card */}
      <motion.div variants={scaleVariants}>
        <Card className={`relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/80 shadow-2xl ${statusConfig.glow}`}>
          {/* Status glow bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusConfig.color}`} />

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/5 via-transparent to-transparent rounded-full blur-2xl" />

          <CardContent className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              {/* Left: Bank & Info */}
              <div className="flex-1 space-y-6">
                {/* Header with bank logo */}
                <div className="flex items-start gap-5">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-background to-muted/50 shadow-xl ring-1 ring-border/50 flex items-center justify-center overflow-hidden">
                      {bank ? (
                        <img
                          src={bank.logo}
                          alt={bank.name}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <Landmark className="w-10 h-10 text-primary" />
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center"
                      >
                        <Zap className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{deposit.assetName}</h1>
                      <Badge
                        variant={statusConfig.variant}
                        className={`${isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : ''}`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      {bank && (
                        <span className="font-medium text-foreground">{bank.name}</span>
                      )}
                      {bank && <span className="text-border">•</span>}
                      {deposit.fundName && (
                        <>
                          <span className="flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5" />
                            {deposit.fundName}
                          </span>
                          <span className="text-border">•</span>
                        </>
                      )}
                      <span>{deposit.currency}</span>
                      <span className="text-border">•</span>
                      <span>{PERIOD_LABELS[deposit.accrualPeriod]}</span>
                      {deposit.hasCapitalization && (
                        <>
                          <span className="text-border">•</span>
                          <span className="text-amber-600 dark:text-amber-400">
                            Капитализация
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount display */}
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-background/80 to-muted/20 ring-1 ring-border/50 backdrop-blur-sm">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                      Текущая сумма
                    </p>
                    <div className="flex items-baseline gap-2">
                      <motion.span
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-4xl lg:text-5xl font-bold tabular-nums tracking-tight"
                      >
                        {formatAmount(deposit.currentAmount)}
                      </motion.span>
                      <span className="text-2xl text-muted-foreground font-medium">{currencySymbol}</span>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm">
                      <span className="text-muted-foreground">
                        Начальная: {formatAmount(deposit.principalAmount)} {currencySymbol}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                      <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        +{formatAmount(deposit.totalInterest)} {currencySymbol}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline" onClick={() => setIsEditOpen(true)} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Редактировать
                  </Button>
                  {isActive && (
                    <Button variant="outline" onClick={() => setIsCloseOpen(true)} className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Закрыть досрочно
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsDeleteOpen(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right: Progress Rings */}
              {isActive && (
                <div className="flex gap-8 items-center justify-center lg:justify-end">
                  {/* Term Progress */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                    className="text-center"
                  >
                    <CircularProgress
                      value={termProgress}
                      size={140}
                      strokeWidth={10}
                      color="stroke-primary"
                      bgColor="stroke-primary/10"
                    >
                      <div className="text-center">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <span className="text-2xl font-bold tabular-nums">{termProgress.toFixed(0)}%</span>
                      </div>
                    </CircularProgress>
                    <p className="text-xs text-muted-foreground mt-3 font-medium uppercase tracking-wider">Срок</p>
                    <p className="text-sm text-muted-foreground">{deposit.daysRemaining} дн. осталось</p>
                  </motion.div>

                  {/* Yield Progress */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="text-center"
                  >
                    <CircularProgress
                      value={yieldProgress}
                      size={140}
                      strokeWidth={10}
                      color="stroke-emerald-500"
                      bgColor="stroke-emerald-500/10"
                    >
                      <div className="text-center">
                        <TrendingUp className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                        <span className="text-2xl font-bold tabular-nums">{yieldProgress.toFixed(0)}%</span>
                      </div>
                    </CircularProgress>
                    <p className="text-xs text-muted-foreground mt-3 font-medium uppercase tracking-wider">Доход</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      +{formatAmount(deposit.projectedYield)} {currencySymbol}
                    </p>
                  </motion.div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            icon: Percent,
            value: formatRate(deposit.interestRate),
            label: 'Годовых',
            color: 'text-amber-500',
            bg: 'from-amber-500/10 to-amber-500/5'
          },
          {
            icon: Calendar,
            value: deposit.termMonths,
            label: 'Месяцев',
            color: 'text-blue-500',
            bg: 'from-blue-500/10 to-blue-500/5'
          },
          {
            icon: Clock,
            value: deposit.daysRemaining,
            label: 'Дней осталось',
            color: 'text-violet-500',
            bg: 'from-violet-500/10 to-violet-500/5'
          },
          {
            icon: CircleDollarSign,
            value: PERIOD_LABELS[deposit.accrualPeriod],
            label: deposit.hasCapitalization ? 'С капитализацией' : 'Без капитализации',
            color: 'text-primary',
            bg: 'from-primary/10 to-primary/5',
            isText: true
          },
        ].map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-50 group-hover:opacity-100 transition-opacity`} />
              <CardContent className="relative p-5">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-3`} />
                <p className={`${stat.isText ? 'text-base' : 'text-2xl'} font-bold tabular-nums`}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Dates & Details */}
      <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Ключевые даты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: 'Дата открытия', value: startDate ? format(startDate, 'd MMMM yyyy', { locale: ru }) : '—' },
              { label: 'Дата погашения', value: maturityDate ? format(maturityDate, 'd MMMM yyyy', { locale: ru }) : '—' },
              ...(deposit.nextAccrualDate ? [{
                label: 'Следующее начисление',
                value: (() => {
                  const nextDate = parseDateSafe(deposit.nextAccrualDate)
                  return nextDate ? format(nextDate, 'd MMMM yyyy', { locale: ru }) : '—'
                })()
              }] : []),
            ].map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-3 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {deposit.notes && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Заметки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {deposit.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Accruals History */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              История начислений
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAccruals ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
            ) : accruals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <History className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">Начисления пока отсутствуют</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Первое начисление произойдёт согласно периоду выплат
                </p>
              </motion.div>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-medium">Дата</TableHead>
                      <TableHead className="font-medium">Период</TableHead>
                      <TableHead className="text-right font-medium">Сумма до</TableHead>
                      <TableHead className="text-right font-medium">Проценты</TableHead>
                      <TableHead className="text-right font-medium">Сумма после</TableHead>
                      <TableHead className="font-medium">Тип</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {accruals.map((accrual, index) => (
                        <motion.tr
                          key={accrual.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group"
                        >
                          <TableCell className="font-medium">
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
                          <TableCell className="text-right tabular-nums">
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <TrendingUp className="h-3 w-3" />
                              +{formatAmount(accrual.interestAccrued)} {currencySymbol}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatAmount(accrual.principalAtEnd)} {currencySymbol}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-normal">
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
        }}
      />
    </motion.div>
  )
}
