import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EyeOff, Plus, Settings2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { CategoryIcon } from '@/components/common'
import { cn } from '@/lib/utils'
import type { BudgetItemWithCategory, ExpenseCategoryWithTags } from '@/lib/api/types'

interface BudgetTableProps {
  items: BudgetItemWithCategory[]
  allCategories: ExpenseCategoryWithTags[]
  onUpdateItem: (categoryId: string, plannedAmount: number) => Promise<void>
  isPending?: boolean
  /** Список ID скрытых категорий */
  hiddenCategories?: string[]
  /** Callback для изменения видимости категории */
  onToggleCategory?: (categoryId: string) => void
  /** Callback для добавления категории */
  onAddCategory?: () => void
  /** Фактические расходы по категориям (categoryId -> сумма) */
  actualByCategory?: Record<string, number>
  /** Callback для клика по категории (переход к расходам) */
  onCategoryClick?: (categoryId: string) => void
}

// Компонент для inline-редактирования суммы с кнопками
function InlineAmountInput({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (value: number) => Promise<void>
  disabled?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    setEditValue(value === 0 ? '' : String(value))
    setIsEditing(true)
  }

  const handleSave = async () => {
    const newValue = parseFloat(editValue) || 0
    setIsSaving(true)
    try {
      await onChange(newValue)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const hasChanges = isEditing && (parseFloat(editValue) || 0) !== value

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editValue}
          onChange={(e) => {
            const val = e.target.value.replace(/[^\d]/g, '')
            setEditValue(val)
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSaving}
          className={cn(
            'w-20 h-7 px-2 text-right tabular-nums text-sm rounded',
            'bg-muted/50 border border-border',
            'outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
            'transition-colors'
          )}
          placeholder="0"
        />
        {hasChanges && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              onClick={handleSave}
              disabled={disabled || isSaving}
              title="Сохранить"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleCancel}
              disabled={isSaving}
              title="Отмена"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={handleStartEdit}
      className={cn(
        'w-24 h-7 px-2 text-right tabular-nums text-sm rounded',
        'hover:bg-muted/50 cursor-text transition-colors',
        value === 0 && 'text-muted-foreground'
      )}
    >
      {formatMoney(value)} ₽
    </button>
  )
}

export function BudgetTable({
  items,
  allCategories,
  onUpdateItem,
  isPending,
  hiddenCategories = [],
  onToggleCategory,
  onAddCategory,
  actualByCategory = {},
  onCategoryClick,
}: BudgetTableProps) {
  // Объединить все категории с данными бюджета
  const allRows = allCategories.map((category) => {
    const budgetItem = items.find((i) => i.categoryId === category.id)
    const plannedExpensesSum = budgetItem?.plannedExpensesSum ?? 0
    // Буфер = plannedAmount - plannedExpensesSum (то что пользователь может тратить свободно)
    const bufferAmount = Math.max((budgetItem?.plannedAmount ?? 0) - plannedExpensesSum, 0)
    // Total planned = buffer + mandatory payments (credits, etc.)
    const totalPlanned = bufferAmount + plannedExpensesSum
    // Используем actualByCategory из расходов, а не из budget_items
    const actual = actualByCategory[category.id] ?? 0
    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryCode: category.code,
      categoryIcon: category.icon,
      categoryColor: category.color,
      bufferAmount,
      plannedExpensesSum,
      totalPlanned,
      actual,
      variance: totalPlanned - actual,
      hasItem: !!budgetItem || actual > 0,
      isHidden: hiddenCategories.includes(category.id),
    }
  })

  // Фильтруем скрытые категории для отображения
  const rows = allRows.filter((row) => !row.isHidden)

  // Итоги
  const totals = rows.reduce(
    (acc, row) => ({
      buffer: acc.buffer + row.bufferAmount,
      planned: acc.planned + row.totalPlanned,
      mandatory: acc.mandatory + row.plannedExpensesSum,
      actual: acc.actual + row.actual,
      variance: acc.variance + row.variance,
    }),
    { buffer: 0, planned: 0, mandatory: 0, actual: 0, variance: 0 }
  )

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const hiddenCount = allRows.filter((r) => r.isHidden).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm"
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[300px]">
              <div className="flex items-center gap-2">
                <span>Категория</span>
                {(onToggleCategory || onAddCategory) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {onAddCategory && (
                        <>
                          <DropdownMenuItem onClick={onAddCategory}>
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить категорию
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onToggleCategory && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Показывать категории
                          </div>
                          {allRows.map((row) => (
                            <DropdownMenuCheckboxItem
                              key={row.categoryId}
                              checked={!row.isHidden}
                              onCheckedChange={() => onToggleCategory(row.categoryId)}
                            >
                              <div className="flex items-center gap-2">
                                <CategoryIcon
                                  code={row.categoryCode}
                                  iconName={row.categoryIcon}
                                  color={row.categoryColor}
                                  size="sm"
                                />
                                <span>{row.categoryName}</span>
                              </div>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {hiddenCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({hiddenCount} скрыто)
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead className="w-[120px] text-right">Буфер</TableHead>
            <TableHead className="w-[120px] text-right">Запланировано</TableHead>
            <TableHead className="w-[120px] text-right">Итого план</TableHead>
            <TableHead className="w-[120px] text-right">Факт</TableHead>
            <TableHead className="w-[120px] text-right">Остаток</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isOverBudget = row.variance < 0

            return (
              <TableRow
                key={row.categoryId}
                className={cn(
                  'group',
                  isOverBudget && row.hasItem && 'bg-destructive/5'
                )}
              >
                <TableCell>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-3 text-left',
                      onCategoryClick && 'hover:opacity-80 cursor-pointer transition-opacity'
                    )}
                    onClick={() => onCategoryClick?.(row.categoryId)}
                    disabled={!onCategoryClick}
                  >
                    <CategoryIcon
                      code={row.categoryCode}
                      iconName={row.categoryIcon}
                      color={row.categoryColor}
                      size="md"
                    />
                    <p className="font-medium">{row.categoryName}</p>
                  </button>
                </TableCell>

                <TableCell className="text-right">
                  <InlineAmountInput
                    value={row.bufferAmount}
                    onChange={(value) => onUpdateItem(row.categoryId, value + row.plannedExpensesSum)}
                    disabled={isPending}
                  />
                </TableCell>

                <TableCell className="text-right">
                  {row.plannedExpensesSum > 0 ? (
                    <span className="tabular-nums text-blue-500 font-medium">
                      {formatMoney(row.plannedExpensesSum)} ₽
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <span className="tabular-nums font-semibold">
                    {formatMoney(row.totalPlanned)} ₽
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <span className="tabular-nums text-muted-foreground">
                    {formatMoney(row.actual)} ₽
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <span
                    className={cn(
                      'tabular-nums font-medium',
                      isOverBudget
                        ? 'text-destructive'
                        : row.variance > 0
                          ? 'text-emerald-500'
                          : 'text-muted-foreground'
                    )}
                  >
                    {row.variance > 0 ? '+' : ''}
                    {formatMoney(row.variance)} ₽
                  </span>
                </TableCell>

                <TableCell>
                  {onToggleCategory && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onToggleCategory(row.categoryId)}
                      title="Скрыть категорию"
                    >
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell>Итого</TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatMoney(totals.buffer)} ₽
            </TableCell>
            <TableCell className="text-right tabular-nums text-blue-500">
              {formatMoney(totals.mandatory)} ₽
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(totals.planned)} ₽
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatMoney(totals.actual)} ₽
            </TableCell>
            <TableCell className="text-right">
              <span
                className={cn(
                  'tabular-nums',
                  totals.variance < 0
                    ? 'text-destructive'
                    : totals.variance > 0
                      ? 'text-emerald-500'
                      : ''
                )}
              >
                {totals.variance > 0 ? '+' : ''}
                {formatMoney(totals.variance)} ₽
              </span>
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </motion.div>
  )
}
