"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { parseISO } from "date-fns"
import { Tag, Loader2, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useExpenseTagStatistics, useExpenses } from "@/features/expenses"
import { CategoryIcon } from "@/components/common"

interface TagStatisticsViewProps {
  tagId: string
  tagName: string
  tagColor: string
  from?: string
  to?: string
  className?: string
  onBack?: () => void
  onTagClick?: (tagId: string) => void
  onCategoryClick?: (categoryId: string) => void
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface TagSectionProps {
  tagId: string
  tagName: string
  tagColor: string | null
  amount: number
  count: number
  parentTagId: string
  from?: string
  to?: string
  onTagClick?: (tagId: string) => void
}

function TagSection({
  tagId,
  tagName,
  tagColor,
  amount,
  count,
  parentTagId,
  from,
  to,
  onTagClick,
}: TagSectionProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const color = tagColor || "oklch(0.60 0.15 200)"

  // Загружаем расходы только когда секция открыта
  // Используем tagId родительского тега и фильтруем на клиенте по второму тегу
  const { data: expensesData, isLoading } = useExpenses(
    {
      from,
      to,
      tagId: parentTagId,
    },
    { enabled: isOpen }
  )

  // Фильтруем расходы, которые содержат оба тега (parentTagId и tagId)
  const expenses = React.useMemo(() => {
    const allExpenses = expensesData?.data ?? []
    return allExpenses.filter((expense) =>
      expense.tags?.some((tag) => tag.id === tagId)
    )
  }, [expensesData, tagId])

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors",
            "hover:bg-muted/50",
            isOpen && "bg-muted/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Tag className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <span className="font-medium text-sm">{tagName}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({count})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums text-sm">
              {formatMoney(amount)} ₽
            </span>
            {onTagClick && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onTagClick(tagId)
                }}
              >
                Подробнее
              </Button>
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-11 pr-3 pb-2 pt-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length > 0 ? (
            <div className="space-y-1">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon
                      code={expense.categoryCode}
                      color={expense.categoryColor}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-sm">{expense.description || expense.categoryName}</p>
                      <p className="text-xs text-muted-foreground">
                        {parseISO(expense.date).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium tabular-nums text-sm">
                    {formatMoney(expense.amount)} {expense.currency === "RUB" ? "₽" : expense.currency}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">Нет расходов</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface CategorySectionProps {
  categoryId: string
  categoryCode: string
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  amount: number
  count: number
  parentTagId: string
  from?: string
  to?: string
  onCategoryClick?: (categoryId: string) => void
}

function CategorySection({
  categoryId,
  categoryCode,
  categoryName,
  categoryIcon,
  categoryColor,
  amount,
  count,
  parentTagId,
  from,
  to,
  onCategoryClick,
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const color = categoryColor || "oklch(0.60 0.15 250)"

  // Загружаем расходы только когда секция открыта
  const { data: expensesData, isLoading } = useExpenses(
    {
      from,
      to,
      tagId: parentTagId,
      categoryId,
    },
    { enabled: isOpen }
  )

  const expenses = expensesData?.data ?? []

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors",
            "hover:bg-muted/50",
            isOpen && "bg-muted/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <CategoryIcon
                code={categoryCode}
                iconName={categoryIcon || undefined}
                color={color}
                size="sm"
              />
            </div>
            <div>
              <span className="font-medium text-sm">{categoryName}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({count})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums text-sm">
              {formatMoney(amount)} ₽
            </span>
            {onCategoryClick && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onCategoryClick(categoryId)
                }}
              >
                Подробнее
              </Button>
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-11 pr-3 pb-2 pt-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length > 0 ? (
            <div className="space-y-1">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors text-sm"
                >
                  <div>
                    <p className="font-medium text-sm">{expense.description || categoryName}</p>
                    <p className="text-xs text-muted-foreground">
                      {parseISO(expense.date).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums text-sm">
                    {formatMoney(expense.amount)} {expense.currency === "RUB" ? "₽" : expense.currency}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">Нет расходов</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function TagStatisticsView({
  tagId,
  tagName,
  tagColor,
  from,
  to,
  className,
  onBack,
  onTagClick,
  onCategoryClick,
}: TagStatisticsViewProps) {
  const [activeTab, setActiveTab] = React.useState<"tags" | "categories">("tags")

  const { data, isLoading, error } = useExpenseTagStatistics(tagId, { from, to })

  const tagData = React.useMemo(() => {
    if (!data?.by_tags) return []
    return [...data.by_tags].sort((a, b) => b.total_amount - a.total_amount)
  }, [data])

  const categoryData = React.useMemo(() => {
    if (!data?.by_categories) return []
    return [...data.by_categories].sort((a, b) => b.total_amount - a.total_amount)
  }, [data])

  if (isLoading) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardContent className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardContent className="flex h-[400px] flex-col items-center justify-center gap-2">
          <p className="text-sm text-destructive">Ошибка загрузки статистики</p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Badge
                  variant="outline"
                  className="gap-1.5 px-2.5 py-1"
                  style={{
                    borderColor: tagColor,
                    backgroundColor: `${tagColor}15`,
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tagColor }}
                  />
                  {tagName}
                </Badge>
                <span className="text-muted-foreground font-normal">—</span>
                <span>Группировка</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Распределение расходов по {activeTab === "tags" ? "меткам" : "категориям"}
              </CardDescription>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Общая сумма</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatMoney(data.total.total_amount)} ₽
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Операций</p>
              <p className="text-2xl font-bold tabular-nums">
                {data.total.expenses_count}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === "tags" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("tags")}
              className="gap-2"
            >
              <Tag className="h-4 w-4" />
              По меткам ({tagData.length})
            </Button>
            <Button
              variant={activeTab === "categories" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("categories")}
              className="gap-2"
            >
              По категориям ({categoryData.length})
            </Button>
          </div>

          {/* Content */}
          {activeTab === "tags" && (
            <div className="space-y-1">
              {tagData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Нет дополнительных меток
                </p>
              ) : (
                tagData.map((item) => (
                  <TagSection
                    key={item.tag_id}
                    tagId={item.tag_id}
                    tagName={item.tag_name}
                    tagColor={item.tag_color}
                    amount={item.total_amount}
                    count={item.expenses_count}
                    parentTagId={tagId}
                    from={from}
                    to={to}
                    onTagClick={onTagClick}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-1">
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Нет категорий
                </p>
              ) : (
                categoryData.map((item) => (
                  <CategorySection
                    key={item.category_id}
                    categoryId={item.category_id}
                    categoryCode={item.category_code}
                    categoryName={item.category_name}
                    categoryIcon={item.category_icon}
                    categoryColor={item.category_color}
                    amount={item.total_amount}
                    count={item.expenses_count}
                    parentTagId={tagId}
                    from={from}
                    to={to}
                    onCategoryClick={onCategoryClick}
                  />
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
