import { useState, useMemo, useEffect } from 'react'
import { List, TrendingDown, ArrowRightLeft, TrendingUp, RotateCcw, Check, AlertCircle, Copy } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ImportRow } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

type RowType = 'expense' | 'transfer' | 'income' | 'correction'
type RowStatus = 'ready' | 'unmapped' | 'duplicate'

const ROW_TYPES: { type: RowType; label: string; icon: typeof TrendingDown; color: string }[] = [
  { type: 'expense', label: 'Расходы', icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
  { type: 'transfer', label: 'Переводы', icon: ArrowRightLeft, color: 'text-blue-600 dark:text-blue-400' },
  { type: 'income', label: 'Доходы', icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
  { type: 'correction', label: 'Корректировки', icon: RotateCcw, color: 'text-amber-600 dark:text-amber-400' },
]

const STATUS_CONFIG: Record<RowStatus, { label: string; icon: typeof Check; variant: 'default' | 'secondary' | 'outline' }> = {
  ready: { label: 'Готово', icon: Check, variant: 'default' },
  unmapped: { label: 'Не настроено', icon: AlertCircle, variant: 'secondary' },
  duplicate: { label: 'Дубликат', icon: Copy, variant: 'outline' },
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'expense':
      return 'Расход'
    case 'transfer':
      return 'Перевод'
    case 'income':
      return 'Доход'
    case 'correction':
      return 'Корректировка'
    default:
      return type
  }
}

function getRowStatus(row: ImportRow): RowStatus {
  if (row.is_duplicate) return 'duplicate'
  if (!row.has_mapping) return 'unmapped'
  return 'ready'
}

interface OperationsListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: ImportRow[]
  initialType?: RowType
  title?: string
}

export function OperationsListDialog({
  open,
  onOpenChange,
  rows,
  initialType,
  title = 'Операции',
}: OperationsListDialogProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<RowType>>(
    initialType ? new Set([initialType]) : new Set(['expense', 'transfer', 'income', 'correction'])
  )
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<RowStatus>>(
    new Set(['ready', 'unmapped', 'duplicate'])
  )

  // Reset filters when dialog opens with new type
  useEffect(() => {
    if (open && initialType) {
      setSelectedTypes(new Set([initialType]))
    }
  }, [open, initialType])

  // Get unique accounts
  const availableAccounts = useMemo(() => {
    const accounts = new Set<string>()
    rows.forEach((row) => {
      if (row.from_account) accounts.add(row.from_account)
      // to_account for transfers is the target account, for expenses it's category
      if (row.type === 'transfer' && row.to_account) accounts.add(row.to_account)
    })
    return Array.from(accounts).sort()
  }, [rows])

  // Get counts
  const typeCounts = useMemo(() => {
    const counts: Record<RowType, number> = { expense: 0, transfer: 0, income: 0, correction: 0 }
    rows.forEach((row) => {
      if (row.type in counts) {
        counts[row.type]++
      }
    })
    return counts
  }, [rows])

  const statusCounts = useMemo(() => {
    const counts: Record<RowStatus, number> = { ready: 0, unmapped: 0, duplicate: 0 }
    rows.forEach((row) => {
      const status = getRowStatus(row)
      counts[status]++
    })
    return counts
  }, [rows])

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const typeMatch = selectedTypes.has(row.type)
      const accountMatch = selectedAccounts.size === 0 ||
        selectedAccounts.has(row.from_account) ||
        (row.type === 'transfer' && selectedAccounts.has(row.to_account))
      const status = getRowStatus(row)
      const statusMatch = selectedStatuses.has(status)
      return typeMatch && accountMatch && statusMatch
    })
  }, [rows, selectedTypes, selectedAccounts, selectedStatuses])

  const toggleType = (type: RowType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const toggleAccount = (account: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev)
      if (next.has(account)) {
        next.delete(account)
      } else {
        next.add(account)
      }
      return next
    })
  }

  const toggleStatus = (status: RowStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) {
        if (next.size > 1) next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            {title}
            <Badge variant="secondary" className="ml-2">
              {rows.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 p-3 rounded-lg border bg-muted/30">
            {/* Type filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1">Тип:</span>
              {ROW_TYPES.map(({ type, label, icon: Icon, color }) => {
                const isSelected = selectedTypes.has(type)
                const count = typeCounts[type]
                if (count === 0) return null
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50 opacity-60'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', isSelected ? color : 'text-muted-foreground')} />
                    <span className={isSelected ? '' : 'text-muted-foreground'}>{label}</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  </button>
                )
              })}
            </div>

            {/* Status filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1">Статус:</span>
              {(Object.entries(STATUS_CONFIG) as [RowStatus, typeof STATUS_CONFIG.ready][]).map(
                ([status, config]) => {
                  const isSelected = selectedStatuses.has(status)
                  const count = statusCounts[status]
                  if (count === 0) return null
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleStatus(status)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50 opacity-60'
                      )}
                    >
                      <span className={isSelected ? '' : 'text-muted-foreground'}>{config.label}</span>
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {count}
                      </Badge>
                    </button>
                  )
                }
              )}
            </div>

            {/* Account filters */}
            {availableAccounts.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground mr-1">Счёт:</span>
                {availableAccounts.map((account) => {
                  const isSelected = selectedAccounts.has(account)
                  return (
                    <Badge
                      key={account}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-colors',
                        !isSelected && 'text-muted-foreground hover:text-foreground hover:border-primary/50'
                      )}
                      onClick={() => toggleAccount(account)}
                    >
                      {account}
                    </Badge>
                  )
                })}
                {selectedAccounts.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAccounts(new Set())}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-1"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            )}

            {/* Filter result */}
            <div className="text-xs text-muted-foreground">
              Показано: {filteredRows.length} из {rows.length}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="pl-4 w-[100px]">Дата</TableHead>
                  <TableHead className="w-[90px]">Тип</TableHead>
                  <TableHead>Счёт</TableHead>
                  <TableHead>Категория/Куда</TableHead>
                  <TableHead className="text-right w-[120px]">Сумма</TableHead>
                  <TableHead className="pr-4 w-[100px]">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Нет операций с выбранными фильтрами
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.slice(0, 100).map((row, idx) => {
                    const status = getRowStatus(row)
                    const statusConfig = STATUS_CONFIG[status]
                    return (
                      <TableRow key={`${row.line_number}-${idx}`}>
                        <TableCell className="pl-4">
                          {format(parseISO(row.date), 'd MMM', { locale: ru })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(row.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="truncate max-w-[150px]">
                          {row.from_account}
                        </TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[150px]">
                          {row.type === 'transfer'
                            ? row.to_account
                            : row.to_account !== 'correction' ? row.to_account : '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {row.amount.toLocaleString('ru-RU', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{' '}
                          {CURRENCY_SYMBOLS[row.currency] ?? row.currency}
                        </TableCell>
                        <TableCell className="pr-4">
                          <Badge variant={statusConfig.variant} className="text-xs">
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            {filteredRows.length > 100 && (
              <div className="p-2 text-center text-sm text-muted-foreground border-t">
                И ещё {filteredRows.length - 100} операций...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
