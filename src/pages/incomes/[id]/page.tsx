import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  Building2,
  Calendar,
  PiggyBank,
  AlertCircle,
  Check,
  Pencil,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useIncome, useConfirmDistribution, useCancelDistribution, useUpdateDistribution, useCreateDistribution } from '@/features/incomes/hooks'
import { ConfirmDistributionDialog } from '@/features/incomes/components/confirm-distribution-dialog'
import { ConfirmDistributionInfoDialog } from '@/features/incomes/components/confirm-distribution-info-dialog'
import { EditDistributionDialog } from '@/features/incomes/components/edit-distribution-dialog'
import { AddDistributionDialog } from '@/features/incomes/components/add-distribution-dialog'
import { CancellationResultDialog } from '@/features/incomes/components/cancellation-result-dialog'
import { FundIcon } from '@/components/common/category-icon'
import { cn } from '@/lib/utils'
import type { IncomeDistribution, ConfirmDistributionRequest, CancelDistributionResponse } from '@/lib/api/types'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    GEL: '₾',
    TRY: '₺',
  }
  return symbols[currency] || currency
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function IncomeDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: income, error, isLoading } = useIncome(id ?? '')
  const confirmDistribution = useConfirmDistribution()
  const cancelDistribution = useCancelDistribution()
  const updateDistribution = useUpdateDistribution()
  const createDistribution = useCreateDistribution()

  const [selectedDistribution, setSelectedDistribution] = useState<IncomeDistribution | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmInfoDialogOpen, setConfirmInfoDialogOpen] = useState(false)
  const [pendingConfirmData, setPendingConfirmData] = useState<ConfirmDistributionRequest | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingDistribution, setEditingDistribution] = useState<IncomeDistribution | null>(null)
  const [cancellationResult, setCancellationResult] = useState<CancelDistributionResponse | null>(null)
  const [cancellationResultDialogOpen, setCancellationResultDialogOpen] = useState(false)

  const handleConfirmClick = (distribution: IncomeDistribution) => {
    setSelectedDistribution(distribution)
    setConfirmDialogOpen(true)
  }

  const handleEditClick = (distribution: IncomeDistribution) => {
    setEditingDistribution(distribution)
    setEditDialogOpen(true)
  }

  const handleConfirm = (data: ConfirmDistributionRequest) => {
    if (!selectedDistribution) return

    // Store data and show info dialog first
    setPendingConfirmData(data)
    setConfirmDialogOpen(false)
    setConfirmInfoDialogOpen(true)
  }

  const handleFinalConfirm = () => {
    if (!id || !selectedDistribution || !pendingConfirmData) return

    confirmDistribution.mutate(
      {
        incomeId: id,
        fundId: selectedDistribution.fund_id,
        data: pendingConfirmData,
      },
      {
        onSuccess: () => {
          setConfirmInfoDialogOpen(false)
          setSelectedDistribution(null)
          setPendingConfirmData(null)
        },
      }
    )
  }

  const handleUpdateDistribution = (plannedAmount: number) => {
    if (!id || !editingDistribution) return

    updateDistribution.mutate(
      {
        incomeId: id,
        fundId: editingDistribution.fund_id,
        data: { plannedAmount },
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false)
          setEditingDistribution(null)
        },
      }
    )
  }

  const handleAddDistribution = (fundId: string, plannedAmount: number) => {
    if (!id) return

    createDistribution.mutate({
      incomeId: id,
      data: { fundId, plannedAmount },
    })
  }

  const handleCancelDistribution = (distribution: IncomeDistribution) => {
    if (!id) return

    const confirmCancel = confirm(
      `Отменить распределение в фонд "${distribution.fund_name}"?\n\n` +
      `Сумма ${formatMoney(distribution.actual_amount ?? 0)} ₽ вернётся на счёт.\n` +
      `Распределение вернётся в статус "Не подтверждено".`
    )

    if (!confirmCancel) return

    setSelectedDistribution(distribution)

    cancelDistribution.mutate(
      {
        incomeId: id,
        fundId: distribution.fund_id,
      },
      {
        onSuccess: (data) => {
          setSelectedDistribution(null)
          setCancellationResult(data)
          setCancellationResultDialogOpen(true)
        },
        onError: () => {
          setSelectedDistribution(null)
        },
      }
    )
  }

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>ID дохода не указан</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/incomes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к доходам
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ошибка при загрузке дохода: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // If no income data, show not found
  if (!income) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/incomes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к доходам
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Доход не найден</AlertDescription>
        </Alert>
      </div>
    )
  }

  const distributions = income?.distributions ?? []
  const completedDistributions = distributions.filter((d) => d.is_completed)
  const pendingDistributions = distributions.filter((d) => !d.is_completed)

  const totalPlanned = distributions.reduce((sum, d) => sum + d.planned_amount, 0)
  const totalConfirmed = distributions.reduce(
    (sum, d) => sum + (d.actual_amount ?? 0),
    0
  )
  const confirmProgress =
    totalPlanned > 0 ? Math.round((totalConfirmed / totalPlanned) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/incomes')}
          className="group -ml-2 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Назад к доходам
        </Button>
      </div>

      {/* Hero Card */}
      <div>
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
          {/* Decorative elements */}
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl" />

          <CardContent className="relative p-6 md:p-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              {/* Left side - Icon and Info */}
              <div className="flex items-start gap-5">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg"
                  style={{ boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}
                >
                  <Banknote className="h-7 w-7 text-white" />
                </div>

                <div className="space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                      {income.source}
                    </h1>
                    {income.description && (
                      <p className="mt-1 text-muted-foreground">{income.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {income.account_name && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />
                        <span>{income.account_name}</span>
                        <span>•</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(income.date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Amount */}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Сумма</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums tracking-tight">
                    +{formatMoney(income.amount)}
                  </span>
                  <span className="text-2xl font-medium text-muted-foreground">
                    {getCurrencySymbol(income.currency)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Remaining for Budget */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">На расходы</p>
            <p className="text-xl font-bold tabular-nums mt-1">
              {formatMoney(income.remaining_for_budget)} ₽
            </p>
          </CardContent>
        </Card>

        {/* Planned Distribution */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">В фонды (план)</p>
            <p className="text-xl font-bold tabular-nums mt-1">
              {formatMoney(totalPlanned)} ₽
            </p>
          </CardContent>
        </Card>

        {/* Confirmed Distribution */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Подтверждено</p>
            <p className="text-xl font-bold tabular-nums mt-1 text-emerald-600 dark:text-emerald-400">
              {formatMoney(totalConfirmed)} ₽
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Progress */}
      {distributions.length > 0 && (
        <div>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Распределение по фондам</span>
                <span className="text-sm text-muted-foreground">
                  {completedDistributions.length} из {distributions.length}
                </span>
              </div>
              <Progress value={confirmProgress} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Подтверждено: {formatMoney(totalConfirmed)} ₽</span>
                <span>Всего: {formatMoney(totalPlanned)} ₽</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Distributions */}
      {pendingDistributions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Ожидают подтверждения
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Доступно для распределения:{' '}
                <span className="font-medium text-foreground">
                  {formatMoney(income.amount - totalConfirmed)} {getCurrencySymbol(income.currency)}
                </span>
              </p>
            </div>
            <AddDistributionDialog
              incomeAmount={income.amount}
              existingDistributions={distributions}
              onAdd={handleAddDistribution}
              isAdding={createDistribution.isPending}
            />
          </div>
          <div className="space-y-3">
            {pendingDistributions.map((distribution) => (
              <DistributionCard
                key={distribution.id}
                distribution={distribution}
                incomeAmount={income.amount}
                availableAmount={income.amount - totalConfirmed}
                onConfirm={() => handleConfirmClick(distribution)}
                onEdit={() => handleEditClick(distribution)}
                isConfirming={
                  confirmDistribution.isPending &&
                  selectedDistribution?.id === distribution.id
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Distributions */}
      {completedDistributions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Подтверждённые
            </h3>
            {pendingDistributions.length === 0 && (
              <AddDistributionDialog
                incomeAmount={income.amount}
                existingDistributions={distributions}
                onAdd={handleAddDistribution}
                isAdding={createDistribution.isPending}
              />
            )}
          </div>
          <div className="space-y-3">
            {completedDistributions.map((distribution) => (
              <DistributionCard
                key={distribution.id}
                distribution={distribution}
                incomeAmount={income.amount}
                onConfirm={() => {}}
                onEdit={() => {}}
                onCancel={() => handleCancelDistribution(distribution)}
                isCancelling={
                  cancelDistribution.isPending &&
                  selectedDistribution?.id === distribution.id
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* No Distributions */}
      {distributions.length === 0 && (
        <div>
          <Card className="border-dashed border-2 border-border/50 bg-card/30">
            <CardContent className="flex h-48 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                <PiggyBank className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-medium">Нет распределений по фондам</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Добавьте распределение вручную или настройте правила для автоматического распределения
                </p>
              </div>
              <AddDistributionDialog
                incomeAmount={income.amount}
                existingDistributions={distributions}
                onAdd={handleAddDistribution}
                isAdding={createDistribution.isPending}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirm Distribution Dialog */}
      <ConfirmDistributionDialog
        distribution={selectedDistribution}
        incomeDate={income.date}
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirm}
        isConfirming={confirmDistribution.isPending}
      />

      {/* Confirm Distribution Info Dialog */}
      <ConfirmDistributionInfoDialog
        accountName={income.source_account_name}
        fundName={selectedDistribution?.fund_name || ''}
        amount={pendingConfirmData?.actualAmount || 0}
        open={confirmInfoDialogOpen}
        onOpenChange={setConfirmInfoDialogOpen}
        onConfirm={handleFinalConfirm}
      />

      {/* Edit Distribution Dialog */}
      <EditDistributionDialog
        distribution={editingDistribution}
        incomeAmount={income.amount}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleUpdateDistribution}
        isSaving={updateDistribution.isPending}
      />

      {/* Cancellation Result Dialog */}
      <CancellationResultDialog
        result={cancellationResult}
        open={cancellationResultDialogOpen}
        onOpenChange={setCancellationResultDialogOpen}
      />
    </div>
  )
}

// Distribution Card Component
interface DistributionCardProps {
  distribution: IncomeDistribution
  incomeAmount: number
  availableAmount?: number
  onConfirm: () => void
  onEdit: () => void
  onCancel?: () => void
  isConfirming?: boolean
  isCancelling?: boolean
}

function DistributionCard({
  distribution,
  incomeAmount,
  availableAmount,
  onConfirm,
  onEdit,
  onCancel,
  isConfirming,
  isCancelling,
}: DistributionCardProps) {
  const isCompleted = distribution.is_completed
  const actualAmount = distribution.actual_amount ?? 0
  const displayAmount = isCompleted ? actualAmount : distribution.planned_amount

  const percentage =
    incomeAmount > 0 ? Math.round((displayAmount / incomeAmount) * 100) : 0

  const progress =
    distribution.planned_amount > 0
      ? Math.round((actualAmount / distribution.planned_amount) * 100)
      : 0

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border p-4 transition-all duration-200',
        isCompleted
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-border/50 bg-card/50 backdrop-blur-sm hover:border-border hover:bg-card/80 hover:shadow-sm'
      )}
    >
      {/* Fund Icon */}
      <FundIcon
        name={distribution.fund_name}
        color={distribution.fund_color}
        size="lg"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{distribution.fund_name}</p>
          <Badge variant="secondary" className="text-xs">
            {percentage}%
          </Badge>
          {isCompleted && (
            <Badge
              variant="secondary"
              className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-xs"
            >
              <Check className="h-3 w-3" />
              Подтверждено
            </Badge>
          )}
        </div>

        {/* Progress bar for completed with difference */}
        {isCompleted && distribution.actual_amount !== distribution.planned_amount && (
          <div className="mt-2">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Факт: {formatMoney(actualAmount)} ₽</span>
              <span>План: {formatMoney(distribution.planned_amount)} ₽</span>
            </div>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p
          className={cn(
            'text-lg font-semibold tabular-nums',
            isCompleted ? 'text-emerald-600 dark:text-emerald-400' : ''
          )}
        >
          {formatMoney(displayAmount)} ₽
        </p>
        {!isCompleted && (
          <p className="text-xs text-muted-foreground">запланировано</p>
        )}
        {!isCompleted && availableAmount !== undefined && (
          <p className={cn(
            'text-xs mt-0.5',
            availableAmount >= distribution.planned_amount
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400'
          )}>
            доступно {formatMoney(availableAmount)} ₽
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="h-8 w-8 p-0"
            title="Изменить сумму"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Подтверждение...' : 'Подтвердить'}
          </Button>
        </div>
      )}
      {isCompleted && onCancel && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={isCancelling}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
            title="Отменить распределение"
          >
            <XCircle className="h-4 w-4" />
            {isCancelling ? 'Отмена...' : 'Отменить'}
          </Button>
        </div>
      )}
    </div>
  )
}
