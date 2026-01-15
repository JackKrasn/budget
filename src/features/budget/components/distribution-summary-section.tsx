import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PiggyBank, TrendingUp, TrendingDown, ArrowRight, Check, Clock, Settings, ExternalLink, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FundIcon } from '@/components/common/category-icon'
import { cn } from '@/lib/utils'
import type { DistributionSummary, FundDistributionSummary } from '@/lib/api/types'
import { EditDistributionRulesDialog } from './edit-distribution-rules-dialog'

interface DistributionSummarySectionProps {
  summary?: DistributionSummary
  fundDistributions?: FundDistributionSummary[]
  totalIncome?: number // Общая сумма ожидаемых (запланированных) доходов
  /** Скрыть обёртку и заголовок (когда используется внутри CollapsibleSection) */
  hideWrapper?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function DistributionSummarySection({
  summary,
  fundDistributions,
  totalIncome = 0,
  hideWrapper,
}: DistributionSummarySectionProps) {
  const navigate = useNavigate()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Вычисляем общую сумму плановых распределений (включая вручную добавленные)
  const totalPlannedDistribution = fundDistributions?.reduce(
    (sum, f) => sum + (f.plannedAmount || f.expectedAmount), 0
  ) ?? summary?.totalExpectedDistribution ?? 0

  if (!summary || totalPlannedDistribution === 0) {
    return null
  }

  const confirmProgress = totalPlannedDistribution > 0
    ? Math.round((summary.totalActualDistribution / totalPlannedDistribution) * 100)
    : 0

  const isPositiveDiff = summary.distributionDifference >= 0

  const content = (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Planned Distribution */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Запланировано в фонды</p>
                <p className="text-lg font-bold tabular-nums">
                  {formatMoney(totalPlannedDistribution)} ₽
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Clock className="h-4 w-4 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actual Distribution */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Подтверждено</p>
                <p className="text-lg font-bold tabular-nums text-emerald-500">
                  {formatMoney(summary.totalActualDistribution)} ₽
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remaining for Budget */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">На расходы</p>
                <p className="text-lg font-bold tabular-nums text-cyan-500">
                  {formatMoney(summary.actualRemainingForBudget)} ₽
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                <ArrowRight className="h-4 w-4 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Difference */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {isPositiveDiff ? 'Больше плана' : 'Меньше плана'}
                </p>
                <p
                  className={cn(
                    'text-lg font-bold tabular-nums',
                    isPositiveDiff ? 'text-emerald-500' : 'text-amber-500'
                  )}
                >
                  {isPositiveDiff ? '+' : ''}
                  {formatMoney(summary.distributionDifference)} ₽
                </p>
              </div>
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  isPositiveDiff ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                )}
              >
                {isPositiveDiff ? (
                  <TrendingUp className={cn('h-4 w-4', 'text-emerald-500')} />
                ) : (
                  <TrendingDown className={cn('h-4 w-4', 'text-amber-500')} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Прогресс распределения</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{confirmProgress}%</span>
              {confirmProgress < 100 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => navigate('/incomes')}
                >
                  <ExternalLink className="mr-1.5 h-3 w-3" />
                  Подтвердить
                </Button>
              )}
            </div>
          </div>
          <Progress value={confirmProgress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Подтверждено: {formatMoney(summary.totalActualDistribution)} ₽</span>
            <span>Запланировано: {formatMoney(totalPlannedDistribution)} ₽</span>
          </div>
        </CardContent>
      </Card>

      {/* Fund Details */}
      {fundDistributions && fundDistributions.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">По фондам</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fundDistributions.map((fund) => {
              // Используем plannedAmount (реальные распределения) вместо expectedAmount (по правилам)
              const plannedAmount = fund.plannedAmount || fund.expectedAmount
              const fundProgress = plannedAmount > 0
                ? Math.round((fund.actualAmount / plannedAmount) * 100)
                : 0
              const isCompleted = fund.actualAmount >= plannedAmount

              // Процент от дохода (сколько % от общего дохода идёт в этот фонд)
              const percentOfIncome = totalIncome > 0
                ? Math.round((plannedAmount / totalIncome) * 100)
                : 0

              // Процент от суммы на фонды (доля этого фонда среди всех распределений)
              const percentOfFunds = totalPlannedDistribution > 0
                ? Math.round((plannedAmount / totalPlannedDistribution) * 100)
                : 0

              return (
                <div key={fund.fundId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FundIcon
                        name={fund.fundName}
                        color={fund.fundColor}
                        size="sm"
                      />
                      <span className="text-sm font-medium">{fund.fundName}</span>
                      {/* Процент от дохода */}
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-500">
                        {percentOfIncome}% дохода
                      </span>
                      {/* Процент от суммы на фонды */}
                      <span className="inline-flex items-center rounded-full bg-violet-500/10 px-1.5 py-0.5 text-xs font-medium text-violet-500">
                        {percentOfFunds}% фондов
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-xs font-medium text-cyan-500">
                          <Check className="h-3 w-3 mr-0.5" />
                          Готово
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-medium tabular-nums">
                          {formatMoney(fund.actualAmount)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {' '}
                          / {formatMoney(plannedAmount)} ₽
                        </span>
                      </div>
                      {!isCompleted && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => navigate('/incomes')}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Изменить на странице доходов</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <Progress
                    value={fundProgress}
                    className="h-1.5"
                    style={
                      {
                        '--progress-foreground': fund.fundColor,
                      } as React.CSSProperties
                    }
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Edit Distribution Rules Dialog */}
      <EditDistributionRulesDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        fundDistributions={fundDistributions || []}
        totalIncome={totalIncome}
      />
    </div>
  )

  if (hideWrapper) {
    return <div>{content}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-violet-500" />
          Распределение по фондам
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditDialogOpen(true)}
        >
          <Settings className="mr-2 h-4 w-4" />
          Настроить
        </Button>
      </div>

      {content}
    </motion.div>
  )
}
