import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronDown, ChevronUp, ArrowRightLeft, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { AnalyzeImportResponse, ImportRow } from '@/lib/api/types'

// Helper to access fields that may come as snake_case or camelCase from backend
function getRowField(row: ImportRow, snakeCase: keyof ImportRow, camelCase: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = row as any
  return r[snakeCase] ?? r[camelCase] ?? ''
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

type OperationType = 'expense' | 'transfer' | 'income' | 'correction'

interface OperationConfig {
  type: OperationType
  label: string
  icon: typeof TrendingDown
  bgColor: string
  iconColor: string
}

const OPERATION_CONFIGS: OperationConfig[] = [
  {
    type: 'expense',
    label: 'Расходы',
    icon: TrendingDown,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    type: 'transfer',
    label: 'Переводы',
    icon: ArrowRightLeft,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    type: 'income',
    label: 'Доходы',
    icon: TrendingUp,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    type: 'correction',
    label: 'Корректировки',
    icon: RotateCcw,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
]

function formatMoney(amount: number, currency = 'RUB') {
  return (
    amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) +
    ' ' +
    (CURRENCY_SYMBOLS[currency] ?? currency)
  )
}

function getStatusBadge(row: ImportRow) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = row as any
  const isDuplicate = r.is_duplicate ?? r.isDuplicate
  const hasMapping = r.has_mapping ?? r.hasMapping

  if (isDuplicate) {
    return <Badge variant="outline" className="text-xs">Дубликат</Badge>
  }
  if (!hasMapping) {
    return <Badge variant="secondary" className="text-xs">Не настроено</Badge>
  }
  return null
}

const INITIAL_VISIBLE = 30
const LOAD_MORE_COUNT = 50

interface OperationsSummaryProps {
  data: AnalyzeImportResponse
}

