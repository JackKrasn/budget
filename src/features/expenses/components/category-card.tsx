import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CategoryIcon } from '@/components/common/category-icon'
import { cn } from '@/lib/utils'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export interface CategorySummary {
  categoryId: string
  categoryCode: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  actualAmount: number
  plannedAmount: number
  plannedExpensesSum?: number // Обязательные платежи (кредиты и т.д.)
}

interface CategoryCardProps {
  category: CategorySummary
  onClick?: () => void
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  // plannedAmount already includes plannedExpensesSum (formula: plannedAmount = plannedExpensesSum + bufferAmount)
  const totalPlanned = category.plannedAmount

  const progress =
    totalPlanned > 0
      ? Math.min((category.actualAmount / totalPlanned) * 100, 100)
      : 0
  const diff = totalPlanned - category.actualAmount
  // Перерасход только если есть план И расходы превысили план
  const isOverBudget = totalPlanned > 0 && diff < 0
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
            {totalPlanned > 0 && (
              <div className="text-right">
                <span className="text-sm text-muted-foreground">из </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatMoney(totalPlanned)} ₽
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {totalPlanned > 0 && (
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
          )}

          {/* No plan indicator */}
          {totalPlanned === 0 && category.actualAmount > 0 && (
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
