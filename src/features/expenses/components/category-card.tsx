import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CategoryIcon } from '@/components/common/category-icon'
import { getCurrencySymbol } from '@/components/common/day-header'
import { cn } from '@/lib/utils'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Currency limit summary for display
export interface CurrencyLimitSummary {
  currency: string
  totalLimit: number
  actualAmount: number
  remaining: number
}

export interface CategorySummary {
  categoryId: string
  categoryCode: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  actualAmount: number // Total in base currency (RUB)
  totalLimit: number // totalLimit = plannedExpensesSum + bufferAmount (in RUB)
  plannedExpensesSum?: number // Обязательные платежи (кредиты и т.д.)
  // Multi-currency support
  currencyLimits?: CurrencyLimitSummary[]
}

interface CategoryCardProps {
  category: CategorySummary
  onClick?: () => void
}

// Currency progress bar component
function CurrencyProgressBar({
  limit,
  color,
}: {
  limit: CurrencyLimitSummary
  color: string
}) {
  const progress = limit.totalLimit > 0
    ? Math.min((limit.actualAmount / limit.totalLimit) * 100, 100)
    : 0
  const isOverBudget = limit.remaining < 0
  const progressPercent = limit.totalLimit > 0
    ? Math.round((limit.actualAmount / limit.totalLimit) * 100)
    : 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium">
          {getCurrencySymbol(limit.currency)}
        </span>
        <span className={cn(
          'tabular-nums',
          isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'
        )}>
          {formatMoney(limit.actualAmount)} / {formatMoney(limit.totalLimit)}
        </span>
      </div>
      <Progress
        value={isOverBudget ? 100 : progress}
        className="h-1.5"
        indicatorColor={isOverBudget ? undefined : color}
      />
      <div className="flex justify-between text-[10px]">
        <span className={cn(isOverBudget ? 'text-destructive' : 'text-muted-foreground')}>
          {progressPercent}%
        </span>
        {isOverBudget ? (
          <span className="text-destructive">
            +{formatMoney(Math.abs(limit.remaining))}
          </span>
        ) : (
          <span className="text-muted-foreground">
            ост. {formatMoney(limit.remaining)}
          </span>
        )}
      </div>
    </div>
  )
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  // Check for multi-currency limits
  const hasMultiCurrency = category.currencyLimits && category.currencyLimits.length > 0
  const activeCurrencyLimits = category.currencyLimits?.filter(l => l.totalLimit > 0 || l.actualAmount > 0) || []

  // totalLimit already includes plannedExpensesSum (formula: totalLimit = plannedExpensesSum + bufferAmount)
  const totalPlanned = category.totalLimit

  const progress =
    totalPlanned > 0
      ? Math.min((category.actualAmount / totalPlanned) * 100, 100)
      : 0
  const diff = totalPlanned - category.actualAmount
  // Перерасход: проверяем как общий лимит, так и по валютам
  const hasOverBudgetCurrency = activeCurrencyLimits.some(l => l.remaining < 0)
  const isOverBudget = (totalPlanned > 0 && diff < 0) || hasOverBudgetCurrency
  const isUnderBudget = totalPlanned > 0 && diff > 0 && category.actualAmount > 0
  const progressPercent =
    totalPlanned > 0
      ? Math.round((category.actualAmount / totalPlanned) * 100)
      : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group relative cursor-pointer overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-xl hover:shadow-primary/5',
          isOverBudget && 'border-destructive/50 bg-destructive/5 hover:border-destructive/70 hover:shadow-destructive/10'
        )}
        onClick={onClick}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.05] transition-opacity group-hover:opacity-[0.1]"
          style={{
            background: isOverBudget
              ? 'linear-gradient(135deg, hsl(var(--destructive)) 0%, transparent 60%)'
              : `linear-gradient(135deg, ${category.categoryColor} 0%, transparent 60%)`,
          }}
        />

        <CardContent className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Icon */}
            <div className="transition-transform group-hover:scale-110">
              <CategoryIcon
                code={category.categoryCode}
                iconName={category.categoryIcon}
                color={category.categoryColor}
                size="lg"
                className="h-12 w-12 rounded-xl"
              />
            </div>

            {/* Status indicator */}
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                isOverBudget && 'bg-destructive/10 text-destructive',
                isUnderBudget && 'bg-chart-2/10 text-chart-2',
                !isOverBudget && !isUnderBudget && 'bg-muted text-muted-foreground'
              )}
            >
              {isOverBudget ? (
                <>
                  <TrendingUp className="h-3 w-3" />
                  <span>+{formatMoney(Math.abs(diff))}</span>
                </>
              ) : isUnderBudget ? (
                <>
                  <TrendingDown className="h-3 w-3" />
                  <span>{formatMoney(diff)}</span>
                </>
              ) : (
                <>
                  <Minus className="h-3 w-3" />
                  <span>0</span>
                </>
              )}
            </div>
          </div>

          {/* Category name */}
          <h3 className="mt-4 font-semibold tracking-tight">
            {category.categoryName}
          </h3>

          {/* Amounts */}
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  isOverBudget && 'text-destructive'
                )}
              >
                {formatMoney(category.actualAmount)}
              </span>
              <span className="ml-1 text-sm text-muted-foreground">₽</span>
            </div>
            {totalPlanned > 0 && !hasMultiCurrency && (
              <div className="text-right">
                <span className="text-sm text-muted-foreground">из </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatMoney(totalPlanned)} ₽
                </span>
              </div>
            )}
          </div>

          {/* Currency breakdown */}
          {hasMultiCurrency && activeCurrencyLimits.length > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              {activeCurrencyLimits
                .filter(l => l.actualAmount > 0)
                .map((l, i, arr) => (
                  <span key={l.currency}>
                    {formatMoney(l.actualAmount)} {getCurrencySymbol(l.currency)}
                    {i < arr.length - 1 && ' + '}
                  </span>
                ))}
            </div>
          )}

          {/* Multi-currency progress bars */}
          {hasMultiCurrency && activeCurrencyLimits.length > 0 ? (
            <div className="mt-3 space-y-2">
              {activeCurrencyLimits.map((limit) => (
                <CurrencyProgressBar
                  key={limit.currency}
                  limit={limit}
                  color={category.categoryColor}
                />
              ))}
            </div>
          ) : totalPlanned > 0 ? (
            /* Single currency progress bar */
            <div className="mt-3 space-y-1.5">
              <Progress
                value={isOverBudget ? 100 : progress}
                className="h-2"
                indicatorColor={category.categoryColor}
              />
              <div className="flex justify-between text-xs">
                <span className={cn(isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                  {progressPercent}% использовано
                </span>
                {isOverBudget ? (
                  <span className="text-destructive font-medium">
                    перерасход {formatMoney(Math.abs(diff))} ₽
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    осталось {formatMoney(diff)} ₽
                  </span>
                )}
              </div>
            </div>
          ) : null}

          {/* No plan indicator */}
          {totalPlanned === 0 && category.actualAmount > 0 && !hasMultiCurrency && (
            <p className="mt-3 text-xs text-muted-foreground">
              План не установлен
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Grid of category cards
interface CategoryGridProps {
  categories: CategorySummary[]
  onCategoryClick?: (categoryId: string) => void
}

export function CategoryGrid({ categories, onCategoryClick }: CategoryGridProps) {
  // Sort by actual amount descending
  const sortedCategories = [...categories].sort(
    (a, b) => b.actualAmount - a.actualAmount
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedCategories.map((category) => (
        <CategoryCard
          key={category.categoryId}
          category={category}
          onClick={() => onCategoryClick?.(category.categoryId)}
        />
      ))}
    </div>
  )
}

// Table view of categories
interface CategoryTableProps {
  categories: CategorySummary[]
  onCategoryClick?: (categoryId: string) => void
}

export function CategoryTable({ categories, onCategoryClick }: CategoryTableProps) {
  // Sort by actual amount descending
  const sortedCategories = [...categories].sort(
    (a, b) => b.actualAmount - a.actualAmount
  )

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 bg-muted/30 text-xs font-medium text-muted-foreground border-b border-border/30">
        <div className="w-9" />
        <div>Категория</div>
        <div className="w-28 text-right">Потрачено</div>
        <div className="w-28 text-right">План</div>
        <div className="w-24 text-right">Остаток</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {sortedCategories.map((category) => {
          const remaining = category.totalLimit - category.actualAmount
          const isOverBudget = category.totalLimit > 0 && remaining < 0
          const progress = category.totalLimit > 0
            ? Math.min((category.actualAmount / category.totalLimit) * 100, 100)
            : 0

          return (
            <motion.div
              key={category.categoryId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                'grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-muted/30',
                isOverBudget && 'bg-destructive/5 hover:bg-destructive/10'
              )}
              onClick={() => onCategoryClick?.(category.categoryId)}
            >
              {/* Icon */}
              <CategoryIcon
                code={category.categoryCode}
                iconName={category.categoryIcon}
                color={category.categoryColor}
                size="sm"
                className="h-9 w-9 rounded-lg"
              />

              {/* Name + Progress */}
              <div className="min-w-0">
                <div className="font-medium truncate">{category.categoryName}</div>
                {category.totalLimit > 0 && (
                  <div className="mt-1.5">
                    <Progress
                      value={isOverBudget ? 100 : progress}
                      className="h-1.5"
                      indicatorColor={isOverBudget ? undefined : category.categoryColor}
                    />
                  </div>
                )}
              </div>

              {/* Actual Amount */}
              <div className={cn(
                'w-28 text-right font-semibold tabular-nums',
                isOverBudget && 'text-destructive'
              )}>
                {formatMoney(category.actualAmount)} ₽
              </div>

              {/* Planned Amount */}
              <div className="w-28 text-right text-muted-foreground tabular-nums">
                {category.totalLimit > 0 ? `${formatMoney(category.totalLimit)} ₽` : '—'}
              </div>

              {/* Remaining */}
              <div className={cn(
                'w-24 text-right tabular-nums',
                isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'
              )}>
                {category.totalLimit > 0 ? (
                  isOverBudget ? (
                    <span className="flex items-center justify-end gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +{formatMoney(Math.abs(remaining))}
                    </span>
                  ) : (
                    `${formatMoney(remaining)} ₽`
                  )
                ) : '—'}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Footer with totals */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium border-t border-border/30">
        <div className="w-9" />
        <div>Итого</div>
        <div className="w-28 text-right tabular-nums">
          {formatMoney(sortedCategories.reduce((sum, c) => sum + c.actualAmount, 0))} ₽
        </div>
        <div className="w-28 text-right tabular-nums text-muted-foreground">
          {formatMoney(sortedCategories.reduce((sum, c) => sum + c.totalLimit, 0))} ₽
        </div>
        <div className="w-24 text-right tabular-nums">
          {(() => {
            const totalActual = sortedCategories.reduce((sum, c) => sum + c.actualAmount, 0)
            const totalPlanned = sortedCategories.reduce((sum, c) => sum + c.totalLimit, 0)
            const totalRemaining = totalPlanned - totalActual
            return totalRemaining < 0 ? (
              <span className="text-destructive">+{formatMoney(Math.abs(totalRemaining))}</span>
            ) : (
              <span>{formatMoney(totalRemaining)} ₽</span>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
