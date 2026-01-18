import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Banknote,
  Building2,
  Calendar,
  Loader2,
  PiggyBank,
  AlertCircle,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { useIncome, useConfirmDistribution } from '../hooks'
import { IncomeDistributionCard } from './income-distribution-card'
import { ConfirmDistributionDialog } from './confirm-distribution-dialog'
import type { IncomeDistribution, ConfirmDistributionRequest } from '@/lib/api/types'

interface IncomeDetailSheetProps {
  incomeId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

export function IncomeDetailSheet({
  incomeId,
  open,
  onOpenChange,
}: IncomeDetailSheetProps) {
  const { data: income, isLoading, error } = useIncome(incomeId ?? '')
  const confirmDistribution = useConfirmDistribution()

  const [selectedDistribution, setSelectedDistribution] =
    useState<IncomeDistribution | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const handleConfirmClick = (distribution: IncomeDistribution) => {
    setSelectedDistribution(distribution)
    setConfirmDialogOpen(true)
  }

  const handleConfirm = (data: ConfirmDistributionRequest) => {
    if (!incomeId || !selectedDistribution) return

    confirmDistribution.mutate(
      {
        incomeId,
        fundId: selectedDistribution.fund_id,
        data,
      },
      {
        onSuccess: () => {
          setConfirmDialogOpen(false)
          setSelectedDistribution(null)
        },
      }
    )
  }

  if (!incomeId) return null

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
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Banknote className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p>Доход</p>
                {income && (
                  <p className="text-2xl font-bold text-emerald-500">
                    +{formatMoney(income.amount)} {getCurrencySymbol(income.currency)}
                  </p>
                )}
              </div>
            </SheetTitle>
            <SheetDescription asChild>
              <div className="space-y-1">
                {income && (
                  <>
                    <p className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      <span>{income.source}</span>
                    </p>
                    {income.account_name && (
                      <p className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{income.account_name}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(income.date)}</span>
                    </p>
                  </>
                )}
              </div>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Loading State */}
            {isLoading && (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  Ошибка загрузки: {error.message}
                </p>
              </div>
            )}

            {/* Content */}
            {income && !isLoading && (
              <>
                {/* Distribution Summary */}
                {distributions.length > 0 && (
                  <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-medium">
                          Распределение по фондам
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {completedDistributions.length} из {distributions.length}
                      </span>
                    </div>
                    <Progress value={confirmProgress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Подтверждено: {formatMoney(totalConfirmed)} ₽</span>
                      <span>Всего: {formatMoney(totalPlanned)} ₽</span>
                    </div>
                  </div>
                )}

                {/* Remaining for Budget */}
                <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Остаток на расходы
                    </span>
                    <span className="text-lg font-semibold tabular-nums">
                      {formatMoney(income.remaining_for_budget)} ₽
                    </span>
                  </div>
                </div>

                {/* Pending Distributions */}
                {pendingDistributions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Ожидают подтверждения
                    </h3>
                    <AnimatePresence mode="popLayout">
                      {pendingDistributions.map((distribution) => (
                        <IncomeDistributionCard
                          key={distribution.id}
                          distribution={distribution}
                          incomeAmount={income.amount}
                          onConfirm={() => handleConfirmClick(distribution)}
                          isConfirming={
                            confirmDistribution.isPending &&
                            selectedDistribution?.id === distribution.id
                          }
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Completed Distributions */}
                {completedDistributions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Подтверждённые
                    </h3>
                    <motion.div className="space-y-2">
                      {completedDistributions.map((distribution) => (
                        <IncomeDistributionCard
                          key={distribution.id}
                          distribution={distribution}
                          incomeAmount={income.amount}
                          onConfirm={() => {}}
                        />
                      ))}
                    </motion.div>
                  </div>
                )}

                {/* No Distributions */}
                {distributions.length === 0 && (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 text-center">
                    <PiggyBank className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Нет распределений по фондам
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Добавьте правила распределения для автоматического
                      распределения доходов
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirm Distribution Dialog */}
      <ConfirmDistributionDialog
        distribution={selectedDistribution}
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirm}
        isConfirming={confirmDistribution.isPending}
      />
    </>
  )
}
