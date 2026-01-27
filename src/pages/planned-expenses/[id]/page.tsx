import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Receipt,
  Calendar,
  PiggyBank,
  AlertCircle,
  Clock,
  CheckCircle,
  SkipForward,
  Wallet,
  Check,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AccountIcon } from '@/components/ui/account-icon'
import { CURRENCY_SYMBOLS } from '@/types'
import {
  usePlannedExpense,
  useConfirmPlannedExpenseWithExpense,
  useSkipPlannedExpense,
  useDeletePlannedExpense,
} from '@/features/budget'
import { ConfirmPlannedExpenseDialog } from '@/features/budget/components/confirm-planned-expense-dialog'
import { useAccounts } from '@/features/accounts'
import { cn } from '@/lib/utils'
import type { PlannedExpenseStatus, PlannedExpenseWithDetails } from '@/lib/api/types'

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

// Извлечь число из nullable типа бэкенда
function getActualAmount(
  value: number | { Float64: number; Valid: boolean } | null | undefined
): number | null {
  if (value == null) return null
  if (typeof value === 'number') return value
  if (typeof value === 'object' && 'Valid' in value && value.Valid) {
    return value.Float64
  }
  return null
}

const STATUS_CONFIG: Record<
  PlannedExpenseStatus,
  { label: string; icon: typeof Clock; color: string; bgColor: string }
