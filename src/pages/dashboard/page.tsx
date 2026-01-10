import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Target,
  Sparkles,
  ChevronRight,
  Calendar,
  CircleDollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { FundIcon } from '@/components/common'

// API hooks
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useFunds } from '@/features/funds/hooks/use-funds'
import { useIncomes } from '@/features/incomes/hooks/use-incomes'
import { useCredits, useUpcomingPayments } from '@/features/credits/hooks/use-credits'

// Утилиты форматирования
function formatMoney(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M'
  }
  if (compact && Math.abs(amount) >= 1000) {
    return (amount / 1000).toFixed(0) + 'K'
  }
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

// Анимации
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
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

const numberVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
}

// Компонент для больших денежных значений
function BigMoney({
  amount,
  currency = '₽',
  trend,
  size = 'lg',
}: {
  amount: number
  currency?: string
  trend?: 'up' | 'down' | 'neutral'
  size?: 'lg' | 'xl' | '2xl'
}) {
  const sizeClasses = {
    lg: 'text-3xl md:text-4xl',
    xl: 'text-4xl md:text-5xl',
    '2xl': 'text-5xl md:text-6xl',
  }

  return (
    <motion.div
      className="flex items-baseline gap-2"
      variants={numberVariants}
      initial="hidden"
      animate="show"
    >
      <span
        className={`${sizeClasses[size]} font-bold tabular-nums tracking-tight leading-none`}
      >
        {formatMoney(amount)}
      </span>
      <span className="text-xl text-muted-foreground font-medium">{currency}</span>
      {trend && trend !== 'neutral' && (
        <span
          className={`flex items-center text-sm font-medium ${
            trend === 'up' ? 'text-emerald-500' : 'text-red-500'
          }`}
        >
          {trend === 'up' ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
        </span>
      )}
    </motion.div>
  )
}

// Мини-карточка статистики
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'default',
  href,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color?: 'default' | 'emerald' | 'gold' | 'destructive'
  href?: string
}) {
  const colorClasses = {
    default: 'from-primary/10 to-primary/5 text-primary',
    emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-500',
    gold: 'from-amber-500/15 to-amber-500/5 text-amber-500',
    destructive: 'from-red-500/15 to-red-500/5 text-red-500',
  }

  const content = (
    <motion.div variants={itemVariants} className="h-full">
      <Card className="group relative h-full overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
        {/* Gradient accent */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        />

        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
              <div>
                <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
                {subtitle && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colorClasses[color]} transition-transform duration-300 group-hover:scale-110`}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>

        {href && (
          <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </Card>
    </motion.div>
  )

  if (href) {
    return <Link to={href}>{content}</Link>
  }

  return content
}

// Карточка фонда
function FundCard({
  name,
  icon,
  color,
  balance,
  target,
  index,
}: {
  name: string
  icon: string
  color: string
  balance: number
  target?: number
  index: number
}) {
  const progress = target ? Math.min((balance / target) * 100, 100) : 0
  const hasTarget = target && target > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
      className="group"
    >
      <div className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-muted/50">
        <FundIcon name={name} iconName={icon} color={color} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium truncate">{name}</p>
            <p className="text-sm font-semibold tabular-nums shrink-0">
              {formatMoney(balance)} ₽
            </p>
          </div>

          {hasTarget && (
            <div className="mt-2 space-y-1">
              <Progress
                value={progress}
                className="h-1.5"
                style={{ '--progress-background': color } as React.CSSProperties}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPercent(progress)}</span>
                <span>из {formatMoney(target, true)} ₽</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Предстоящий платёж
function UpcomingPayment({
  name,
  amount,
  date,
  type,
  index,
}: {
  name: string
  amount: number
  date: string
  type: 'credit' | 'expense'
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between gap-3 py-3 border-b border-border/30 last:border-0"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            type === 'credit'
              ? 'bg-amber-500/10 text-amber-500'
              : 'bg-blue-500/10 text-blue-500'
          }`}
        >
          {type === 'credit' ? (
            <CreditCard className="h-4 w-4" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
      </div>
      <p className="text-sm font-semibold tabular-nums text-destructive">
        −{formatMoney(amount)} ₽
      </p>
    </motion.div>
  )
}

export default function DashboardPage() {
  // Данные
  const { data: accountsData, isLoading: accountsLoading } = useAccounts()
  const { data: fundsData, isLoading: fundsLoading } = useFunds({ status: 'active' })
  const { data: incomesData, isLoading: incomesLoading } = useIncomes()
  const { data: creditsData } = useCredits('active')
  const { data: upcomingPaymentsData } = useUpcomingPayments(5)

  // Вычисления
  const stats = useMemo(() => {
    const accounts = accountsData?.data ?? []
    const funds = fundsData?.data ?? []
    const incomes = incomesData?.data ?? []
    const credits = creditsData ?? []

    // Общий баланс на счетах
    const totalAccountsBalance = accounts.reduce(
      (sum, acc) => sum + (acc.current_balance ?? 0),
      0
    )

    // Общий баланс в фондах
    const totalFundsBalance = funds.reduce((sum, fb) => sum + fb.totalRub, 0)

    // Доходы за текущий месяц
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const monthlyIncomes = incomes.filter((inc) => {
      const incomeDate = new Date(inc.date || inc.created_at)
      return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd })
    })
    const totalMonthlyIncome = monthlyIncomes.reduce(
      (sum, inc) => sum + inc.amount,
      0
    )

    // Кредиты (credits может быть CreditsListResponse)
    const creditsList = Array.isArray(credits) ? credits : (credits?.data ?? [])
    const activeCreditsCount = creditsList.length
    // CreditListRow содержит principal_amount как сумму кредита
    const totalCreditDebt = creditsList.reduce(
      (sum, c) => sum + (c.principal_amount ?? 0),
      0
    )

    // Все фонды (целевой баланс убран, т.к. Fund не содержит targetAmount)
    const fundsWithGoals = funds

    return {
      totalAccountsBalance,
      totalFundsBalance,
      totalMonthlyIncome,
      activeCreditsCount,
      totalCreditDebt,
      fundsWithGoals,
      funds,
      monthlyIncomesCount: monthlyIncomes.length,
    }
  }, [accountsData, fundsData, incomesData, creditsData])

  const isLoading = accountsLoading || fundsLoading || incomesLoading

  // Ближайшие платежи
  const upcomingPayments = useMemo(() => {
    const payments: Array<{
      id: string
      name: string
      amount: number
      date: string
      type: 'credit' | 'expense'
    }> = []

    // Добавляем платежи по кредитам
    if (upcomingPaymentsData) {
      upcomingPaymentsData.forEach((p) => {
        payments.push({
          id: p.id,
          name: p.creditName || 'Платёж по кредиту',
          amount: p.totalPayment,
          date: format(new Date(p.dueDate), 'd MMM', { locale: ru }),
          type: 'credit',
        })
      })
    }

    return payments.slice(0, 5)
  }, [upcomingPaymentsData])

  // Текущий месяц
  const currentMonth = format(new Date(), 'LLLL yyyy', { locale: ru })

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 p-6 md:p-8"
      >
        {/* Декоративные элементы */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-primary/5 to-transparent blur-3xl" />

        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
                <Sparkles className="h-3 w-3" />
                <span className="capitalize">{currentMonth}</span>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">
                  Общий баланс
                </p>
                {isLoading ? (
                  <Skeleton className="h-12 w-64" />
                ) : (
                  <BigMoney
                    amount={stats.totalAccountsBalance + stats.totalFundsBalance}
                    size="2xl"
                    trend={stats.totalMonthlyIncome > 0 ? 'up' : 'neutral'}
                  />
                )}
              </div>

              <div className="flex gap-6 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">На счетах</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {isLoading ? '...' : formatMoney(stats.totalAccountsBalance)} ₽
                  </p>
                </div>
                <div className="border-l border-border/50 pl-6">
                  <p className="text-xs text-muted-foreground">В фондах</p>
                  <p className="text-lg font-semibold tabular-nums text-emerald-500">
                    {isLoading ? '...' : formatMoney(stats.totalFundsBalance)} ₽
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/incomes">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                  <Banknote className="h-4 w-4" />
                  Добавить доход
                </Button>
              </Link>
              <Link to="/expenses">
                <Button variant="outline" size="lg" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  Расходы
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <StatCard
          title="Доходы за месяц"
          value={`${formatMoney(stats.totalMonthlyIncome)} ₽`}
          subtitle={`${stats.monthlyIncomesCount} поступлений`}
          icon={TrendingUp}
          color="emerald"
          href="/incomes"
        />
        <StatCard
          title="Активных фондов"
          value={String(stats.funds.length)}
          subtitle={`${stats.fundsWithGoals.length} с целью`}
          icon={PiggyBank}
          color="default"
          href="/funds"
        />
        <StatCard
          title="Активных кредитов"
          value={String(stats.activeCreditsCount)}
          subtitle={stats.totalCreditDebt > 0 ? `${formatMoney(stats.totalCreditDebt)} ₽ долга` : 'Нет долгов'}
          icon={CreditCard}
          color={stats.totalCreditDebt > 0 ? 'gold' : 'default'}
          href="/credits"
        />
        <StatCard
          title="Целей с прогрессом"
          value={String(stats.fundsWithGoals.length)}
          subtitle="фондов с целевой суммой"
          icon={Target}
          color="default"
          href="/funds"
        />
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Funds Progress - 3 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          <Card className="h-full border-border/40 bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <PiggyBank className="h-5 w-5 text-emerald-500" />
                </div>
                <CardTitle className="text-base font-medium">
                  Накопительные фонды
                </CardTitle>
              </div>
              <Link to="/funds">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Все фонды
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {fundsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : stats.funds.length > 0 ? (
                <div className="space-y-1">
                  {stats.funds.slice(0, 5).map((fb, index) => (
                    <FundCard
                      key={fb.fund.id}
                      name={fb.fund.name}
                      icon={fb.fund.icon}
                      color={fb.fund.color}
                      balance={fb.totalRub}
                      target={undefined}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <PiggyBank className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Нет накопительных фондов</p>
                    <p className="text-sm text-muted-foreground">
                      Создайте первый фонд для накоплений
                    </p>
                  </div>
                  <Link to="/funds">
                    <Button size="sm">Создать фонд</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Payments - 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="h-full border-border/40 bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
                <CardTitle className="text-base font-medium">
                  Ближайшие платежи
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {upcomingPayments.length > 0 ? (
                <div>
                  {upcomingPayments.map((payment, index) => (
                    <UpcomingPayment
                      key={payment.id}
                      name={payment.name}
                      amount={payment.amount}
                      date={payment.date}
                      type={payment.type}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Нет предстоящих платежей</p>
                    <p className="text-sm text-muted-foreground">
                      Платежи по кредитам появятся здесь
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-border/40 bg-gradient-to-r from-card to-muted/20 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30">
                  <CircleDollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Управляйте финансами эффективно</p>
                  <p className="text-sm text-muted-foreground">
                    Планируйте бюджет, отслеживайте расходы, достигайте целей
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to="/budget">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Target className="h-4 w-4" />
                    Бюджет
                  </Button>
                </Link>
                <Link to="/analytics">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Аналитика
                  </Button>
                </Link>
                <Link to="/accounts">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Wallet className="h-4 w-4" />
                    Счета
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
