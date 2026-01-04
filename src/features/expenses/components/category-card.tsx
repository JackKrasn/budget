import { motion } from 'framer-motion'
import {
  Wallet,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Plane,
  Heart,
  Gift,
  GraduationCap,
  Smartphone,
  Zap,
  Coffee,
  Film,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  food: Utensils,
  transport: Car,
  housing: Home,
  utilities: Zap,
  health: Heart,
  education: GraduationCap,
  entertainment: Film,
  shopping: ShoppingBag,
  travel: Plane,
  gifts: Gift,
  phone: Smartphone,
  coffee: Coffee,
  groceries: ShoppingCart,
  default: Wallet,
}

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
}

interface CategoryCardProps {
  category: CategorySummary
  onClick?: () => void
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  const Icon = CATEGORY_ICONS[category.categoryCode] || CATEGORY_ICONS.default
  const progress =
    category.plannedAmount > 0
      ? Math.min((category.actualAmount / category.plannedAmount) * 100, 100)
      : 0
  const diff = category.plannedAmount - category.actualAmount
  const isOverBudget = diff < 0
  const isUnderBudget = diff > 0 && category.actualAmount > 0
  const progressPercent =
    category.plannedAmount > 0
      ? Math.round((category.actualAmount / category.plannedAmount) * 100)
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
          isOverBudget && 'border-destructive/30 hover:border-destructive/50'
        )}
        onClick={onClick}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.05] transition-opacity group-hover:opacity-[0.1]"
          style={{
            background: `linear-gradient(135deg, ${category.categoryColor} 0%, transparent 60%)`,
          }}
        />

        <CardContent className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Icon */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${category.categoryColor}20` }}
            >
              <Icon
                className="h-6 w-6"
                style={{ color: category.categoryColor }}
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
            {category.plannedAmount > 0 && (
              <div className="text-right">
                <span className="text-sm text-muted-foreground">из </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatMoney(category.plannedAmount)} ₽
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {category.plannedAmount > 0 && (
            <div className="mt-3 space-y-1.5">
              <Progress
                value={progress}
                className={cn(
                  'h-2',
                  isOverBudget && '[&>div]:bg-destructive'
                )}
                style={
                  !isOverBudget
                    ? { ['--progress-color' as string]: category.categoryColor }
                    : undefined
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progressPercent}% использовано</span>
                {category.plannedAmount > 0 && !isOverBudget && (
                  <span>осталось {formatMoney(diff)} ₽</span>
                )}
              </div>
            </div>
          )}

          {/* No plan indicator */}
          {category.plannedAmount === 0 && category.actualAmount > 0 && (
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
