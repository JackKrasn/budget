import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EyeOff, Plus, Settings2, Check, X, PiggyBank } from 'lucide-react'
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
import { getCurrencyConfig } from './currency-limit-badge'
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
  /** Callback для редактирования буфера (открыть диалог мультивалютных лимитов) */
  onEditBuffer?: (item: BudgetItemWithCategory) => void
  /** Карта фондов для отображения названий (fundId -> fundName) */
  fundNames?: Record<string, string>
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
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
  onEditBuffer,
  fundNames = {},
}: BudgetTableProps) {
  // Объединить все категории с данными бюджета
  const allRows = allCategories.map((category) => {
    const existingItem = items.find((i) => i.categoryId === category.id)
    const plannedExpensesSum = existingItem?.plannedExpensesSum ?? 0
    // Буфер = сумма bufferAmount по всем валютам (берём из currencyLimits)
    const currencyLimits = existingItem?.currencyLimits ?? []
    const bufferAmount = currencyLimits.reduce((sum, l) => sum + l.bufferAmount, 0)
    // Total limit from new API (or calculate fallback)
    const totalLimit = existingItem?.totalLimit ?? (plannedExpensesSum + bufferAmount)
    // Используем actualByCategory из расходов, а не из budget_items
    const actual = actualByCategory[category.id] ?? 0
    // Информация о финансировании из фонда
    const fundId = existingItem?.fundId
    const fundAllocation = existingItem?.fundAllocation ?? 0
    const fundName = fundId ? fundNames[fundId] : undefined

    // Создаём budgetItem для редактирования (виртуальный если нет реального)
    const budgetItem: BudgetItemWithCategory = existingItem ?? {
      id: '',
      budgetId: '',
      categoryId: category.id,
      totalLimit: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categoryName: category.name,
      categoryCode: category.code,
      categoryIcon: category.icon,
      categoryColor: category.color,
      actualAmount: actual,
      fundedAmount: 0,
      remaining: 0,
      plannedExpensesSum: 0,
      fundAllocation: 0,
      currencyLimits: [],
    }

    // Show multi-currency if:
    // - Has currencyLimits with more than 1 currency OR has non-RUB currency
    const hasNonRubCurrency = currencyLimits.some(l => l.currency !== 'RUB')
    const hasMultipleCurrencies = currencyLimits.length > 1
    const hasMultiCurrency = hasMultipleCurrencies || hasNonRubCurrency

    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryCode: category.code,
      categoryIcon: category.icon,
      categoryColor: category.color,
      bufferAmount,
      plannedExpensesSum,
      totalLimit,
      actual,
      variance: totalLimit - actual,
      hasItem: !!existingItem || actual > 0,
      isHidden: hiddenCategories.includes(category.id),
      // Финансирование из фонда
      fundId,
      fundAllocation,
      fundName,
      budgetItem,
      // Multi-currency limits
      currencyLimits,
      hasMultiCurrency,
    }
  })

  // Фильтруем скрытые категории для отображения
  const rows = allRows.filter((row) => !row.isHidden)

  // Итоги
  const totals = rows.reduce(
    (acc, row) => {
      // Aggregate currency limits
      const newCurrencyTotals = { ...acc.currencyTotals }
      for (const limit of row.currencyLimits) {
        if (!newCurrencyTotals[limit.currency]) {
          newCurrencyTotals[limit.currency] = {
            plannedAmount: 0,
            bufferAmount: 0,
            totalLimit: 0,
            actualAmount: 0,
            remaining: 0,
          }
        }
        newCurrencyTotals[limit.currency].plannedAmount += limit.plannedAmount
        newCurrencyTotals[limit.currency].bufferAmount += limit.bufferAmount
        newCurrencyTotals[limit.currency].totalLimit += limit.totalLimit
        newCurrencyTotals[limit.currency].actualAmount += limit.actualAmount
        newCurrencyTotals[limit.currency].remaining += limit.remaining
      }

      return {
        buffer: acc.buffer + row.bufferAmount,
        totalLimit: acc.totalLimit + row.totalLimit,
        mandatory: acc.mandatory + row.plannedExpensesSum,
        actual: acc.actual + row.actual,
        variance: acc.variance + row.variance,
        // Currency totals
        currencyTotals: newCurrencyTotals,
      }
    },
    {
      buffer: 0,
      totalLimit: 0,
      mandatory: 0,
      actual: 0,
      variance: 0,
      currencyTotals: {} as Record<string, { plannedAmount: number; bufferAmount: number; totalLimit: number; actualAmount: number; remaining: number }>,
    }
  )

  const currencyTotalsArray = Object.entries(totals.currencyTotals)
  const hasMultiCurrencyTotals = currencyTotalsArray.length > 1 || currencyTotalsArray.some(([c]) => c !== 'RUB')

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={cn(
                        'flex items-center gap-3 text-left flex-1 min-w-0',
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
                      <div className="min-w-0">
                        <p className="font-medium">{row.categoryName}</p>
                        {row.fundName && row.fundAllocation > 0 && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <PiggyBank className="h-3 w-3" />
                            Из фонда «{row.fundName}»: {formatMoney(row.fundAllocation)} ₽
                          </p>
                        )}
                        {/* Multi-currency badges */}
                        {row.hasMultiCurrency && row.currencyLimits.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {row.currencyLimits.map((limit) => {
                              const config = getCurrencyConfig(limit.currency)
                              const progress = limit.totalLimit > 0 ? (limit.actualAmount / limit.totalLimit) * 100 : 0
                              const isOver = limit.remaining < 0
                              return (
                                <span
                                  key={limit.id}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs tabular-nums',
                                    config.bgColor,
                                    isOver ? 'text-destructive' : config.color
                                  )}
                                  title={`${limit.currency}: ${formatMoney(limit.actualAmount)} / ${formatMoney(limit.totalLimit)} (${Math.round(progress)}%)`}
                                >
                                  <span className="font-semibold">{config.symbol}</span>
                                  <span>{formatMoney(limit.actualAmount)}</span>
                                  <span className="text-muted-foreground">/</span>
                                  <span>{formatMoney(limit.totalLimit)}</span>
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  {onEditBuffer ? (
                    <button
                      onClick={() => onEditBuffer(row.budgetItem)}
                      className={cn(
                        'min-w-[96px] h-auto px-2 py-1 text-right tabular-nums text-sm rounded',
                        'hover:bg-muted/50 cursor-pointer transition-colors',
                        'inline-flex flex-col items-end gap-0.5',
                        row.bufferAmount === 0 && !row.hasMultiCurrency && 'text-muted-foreground'
                      )}
                      title="Настроить буфер по валютам"
                    >
                      {row.hasMultiCurrency && row.currencyLimits.length > 0 ? (
                        row.currencyLimits.map((limit) => {
                          const config = getCurrencyConfig(limit.currency)
                          return (
                            <span key={limit.id} className={cn('tabular-nums', config.color)}>
                              {config.symbol}{formatMoney(limit.bufferAmount)}
                            </span>
                          )
                        })
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          {formatMoney(row.bufferAmount)} ₽
                        </span>
                      )}
                    </button>
                  ) : (
                    <InlineAmountInput
                      value={row.bufferAmount}
                      onChange={(value) => onUpdateItem(row.categoryId, value + row.plannedExpensesSum)}
                      disabled={isPending}
                    />
                  )}
                </TableCell>

                <TableCell className="text-right">
                  {row.hasMultiCurrency && row.currencyLimits.length > 0 ? (
                    <div className="flex flex-col items-end gap-0.5">
                      {row.currencyLimits.map((limit) => {
                        const config = getCurrencyConfig(limit.currency)
                        return (
                          <span
                            key={limit.id}
                            className={cn('tabular-nums text-sm font-medium', config.color)}
                          >
                            {config.symbol}{formatMoney(limit.plannedAmount)}
                          </span>
                        )
                      })}
                    </div>
                  ) : row.plannedExpensesSum > 0 ? (
                    <span className="tabular-nums text-blue-500 font-medium">
                      {formatMoney(row.plannedExpensesSum)} ₽
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  {row.hasMultiCurrency && row.currencyLimits.length > 0 ? (
                    <div className="flex flex-col items-end gap-0.5">
                      {row.currencyLimits.map((limit) => {
                        const config = getCurrencyConfig(limit.currency)
                        return (
                          <span
                            key={limit.id}
                            className={cn('tabular-nums text-sm font-semibold', config.color)}
                          >
                            {config.symbol}{formatMoney(limit.totalLimit)}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="tabular-nums font-semibold">
                      {formatMoney(row.totalLimit)} ₽
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  {row.hasMultiCurrency && row.currencyLimits.length > 0 ? (
                    <div className="flex flex-col items-end gap-0.5">
                      {row.currencyLimits.map((limit) => {
                        const config = getCurrencyConfig(limit.currency)
                        return (
                          <span
                            key={limit.id}
                            className={cn('tabular-nums text-sm', config.color)}
                          >
                            {config.symbol}{formatMoney(limit.actualAmount)}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="tabular-nums text-muted-foreground">
                      {formatMoney(row.actual)} ₽
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  {row.hasMultiCurrency && row.currencyLimits.length > 0 ? (
                    <div className="flex flex-col items-end gap-0.5">
                      {row.currencyLimits.map((limit) => {
                        const config = getCurrencyConfig(limit.currency)
                        const isLimitOver = limit.remaining < 0
                        return (
                          <span
                            key={limit.id}
                            className={cn(
                              'tabular-nums text-sm font-medium',
                              isLimitOver
                                ? 'text-destructive'
                                : limit.remaining > 0
                                  ? 'text-emerald-500'
                                  : 'text-muted-foreground'
                            )}
                          >
                            {limit.remaining > 0 ? '+' : ''}
                            {config.symbol}{formatMoney(limit.remaining)}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
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
                  )}
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
          {/* Итого по валютам - показываем каждую валюту отдельно */}
          {hasMultiCurrencyTotals ? (
            <>
              {currencyTotalsArray.map(([currency, data], index) => {
                const config = getCurrencyConfig(currency as Parameters<typeof getCurrencyConfig>[0])
                const isOverBudget = data.remaining < 0
                return (
                  <TableRow
                    key={currency}
                    className={cn(
                      'font-semibold',
                      index === 0 ? 'bg-muted/50' : 'bg-muted/30'
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index === 0 && <span>Итого</span>}
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs', config.bgColor, config.color)}>
                          <span className="font-bold">{config.symbol}</span>
                          {currency}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={cn('text-right tabular-nums text-muted-foreground', config.color)}>
                      {config.symbol}{formatMoney(data.bufferAmount)}
                    </TableCell>
                    <TableCell className={cn('text-right tabular-nums', config.color)}>
                      {config.symbol}{formatMoney(data.plannedAmount)}
                    </TableCell>
                    <TableCell className={cn('text-right tabular-nums', config.color)}>
                      {config.symbol}{formatMoney(data.totalLimit)}
                    </TableCell>
                    <TableCell className={cn('text-right tabular-nums', config.color)}>
                      {config.symbol}{formatMoney(data.actualAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'tabular-nums',
                          isOverBudget
                            ? 'text-destructive'
                            : data.remaining > 0
                              ? 'text-emerald-500'
                              : 'text-muted-foreground'
                        )}
                      >
                        {data.remaining > 0 ? '+' : ''}
                        {config.symbol}{formatMoney(data.remaining)}
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )
              })}
            </>
          ) : (
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell>Итого</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatMoney(totals.buffer)} ₽
              </TableCell>
              <TableCell className="text-right tabular-nums text-blue-500">
                {formatMoney(totals.mandatory)} ₽
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(totals.totalLimit)} ₽
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
          )}
        </TableFooter>
      </Table>
    </motion.div>
  )
}
