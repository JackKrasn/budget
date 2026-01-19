import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  Calendar,
  PiggyBank,
  AlertCircle,
  Clock,
  CheckCircle,
  SkipForward,
  Wallet,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FundIcon } from '@/components/common/category-icon'
import { usePlannedIncome, useCreateIncomeAndReceive } from '@/features/budget'
import { ReceiveIncomeDialog } from '@/features/budget/components/receive-income-dialog'
import { useActiveDistributionRules } from '@/features/funds/hooks/use-distribution-rules'
import { useFunds } from '@/features/funds'
import { cn } from '@/lib/utils'
import type { PlannedIncomeStatus } from '@/lib/api/types'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string | { Time: string; Valid: boolean } | null | undefined): string {
  if (!dateStr) return '—'
  const dateValue = typeof dateStr === 'string' ? dateStr : dateStr.Valid ? dateStr.Time : null
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const STATUS_CONFIG: Record<
  PlannedIncomeStatus,
  { label: string; icon: typeof Clock; color: string; bgColor: string }
> = {
  pending: {
    label: 'Ожидается',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  received: {
    label: 'Получено',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  skipped: {
    label: 'Пропущено',
    icon: SkipForward,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
}

interface ExpectedDistribution {
  fundId: string
  fundName: string
  fundIcon: string
  fundColor: string
  ruleType: 'percentage' | 'fixed'
  ruleValue: number
  expectedAmount: number
  percentage: number
}

export default function PlannedIncomeDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)

  const { data: plannedIncome, error, isLoading } = usePlannedIncome(id ?? '')
  const { data: rulesData } = useActiveDistributionRules()
  const { data: fundsData } = useFunds()
  const createIncomeAndReceive = useCreateIncomeAndReceive()

  const rules = rulesData?.data ?? []
  const fundBalances = fundsData?.data ?? []

  // Calculate expected distributions based on active distribution rules
  const expectedDistributions = useMemo<ExpectedDistribution[]>(() => {
    if (!plannedIncome || rules.length === 0 || fundBalances.length === 0) return []

    const amount = plannedIncome.expected_amount

    return rules
      .filter((rule) => rule.is_active)
      .map((rule) => {
        const fundBalance = fundBalances.find((fb) => fb.fund.id === rule.fund_id)
        if (!fundBalance) return null

        const fund = fundBalance.fund
        let expectedAmount = 0
        let percentage = 0

        if (rule.rule_type === 'percentage' && rule.value) {
          percentage = rule.value
          expectedAmount = Math.round((amount * rule.value) / 100)
        } else if (rule.rule_type === 'fixed' && rule.value) {
          expectedAmount = rule.value
          percentage = amount > 0 ? Math.round((rule.value / amount) * 100) : 0
        }

        return {
          fundId: fund.id,
          fundName: fund.name,
          fundIcon: fund.icon,
          fundColor: fund.color,
          ruleType: rule.rule_type,
          ruleValue: rule.value ?? 0,
          expectedAmount,
          percentage,
        }
      })
      .filter((d): d is ExpectedDistribution => d !== null && d.expectedAmount > 0)
      .sort((a, b) => b.expectedAmount - a.expectedAmount)
  }, [plannedIncome, rules, fundBalances])

  const totalDistribution = expectedDistributions.reduce(
    (sum, d) => sum + d.expectedAmount,
    0
  )
  const remainingForBudget = plannedIncome
    ? plannedIncome.expected_amount - totalDistribution
    : 0
  const totalPercentage = expectedDistributions.reduce((sum, d) => sum + d.percentage, 0)

  const handleConfirmReceiveIncome = async (data: {
    actualAmount: number
    actualDate: string
    accountId: string
  }) => {
    if (!plannedIncome) return

    try {
      const income = await createIncomeAndReceive.mutateAsync({
        incomeData: {
          source: plannedIncome.source,
          amount: data.actualAmount,
          currency: plannedIncome.currency || 'RUB',
          date: data.actualDate,
          accountId: data.accountId,
        },
        plannedIncomeId: plannedIncome.id,
      })
      setReceiveDialogOpen(false)
      // Переходим на страницу полученного дохода
      navigate(`/incomes/${income.id}`)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>ID запланированного дохода не указан</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ошибка при загрузке: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!plannedIncome) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Запланированный доход не найден</AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[plannedIncome.status]
  const StatusIcon = statusConfig.icon
  const isPending = plannedIncome.status === 'pending'

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="group -ml-2 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Назад
        </Button>
      </div>

      {/* Hero Card */}
      <div>
        <Card
          className={cn(
            'relative overflow-hidden border-border/50',
            isPending
              ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent'
              : plannedIncome.status === 'received'
                ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
                : 'bg-gradient-to-br from-muted/30 via-muted/10 to-transparent'
          )}
        >
          {/* Decorative elements */}
          <div
            className={cn(
              'absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl',
              isPending
                ? 'bg-amber-500/10'
                : plannedIncome.status === 'received'
                  ? 'bg-emerald-500/10'
                  : 'bg-muted/10'
            )}
          />

          <CardContent className="relative p-6 md:p-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              {/* Left side - Icon and Info */}
              <div className="flex items-start gap-5">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg',
                    isPending
                      ? 'bg-amber-500'
                      : plannedIncome.status === 'received'
                        ? 'bg-emerald-500'
                        : 'bg-muted'
                  )}
                  style={
                    isPending
                      ? { boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)' }
                      : plannedIncome.status === 'received'
                        ? { boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }
                        : undefined
                  }
                >
                  <Banknote className="h-7 w-7 text-white" />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {plannedIncome.source}
                      </h1>
                      <Badge
                        variant="secondary"
                        className={cn(statusConfig.bgColor, statusConfig.color)}
                      >
                        <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    {plannedIncome.notes && (
                      <p className="mt-1 text-muted-foreground">{plannedIncome.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>Ожидается: {formatDate(plannedIncome.expected_date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Amount and Action */}
              <div className="text-right space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Ожидаемая сумма</p>
                  <div className="flex items-baseline gap-2 justify-end">
                    <span className="text-4xl font-bold tabular-nums tracking-tight">
                      {formatMoney(plannedIncome.expected_amount)}
                    </span>
                    <span className="text-2xl font-medium text-muted-foreground">₽</span>
                  </div>
                </div>
                {isPending && (
                  <Button
                    onClick={() => setReceiveDialogOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Получить доход
                  </Button>
                )}
                {plannedIncome.status === 'received' && plannedIncome.actual_income_id && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/incomes/${plannedIncome.actual_income_id}`)}
                  >
                    Перейти к доходу
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total to Distribute */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <PiggyBank className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">В фонды</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(totalDistribution)} ₽
                </p>
                <p className="text-xs text-muted-foreground">{totalPercentage}% от дохода</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remaining for Budget */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <Wallet className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">На расходы</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(remainingForBudget)} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  {100 - totalPercentage}% от дохода
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funds Count */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Фондов</p>
                <p className="text-xl font-bold tabular-nums">
                  {expectedDistributions.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  по правилам распределения
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expected Distributions */}
      {expectedDistributions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Ожидаемое распределение по фондам
            </h3>
            {isPending && (
              <p className="text-xs text-muted-foreground">
                Распределения будут созданы после получения дохода
              </p>
            )}
          </div>

          <div className="space-y-3">
            {expectedDistributions.map((distribution) => (
              <ExpectedDistributionCard
                key={distribution.fundId}
                distribution={distribution}
                incomeAmount={plannedIncome.expected_amount}
                isPending={isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Rules Warning */}
      {expectedDistributions.length === 0 && (
        <div>
          <Card className="border-dashed border-2 border-border/50 bg-card/30">
            <CardContent className="flex h-48 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                <PiggyBank className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-medium">Нет активных правил распределения</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Настройте правила распределения в разделе «Фонды», чтобы автоматически
                  распределять доходы по фондам
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/funds')}>
                Перейти к фондам
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending State Notice */}
      {isPending && expectedDistributions.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Ожидается получение дохода
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  После получения дохода распределения будут созданы автоматически на основе
                  текущих правил. Вы сможете изменить суммы и подтвердить переводы на странице
                  дохода.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receive Income Dialog */}
      <ReceiveIncomeDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        income={plannedIncome}
        onSubmit={handleConfirmReceiveIncome}
        isPending={createIncomeAndReceive.isPending}
      />
    </div>
  )
}

// Expected Distribution Card Component
interface ExpectedDistributionCardProps {
  distribution: ExpectedDistribution
  incomeAmount: number
  isPending: boolean
}

function ExpectedDistributionCard({
  distribution,
  isPending,
}: ExpectedDistributionCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border p-4 transition-all duration-200',
        isPending
          ? 'border-amber-500/20 bg-amber-500/5'
          : 'border-border/50 bg-card/50 backdrop-blur-sm'
      )}
    >
      {/* Fund Icon */}
      <FundIcon name={distribution.fundName} color={distribution.fundColor} size="lg" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{distribution.fundName}</p>
          <Badge variant="secondary" className="text-xs">
            {distribution.percentage}%
          </Badge>
          {distribution.ruleType === 'fixed' && (
            <Badge variant="outline" className="text-xs">
              фикс.
            </Badge>
          )}
        </div>
        {isPending && (
          <div className="mt-2">
            <Progress value={distribution.percentage} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p
          className={cn(
            'text-lg font-semibold tabular-nums',
            isPending ? 'text-amber-600 dark:text-amber-400' : ''
          )}
        >
          {formatMoney(distribution.expectedAmount)} ₽
        </p>
        <p className="text-xs text-muted-foreground">ожидается</p>
      </div>
    </div>
  )
}
