import { motion } from 'framer-motion'
import {
  MoreHorizontal,
  Trash2,
  Pencil,
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
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ExpenseListRow } from '@/lib/api/types'

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
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

interface ExpenseCardProps {
  expense: ExpenseListRow
  onEdit?: () => void
  onDelete?: () => void
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const Icon = CATEGORY_ICONS[expense.categoryCode] || CATEGORY_ICONS.default
  const hasFundAllocation = expense.fundedAmount > 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5">
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
          style={{
            background: `linear-gradient(135deg, ${expense.categoryColor} 0%, transparent 60%)`,
          }}
        />

        <CardContent className="relative p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Icon and Category */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${expense.categoryColor}20` }}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: expense.categoryColor }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">
                    {expense.categoryName}
                  </h3>
                  {hasFundAllocation && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <Wallet className="mr-1 h-3 w-3" />
                      {formatMoney(expense.fundedAmount)} ₽
                    </Badge>
                  )}
                </div>
                {(expense.description || (expense.tags && expense.tags.length > 0)) && (
                  <div className="flex items-center gap-2 mt-0.5">
                    {expense.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {expense.description}
                      </p>
                    )}
                    {expense.tags && expense.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 shrink-0">
                        {expense.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs px-2 py-0"
                            style={{
                              borderColor: tag.color,
                              color: tag.color,
                              backgroundColor: `${tag.color}10`,
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(expense.date)}
                </p>
              </div>
            </div>

            {/* Amount and Actions */}
            <div className="flex items-start gap-2">
              <div className="text-right">
                <p className="font-semibold tabular-nums text-lg">
                  -{formatMoney(expense.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {expense.currency}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Редактировать
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Compact row version for list view
interface ExpenseRowProps {
  expense: ExpenseListRow
  onEdit?: () => void
  onDelete?: () => void
}

export function ExpenseRow({ expense, onEdit, onDelete }: ExpenseRowProps) {
  const Icon = CATEGORY_ICONS[expense.categoryCode] || CATEGORY_ICONS.default
  const hasFundAllocation = expense.fundedAmount > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center gap-4 rounded-lg border border-border/50 bg-card/30 p-3 transition-all hover:border-border hover:bg-card/50"
    >
      {/* Icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${expense.categoryColor}20` }}
      >
        <Icon className="h-4 w-4" style={{ color: expense.categoryColor }} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{expense.categoryName}</span>
          {hasFundAllocation && (
            <Badge variant="outline" className="text-xs">
              Из фонда
            </Badge>
          )}
        </div>
        {(expense.description || (expense.tags && expense.tags.length > 0)) && (
          <div className="flex items-center gap-2 mt-0.5">
            {expense.description && (
              <p className="text-sm text-muted-foreground truncate">
                {expense.description}
              </p>
            )}
            {expense.tags && expense.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 shrink-0">
                {expense.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-xs px-1.5 py-0"
                    style={{
                      borderColor: tag.color,
                      color: tag.color,
                      backgroundColor: `${tag.color}10`,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date */}
      <span className="text-sm text-muted-foreground shrink-0 w-16 text-right">
        {formatDate(expense.date)}
      </span>

      {/* Amount */}
      <span className="font-semibold tabular-nums shrink-0 w-28 text-right">
        -{formatMoney(expense.amount)} ₽
      </span>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}
