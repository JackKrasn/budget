import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Wallet,
  Target,
  PiggyBank,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { useDataStore } from '@/stores/data-store'
import { CURRENCY_SYMBOLS } from '@/types'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(amount)
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const { funds, incomes, getTotalDistributionPercentage } = useDataStore()

  const activeFunds = funds.filter((f) => f.status === 'active')
  const totalBalance = activeFunds.reduce((sum, f) => sum + f.currentBalance, 0)
  const totalPercentage = getTotalDistributionPercentage()
  const fundsWithGoals = activeFunds.filter((f) => f.targetAmount)

  // Calculate total income this month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthIncomes = incomes.filter(
    (i) => new Date(i.createdAt) >= monthStart
  )
  const totalMonthIncome = thisMonthIncomes.reduce((sum, i) => sum + i.amount, 0)
  const totalDistributed = thisMonthIncomes.reduce(
    (sum, i) =>
      sum +
      i.distributions.reduce(
        (dSum, d) => dSum + (d.isCompleted ? d.actualAmount : 0),
        0
      ),
    0
  )

  const stats = [
    {
      title: 'Всего в фондах',
      value: formatMoney(totalBalance),
      currency: CURRENCY_SYMBOLS.RUB,
      subtitle: `${activeFunds.length} активных фондов`,
      icon: PiggyBank,
      color: 'text-primary',
    },
    {
      title: 'Доходы за месяц',
      value: formatMoney(totalMonthIncome),
      currency: CURRENCY_SYMBOLS.RUB,
      subtitle: `${thisMonthIncomes.length} поступлений`,
      icon: TrendingUp,
      color: 'text-chart-2',
    },
    {
      title: 'Распределено',
      value: formatMoney(totalDistributed),
      currency: CURRENCY_SYMBOLS.RUB,
      subtitle: `${totalPercentage}% от дохода`,
      icon: Wallet,
      color: 'text-chart-3',
    },
    {
      title: 'Цели с прогрессом',
      value: `${fundsWithGoals.length}`,
      currency: '',
      subtitle: 'фондов с целевой суммой',
      icon: Target,
      color: 'text-chart-4',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Добро пожаловать
          </h1>
          <p className="mt-1 text-muted-foreground">
            Обзор вашего финансового состояния
          </p>
        </div>
        <Link to="/funds">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Распределить доход
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.title} variants={item}>
              <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color} opacity-70`} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums tracking-tight">
                      {stat.value}
                    </span>
                    {stat.currency && (
                      <span className="text-lg text-muted-foreground">
                        {stat.currency}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Funds Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              Прогресс фондов
            </CardTitle>
            <Link to="/funds">
              <Button variant="ghost" size="sm" className="gap-1">
                Все фонды
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {fundsWithGoals.length > 0 ? (
              <div className="space-y-4">
                {fundsWithGoals.map((fund) => {
                  const progress = fund.targetAmount
                    ? Math.min(
                        (fund.currentBalance / fund.targetAmount) * 100,
                        100
                      )
                    : 0
                  return (
                    <div key={fund.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: fund.color }}
                          />
                          <span className="text-sm font-medium">
                            {fund.name}
                          </span>
                        </div>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {formatMoney(fund.currentBalance)} /{' '}
                          {formatMoney(fund.targetAmount || 0)}{' '}
                          {CURRENCY_SYMBOLS.RUB}
                        </span>
                      </div>
                      <Progress
                        value={progress}
                        className="h-2"
                        style={
                          {
                            '--progress-background': fund.color,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-[150px] flex-col items-center justify-center gap-2 text-center">
                <Target className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Нет фондов с целевой суммой
                </p>
                <Link to="/funds">
                  <Button variant="outline" size="sm">
                    Создать фонд с целью
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Incomes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              Последние доходы
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomes.length > 0 ? (
              <div className="space-y-3">
                {incomes.slice(0, 5).map((income) => {
                  const completedCount = income.distributions.filter(
                    (d) => d.isCompleted
                  ).length
                  const totalCount = income.distributions.length
                  return (
                    <div
                      key={income.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatMoney(income.amount)} {CURRENCY_SYMBOLS.RUB}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {income.source === 'salary'
                              ? 'Зарплата'
                              : income.source === 'advance'
                              ? 'Аванс'
                              : income.source === 'bonus'
                              ? 'Бонус'
                              : 'Другое'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(income.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm">
                          {completedCount} / {totalCount}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          распределено
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-[150px] flex-col items-center justify-center gap-2 text-center">
                <Wallet className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Нет записей о доходах
                </p>
                <Link to="/funds">
                  <Button variant="outline" size="sm">
                    Добавить доход
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
