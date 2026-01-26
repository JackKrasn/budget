import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays } from 'date-fns'
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
  Receipt,
  AlertTriangle,
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
import { useExpenses } from '@/features/expenses/hooks/use-expenses'
import { useCredits } from '@/features/credits/hooks/use-credits'
import { useCurrentBudget } from '@/features/budget/hooks/use-budgets'
import { useUpcomingPlannedExpenses } from '@/features/budget/hooks/use-planned-expenses'
import { useUpcomingPlannedIncomes } from '@/features/budget/hooks/use-planned-incomes'

// Утилиты форматирования
function formatMoney(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M'
  }
  if (compact && Math.abs(amount) >= 1000) {
    return (amount / 1000).toFixed(0) + 'K'
  }
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
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

// Предстоящий платёж (с поддержкой выделения для сегодня)
function UpcomingPayment({
  type,
  name,
  amount,
  date,
  categoryName,
  isToday,
  index,
}: {
  type: 'income' | 'expense'
  name: string
  amount: number
  date: string
  categoryName?: string
  isToday?: boolean
  index: number
}) {
  const isIncome = type === 'income'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg transition-colors ${
        isToday
          ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
          : 'hover:bg-muted/50'
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
          isToday
            ? 'bg-emerald-500/20 text-emerald-500'
            : isIncome
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-orange-500/10 text-orange-500'
        }`}
      >
        {isIncome ? <Banknote className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{name}</p>
          {isToday && (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
              сегодня
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {!isToday && <span>{date}</span>}
          {categoryName && !isToday && <span>•</span>}
          {categoryName && <span className="truncate">{categoryName}</span>}
        </div>
      </div>
      <p
        className={`text-sm font-semibold tabular-nums shrink-0 ${
          isIncome ? 'text-emerald-500' : 'text-orange-500'
        }`}
      >
        {isIncome ? '+' : '−'}{formatMoney(amount)} ₽
      </p>
    </motion.div>
  )
}

// Просроченный платёж
function OverdueEvent({
  type,
  name,
  amount,
  categoryName,
  daysOverdue,
  index,
  onClick,
}: {
  type: 'income' | 'expense'
  name: string
  amount: number
  categoryName?: string
  daysOverdue: number
  index: number
  onClick?: () => void
}) {
  const isIncome = type === 'income'

  const formatDaysOverdue = (days: number) => {
    if (days === 1) return '1 день'
    if (days >= 2 && days <= 4) return `${days} дня`
    return `${days} дней`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onClick}
      className="flex items-center gap-3 py-2.5 hover:bg-red-500/5 transition-colors -mx-2 px-2 rounded-lg cursor-pointer"
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
          isIncome
            ? 'bg-emerald-500/10 text-emerald-500'
            : 'bg-red-500/10 text-red-500'
        }`}
      >
        {isIncome ? <Banknote className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <div className="flex items-center gap-2 text-xs">
          {categoryName && (
            <span className="text-muted-foreground truncate">{categoryName}</span>
          )}
          {categoryName && <span className="text-muted-foreground">•</span>}
          <span className="text-red-500 font-medium">
            {formatDaysOverdue(daysOverdue)}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p
          className={`text-sm font-semibold tabular-nums ${
            isIncome ? 'text-emerald-500' : 'text-red-500'
          }`}
        >
          {isIncome ? '+' : '−'}{formatMoney(amount)} ₽
        </p>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()

  // Даты текущего месяца для фильтрации
  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
  const in30Days = format(addDays(now, 30), 'yyyy-MM-dd')

  // Данные
  const { data: accountsData, isLoading: accountsLoading } = useAccounts()
  const { data: fundsData, isLoading: fundsLoading } = useFunds({ status: 'active' })
  const { data: incomesData, isLoading: incomesLoading } = useIncomes()
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({ from: monthStart, to: monthEnd })
  const { data: creditsData } = useCredits('active')
  // Получаем платежи с начала месяца до +30 дней (чтобы видеть просроченные)
  const { data: upcomingPlannedExpensesData } = useUpcomingPlannedExpenses(monthStart, in30Days)
  const { data: upcomingPlannedIncomesData } = useUpcomingPlannedIncomes(monthStart, in30Days)
  const { data: currentBudget, isLoading: budgetLoading } = useCurrentBudget()

  // Вычисления
  const stats = useMemo(() => {
    const accounts = accountsData?.data ?? []
    const funds = fundsData?.data ?? []
    const incomes = incomesData?.data ?? []
    const expenses = expensesData?.data ?? []
    const credits = creditsData ?? []

    // Общий баланс на счетах
    const totalAccountsBalance = accounts.reduce(
      (sum, acc) => sum + (acc.current_balance ?? 0),
      0
    )

    // Общий баланс в фондах
    const totalFundsBalance = funds.reduce((sum, fb) => sum + fb.totalBase, 0)

    // Доходы за текущий месяц
    const monthStartDate = startOfMonth(now)
    const monthEndDate = endOfMonth(now)

    const monthlyIncomes = incomes.filter((inc) => {
      const incomeDate = new Date(inc.date || inc.created_at)
      return isWithinInterval(incomeDate, { start: monthStartDate, end: monthEndDate })
    })
    const totalMonthlyIncome = monthlyIncomes.reduce(
      (sum, inc) => sum + inc.amount,
      0
    )

    // Расходы за текущий месяц (уже отфильтрованы через API)
    // Используем amount_base для конвертации в рубли
    const totalMonthlyExpenses = expenses.reduce(
      (sum, exp) => sum + (exp.amountBase ?? exp.amount),
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
      totalMonthlyExpenses,
      monthlyExpensesCount: expenses.length,
      activeCreditsCount,
      totalCreditDebt,
      fundsWithGoals,
      funds,
      monthlyIncomesCount: monthlyIncomes.length,
    }
  }, [accountsData, fundsData, incomesData, expensesData, creditsData, now])

  const isLoading = accountsLoading || fundsLoading || incomesLoading || expensesLoading || budgetLoading

  // Данные бюджета и расходов
  const budgetStats = useMemo(() => {
    const totalPlanned = currentBudget?.total_planned ?? 0
    const items = currentBudget?.items ?? []
    const totalActual = items.reduce((sum, item) => sum + (item.actualAmount ?? 0), 0)
    const remaining = totalPlanned - totalActual
    const progress = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0

    return {
      totalPlanned,
      totalActual,
      remaining,
      progress: Math.min(progress, 100),
      itemsCount: items.length,
      hasBudget: !!currentBudget,
    }
  }, [currentBudget])

  // Просроченные платежи (до сегодня, но не выполненные)
  const overdueEvents = useMemo(() => {
    const events: Array<{
      id: string
      type: 'income' | 'expense'
      name: string
      amount: number
      categoryName?: string
      rawDate: Date
      daysOverdue: number
    }> = []

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Просроченные расходы
    if (upcomingPlannedExpensesData?.data) {
      upcomingPlannedExpensesData.data
        .filter((p) => p.status === 'pending' && p.planned_date)
        .forEach((p) => {
          const dateValue =
            typeof p.planned_date === 'string'
              ? p.planned_date
              : p.planned_date?.Time
          if (!dateValue) return
          const plannedDate = new Date(dateValue)
          if (isNaN(plannedDate.getTime())) return

          // Проверяем что дата до сегодня (просрочено)
          if (plannedDate < todayStart) {
            const daysOverdue = Math.floor((todayStart.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24))
            events.push({
              id: p.id,
              type: 'expense',
              name: p.name,
              amount: p.planned_amount,
              categoryName: p.category_name,
              rawDate: plannedDate,
              daysOverdue,
            })
          }
        })
    }

    // Просроченные доходы
    if (upcomingPlannedIncomesData?.data) {
      upcomingPlannedIncomesData.data
        .filter((p) => p.status === 'pending' && p.expected_date)
        .forEach((p) => {
          const dateValue =
            typeof p.expected_date === 'string'
              ? p.expected_date
              : p.expected_date && typeof p.expected_date === 'object' && 'Time' in p.expected_date
                ? p.expected_date.Time
                : null
          if (!dateValue) return
          const expectedDate = new Date(dateValue)
          if (isNaN(expectedDate.getTime())) return

          // Проверяем что дата до сегодня (просрочено)
          if (expectedDate < todayStart) {
            const daysOverdue = Math.floor((todayStart.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
            events.push({
              id: p.id,
              type: 'income',
              name: p.source,
              amount: p.expected_amount,
              rawDate: expectedDate,
              daysOverdue,
            })
          }
        })
    }

    // Сортируем по дате (самые старые первые)
    events.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())

    return events
  }, [upcomingPlannedExpensesData, upcomingPlannedIncomesData, now])

  // Ближайшие платежи до конца месяца (расходы и доходы, сегодняшние помечены)
  const upcomingPayments = useMemo(() => {
    const payments: Array<{
      id: string
      type: 'income' | 'expense'
      name: string
      amount: number
      date: string
      categoryName?: string
      isToday: boolean
      rawDate: Date
    }> = []

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const monthEndDate = endOfMonth(now)

    // Добавляем расходы
    if (upcomingPlannedExpensesData?.data) {
      upcomingPlannedExpensesData.data
        .filter((p) => p.status === 'pending' && p.planned_date)
        .forEach((p) => {
          const dateValue =
            typeof p.planned_date === 'string'
              ? p.planned_date
              : p.planned_date?.Time
          if (!dateValue) return
          const plannedDate = new Date(dateValue)
          if (isNaN(plannedDate.getTime())) return

          // Только платежи от сегодня до конца месяца
          if (plannedDate < todayStart || plannedDate > monthEndDate) return

          const isToday = plannedDate >= todayStart && plannedDate <= todayEnd

          payments.push({
            id: p.id,
            type: 'expense',
            name: p.name,
            amount: p.planned_amount,
            date: format(plannedDate, 'd MMM', { locale: ru }),
            categoryName: p.category_name,
            isToday,
            rawDate: plannedDate,
          })
        })
    }

    // Добавляем доходы
    if (upcomingPlannedIncomesData?.data) {
      upcomingPlannedIncomesData.data
        .filter((p) => p.status === 'pending' && p.expected_date)
        .forEach((p) => {
          const dateValue =
            typeof p.expected_date === 'string'
              ? p.expected_date
              : p.expected_date && typeof p.expected_date === 'object' && 'Time' in p.expected_date
                ? p.expected_date.Time
                : null
          if (!dateValue) return
          const expectedDate = new Date(dateValue)
          if (isNaN(expectedDate.getTime())) return

          // Только платежи от сегодня до конца месяца
          if (expectedDate < todayStart || expectedDate > monthEndDate) return

          const isToday = expectedDate >= todayStart && expectedDate <= todayEnd

          payments.push({
            id: p.id,
            type: 'income',
            name: p.source,
            amount: p.expected_amount,
            date: format(expectedDate, 'd MMM', { locale: ru }),
            isToday,
            rawDate: expectedDate,
          })
        })
    }

    // Сортируем по дате (сегодняшние будут первыми)
    payments.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())

    return payments
  }, [upcomingPlannedExpensesData, upcomingPlannedIncomesData, now])

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

      {/* Overdue Events */}
      {overdueEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-medium text-red-500">
                    Просроченные платежи
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {overdueEvents.length} платежей требуют внимания
                  </p>
                </div>
              </div>
              <Link to="/planned-payments">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Все платежи
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border/30">
                {overdueEvents.map((event, index) => (
                  <OverdueEvent
                    key={event.id}
                    type={event.type}
                    name={event.name}
                    amount={event.amount}
                    categoryName={event.categoryName}
                    daysOverdue={event.daysOverdue}
                    index={index}
                    onClick={() => navigate('/planned-payments')}
                  />
                ))}
              </div>

              {/* Итого просрочено */}
              <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Итого просрочено:</span>
                <div className="flex items-center gap-3">
                  {overdueEvents.some((e) => e.type === 'income') && (
                    <span className="text-emerald-500 font-medium tabular-nums">
                      +{formatMoney(
                        overdueEvents
                          .filter((e) => e.type === 'income')
                          .reduce((sum, e) => sum + e.amount, 0)
                      )} ₽
                    </span>
                  )}
                  {overdueEvents.some((e) => e.type === 'expense') && (
                    <span className="text-red-500 font-medium tabular-nums">
                      −{formatMoney(
                        overdueEvents
                          .filter((e) => e.type === 'expense')
                          .reduce((sum, e) => sum + e.amount, 0)
                      )} ₽
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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

      {/* Budget & Expenses Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Расходы за месяц */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/10">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Расходы за {currentMonth}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums text-red-500">
                      {formatMoney(stats.totalMonthlyExpenses)}
                    </span>
                    <span className="text-muted-foreground">₽</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.monthlyExpensesCount} операций
                  </p>
                </div>
              </div>

              {/* Бюджет */}
              {budgetStats.hasBudget ? (
                <div className="flex-1 max-w-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-violet-500" />
                    <span className="text-sm font-medium">
                      Бюджет: {formatMoney(budgetStats.totalPlanned)} ₽
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      По категориям: <span className="font-medium text-foreground">{formatMoney(budgetStats.totalActual)} ₽</span>
                    </span>
                    <span className={budgetStats.remaining >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                      {budgetStats.remaining >= 0 ? 'Осталось' : 'Превышение'}: {formatMoney(Math.abs(budgetStats.remaining))} ₽
                    </span>
                  </div>
                  <Progress
                    value={budgetStats.progress}
                    className="h-2"
                    style={{
                      '--progress-background': budgetStats.progress > 90 ? '#ef4444' : budgetStats.progress > 75 ? '#f97316' : '#8b5cf6',
                    } as React.CSSProperties}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {formatPercent(budgetStats.progress)} от запланированного • {budgetStats.itemsCount} категорий
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Бюджет не создан</p>
                    <p className="text-xs text-muted-foreground">Создайте бюджет для контроля расходов</p>
                  </div>
                </div>
              )}

              <Link to="/budget">
                <Button variant="outline" size="sm" className="gap-1.5">
                  {budgetStats.hasBudget ? 'Подробнее' : 'Создать'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
                      balance={fb.totalBase}
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
                <div>
                  <CardTitle className="text-base font-medium">
                    Ближайшие платежи
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    до конца месяца
                  </p>
                </div>
              </div>
              <Link to="/planned-payments">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Все платежи
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {upcomingPayments.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {upcomingPayments.map((payment, index) => (
                    <UpcomingPayment
                      key={payment.id}
                      type={payment.type}
                      name={payment.name}
                      amount={payment.amount}
                      date={payment.date}
                      categoryName={payment.categoryName}
                      isToday={payment.isToday}
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
                      Запланированные платежи появятся здесь
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