export function OperationsSummary({ data }: OperationsSummaryProps) {
  const [openSections, setOpenSections] = useState<Set<OperationType>>(new Set())
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [visibleCounts, setVisibleCounts] = useState<Record<OperationType, number>>({
    expense: INITIAL_VISIBLE,
    transfer: INITIAL_VISIBLE,
    income: INITIAL_VISIBLE,
    correction: INITIAL_VISIBLE,
  })

  // Use accounts list from API response, with fallback
  const availableAccounts = useMemo(() => {
    // First try to use accounts from API
    if (data.accounts && data.accounts.length > 0) {
      return [...data.accounts].sort()
    }
    // Fallback: extract unique accounts from rows (only real accounts, not categories)
    const accounts = new Set<string>()
    data.rows.forEach((row) => {
      // Only include accounts from transfers (both from and to are accounts)
      // and from expenses/incomes (from_account is the account)
      if (row.type === 'transfer') {
        const fromAccount = getRowField(row, 'from_account', 'fromAccount')
        const toAccount = getRowField(row, 'to_account', 'toAccount')
        if (fromAccount) accounts.add(fromAccount)
        if (toAccount) accounts.add(toAccount)
      } else if (row.type === 'expense' || row.type === 'income') {
        const fromAccount = getRowField(row, 'from_account', 'fromAccount')
        if (fromAccount) accounts.add(fromAccount)
      }
    })
    return Array.from(accounts).sort()
  }, [data.accounts, data.rows])

  // Group and filter rows by type
  const rowsByType = useMemo(() => {
    const groups: Record<OperationType, ImportRow[]> = {
      expense: [],
      transfer: [],
      income: [],
      correction: [],
    }
    data.rows.forEach((row) => {
      if (row.type in groups) {
        // Apply account filter
        if (accountFilter !== 'all') {
          const fromAccount = getRowField(row, 'from_account', 'fromAccount')
          if (fromAccount !== accountFilter) return
        }
        groups[row.type].push(row)
      }
    })
    return groups
  }, [data.rows, accountFilter])

  const toggleSection = (type: OperationType) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const loadMore = (type: OperationType) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [type]: prev[type] + LOAD_MORE_COUNT,
    }))
  }

  const getSummary = (type: OperationType) => {
    switch (type) {
      case 'expense':
        return { count: data.expenses.count, total: data.expenses.total, ready: data.readyToImport.expenses }
      case 'transfer':
        return { count: data.transfers.count, total: data.transfers.total, ready: data.readyToImport.transfers }
      case 'income':
        return { count: data.incomes.count, total: data.incomes.total, ready: data.readyToImport.incomes }
      case 'correction':
        return { count: data.corrections?.count ?? 0, total: data.corrections?.total ?? 0, ready: 0 }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Сводка по операциям</CardTitle>
          {availableAccounts.length > 0 && (
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все счета" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все счета</SelectItem>
                {availableAccounts.map((account) => (
                  <SelectItem key={account} value={account}>
                    {account}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {OPERATION_CONFIGS.map((config) => {
          const summary = getSummary(config.type)
          const rows = rowsByType[config.type]
          const isOpen = openSections.has(config.type)
          const isCorrection = config.type === 'correction'
          const visibleCount = visibleCounts[config.type]
          const hasMore = rows.length > visibleCount

          if (summary.count === 0) return null

          return (
            <Collapsible
              key={config.type}
              open={isOpen}
              onOpenChange={() => toggleSection(config.type)}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
                    'hover:bg-muted/50',
                    isOpen && 'bg-muted/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', config.bgColor)}>
                      <config.icon className={cn('h-4 w-4', config.iconColor)} />
                    </div>
                    <span className={cn('font-medium', isCorrection && 'text-muted-foreground')}>
                      {config.label}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {accountFilter !== 'all' ? `${rows.length} / ${summary.count}` : summary.count}
                    </Badge>
                    {!isCorrection && summary.ready < summary.count && (
                      <Badge variant="outline" className="text-xs text-amber-600">
                        готово {summary.ready}
                      </Badge>
                    )}
                    {isCorrection && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        пропускаются
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('font-medium tabular-nums', isCorrection && 'text-muted-foreground')}>
                      {formatMoney(summary.total)}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-lg border bg-muted/20 overflow-hidden">
                  <div className="max-h-[400px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                        <tr className="border-b">
                          <th className="text-left font-medium px-3 py-2">Дата</th>
                          <th className="text-left font-medium px-3 py-2">Счёт</th>
                          <th className="text-left font-medium px-3 py-2">
                            {config.type === 'transfer' ? 'Куда' : 'Категория'}
                          </th>
                          <th className="text-left font-medium px-3 py-2">Теги</th>
                          <th className="text-right font-medium px-3 py-2">Сумма</th>
                          <th className="text-right font-medium px-3 py-2 w-[100px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                              Нет операций
                            </td>
                          </tr>
                        ) : (
                          rows.slice(0, visibleCount).map((row, idx) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const r = row as any
                            const lineNumber = r.line_number ?? r.lineNumber ?? idx
                            const fromAccount = getRowField(row, 'from_account', 'fromAccount')
                            const toAccount = getRowField(row, 'to_account', 'toAccount')
                            const tags = row.tags ?? []

                            return (
                              <tr
                                key={`${lineNumber}-${idx}`}
                                className="border-b last:border-0 hover:bg-muted/30"
                              >
                                <td className="px-3 py-2 text-muted-foreground">
                                  {format(parseISO(row.date), 'd MMM', { locale: ru })}
                                </td>
                                <td className="px-3 py-2 truncate max-w-[120px]">
                                  {fromAccount || '—'}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">
                                  {toAccount && toAccount !== 'correction' ? toAccount : '—'}
                                </td>
                                <td className="px-3 py-2">
                                  {tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {tags.slice(0, 2).map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {tags.length > 2 && (
                                        <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-medium tabular-nums">
                                  {formatMoney(row.amount, row.currency)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {getStatusBadge(row)}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {hasMore && (
                    <div className="px-3 py-2 border-t bg-muted/30 flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Ещё {rows.length - visibleCount} операций
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          loadMore(config.type)
                        }}
                      >
                        Показать ещё
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </CardContent>
    </Card>
  )
}