> = {
  pending: {
    label: 'Ожидает оплаты',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  confirmed: {
    label: 'Оплачено',
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

export default function PlannedExpenseDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const { data: plannedExpense, error, isLoading } = usePlannedExpense(id ?? '')
  const { data: accountsData } = useAccounts()
  const confirmPlannedWithExpense = useConfirmPlannedExpenseWithExpense()
  const skipPlanned = useSkipPlannedExpense()
  const deletePlanned = useDeletePlannedExpense()

  const accounts = accountsData?.data ?? []

  const handleConfirm = async (data: {
    actualAmount?: number
    accountId: string
    categoryId?: string
    date: string
    notes?: string
    tagIds?: string[]
  }) => {
    if (!plannedExpense) return

    try {
      await confirmPlannedWithExpense.mutateAsync({
        id: plannedExpense.id,
        data,
        budgetId: plannedExpense.budget_id,
      })
      setConfirmDialogOpen(false)
      // Обновляем страницу или переходим обратно
      navigate(-1)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleSkip = async () => {
    if (!plannedExpense) return

    try {
      await skipPlanned.mutateAsync(plannedExpense.id)
      navigate(-1)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  const handleDelete = async () => {
    if (!plannedExpense) return
    if (!confirm('Удалить этот запланированный расход?')) return

    try {
      await deletePlanned.mutateAsync(plannedExpense.id)
      navigate(-1)
    } catch {
      // Ошибка обрабатывается в хуке
    }
  }

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>ID запланированного расхода не указан</AlertDescription>
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

  if (!plannedExpense) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Запланированный расход не найден</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Cast to PlannedExpenseWithDetails for proper type support
  const expense = plannedExpense as PlannedExpenseWithDetails
  const statusConfig = STATUS_CONFIG[expense.status]
  const StatusIcon = statusConfig.icon
  const isPending = expense.status === 'pending'
  const fundedAmount = getActualAmount(expense.funded_amount)
  const actualAmount = getActualAmount(expense.actual_amount)
  const fromBudget = fundedAmount ? expense.planned_amount - fundedAmount : expense.planned_amount

  // Находим счет по умолчанию
  const defaultAccount = accounts.find((a) => a.id === expense.account_id)

  // Валюта расхода
  const currency = expense.currency || 'RUB'
  const currencySymbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency

  // Проверка просрочки
  const getOverdueDays = (): number | null => {
    if (expense.status !== 'pending') return null
    const dateStr = typeof expense.planned_date === 'string'
      ? expense.planned_date
      : expense.planned_date?.Time
    if (!dateStr) return null
    const plannedDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    plannedDate.setHours(0, 0, 0, 0)
    const diffTime = today.getTime() - plannedDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : null
  }
  const overdueDays = getOverdueDays()

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
            expense.status === 'confirmed'
              ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
              : 'bg-card/50 backdrop-blur-sm'
          )}
        >
          {/* Decorative elements */}
          {expense.status === 'confirmed' && (
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl bg-emerald-500/10" />
          )}

          <CardContent className="relative p-6 md:p-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              {/* Left side - Icon and Info */}
              <div className="flex items-start gap-5">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg',
                    expense.status === 'confirmed'
                      ? 'bg-emerald-500'
                      : 'bg-primary'
                  )}
                  style={
                    expense.status === 'confirmed'
                      ? { boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }
                      : undefined
                  }
                >
                  <Receipt className="h-7 w-7 text-white" />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {expense.name}
                      </h1>
                      <Badge
                        variant="secondary"
                        className={cn(statusConfig.bgColor, statusConfig.color)}
                      >
                        <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                        {statusConfig.label}
                      </Badge>
                      {overdueDays !== null && overdueDays > 0 && (
                        <Badge
                          variant="destructive"
                          className="bg-red-500/10 text-red-500 border-red-500/30"
                        >
                          <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                          Просрочен на {overdueDays} {overdueDays === 1 ? 'день' : overdueDays < 5 ? 'дня' : 'дней'}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-muted-foreground">{expense.category_name}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>Запланировано на: {formatDate(expense.planned_date)}</span>
                    </div>
                    {defaultAccount && (
                      <div className="flex items-center gap-1.5">
                        <AccountIcon
                          bankName={defaultAccount.bank_name}
                          typeCode={defaultAccount.type_code}
                          color={defaultAccount.color}
                          size="sm"
                          showBackground={false}
                        />
                        <span>{defaultAccount.name}</span>
                      </div>
                    )}
                  </div>

                  {expense.notes && (
                    <p className="text-sm text-muted-foreground">{expense.notes}</p>
                  )}
                </div>
              </div>

              {/* Right side - Amount and Action */}
              <div className="text-right space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {expense.status === 'confirmed' ? 'Оплачено' : 'К оплате'}
                  </p>
                  <div className="flex items-baseline gap-2 justify-end">
                    <span
                      className={cn(
                        'text-4xl font-bold tabular-nums tracking-tight',
                        expense.status === 'confirmed' && 'text-emerald-500'
                      )}
                    >
                      {formatMoney(
                        expense.status === 'confirmed' && actualAmount != null
                          ? actualAmount
                          : expense.planned_amount
                      )}
                    </span>
                    <span className="text-2xl font-medium text-muted-foreground">{currencySymbol}</span>
                  </div>
                  {/* Сумма в базовой валюте для иностранных валют */}
                  {currency !== 'RUB' && expense.planned_amount_base > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ≈ {formatMoney(expense.planned_amount_base)} ₽
                      {(() => {
                        const rate = getActualAmount(expense.exchange_rate as number | { Float64: number; Valid: boolean } | null)
                        return rate ? (
                          <span className="ml-1 text-xs">
                            (курс {rate.toFixed(2)})
                          </span>
                        ) : null
                      })()}
                    </p>
                  )}
                  {expense.status === 'confirmed' && actualAmount != null && actualAmount !== expense.planned_amount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Запланировано: {formatMoney(expense.planned_amount)} {currencySymbol}
                      {actualAmount < expense.planned_amount && (
                        <span className="text-emerald-500 ml-2">
                          (экономия {formatMoney(expense.planned_amount - actualAmount)} {currencySymbol})
                        </span>
                      )}
                    </p>
                  )}
                </div>
                {isPending && (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                      disabled={deletePlanned.isPending}
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      disabled={skipPlanned.isPending}
                    >
                      <SkipForward className="mr-2 h-4 w-4" />
                      Пропустить
                    </Button>
                    <Button
                      onClick={() => setConfirmDialogOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Подтвердить
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* From Budget */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <Wallet className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Из бюджета</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(fromBudget)} {currencySymbol}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* From Fund */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <PiggyBank className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Из фонда</p>
                <p className="text-xl font-bold tabular-nums">
                  {fundedAmount ? `${formatMoney(fundedAmount)} ${currencySymbol}` : '—'}
                </p>
                {expense.fund_name && (
                  <p className="text-xs text-muted-foreground">{expense.fund_name}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Receipt className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Категория</p>
                <p className="text-base font-medium">{expense.category_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund Financing Details */}
      {fundedAmount !== null && fundedAmount > 0 && expense.fund_name && (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <PiggyBank className="h-5 w-5 text-violet-500 mt-0.5" />
              <div>
                <p className="font-medium text-violet-700 dark:text-violet-400">
                  Финансирование из фонда
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Из фонда «{expense.fund_name}» будет списано {formatMoney(fundedAmount)} {currencySymbol}
                  {fromBudget > 0 && `, остальные ${formatMoney(fromBudget)} ${currencySymbol} — из бюджета`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed State Notice */}
      {expense.status === 'confirmed' && expense.actual_expense_id && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  Оплата подтверждена
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Расход был создан и средства списаны со счёта.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate(`/expenses?highlight=${expense.actual_expense_id}`)}
                >
                  Перейти к расходу
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <ConfirmPlannedExpenseDialog
        expense={expense}
        accounts={accounts}
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirm}
        isPending={confirmPlannedWithExpense.isPending}
      />
    </div>
  )
}
