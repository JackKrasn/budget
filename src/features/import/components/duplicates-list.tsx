import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Copy, TrendingDown, ArrowRightLeft, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { ImportDuplicate } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

interface DuplicatesListProps {
  duplicates: ImportDuplicate[]
}

type OperationType = 'expense' | 'transfer' | 'income'

const OPERATION_TYPES: { type: OperationType; label: string; icon: typeof TrendingDown; color: string }[] = [
  { type: 'expense', label: 'Расходы', icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
  { type: 'transfer', label: 'Переводы', icon: ArrowRightLeft, color: 'text-blue-600 dark:text-blue-400' },
  { type: 'income', label: 'Доходы', icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
]

function getTypeLabel(type: string): string {
  switch (type) {
    case 'expense':
      return 'Расход'
    case 'transfer':
      return 'Перевод'
    case 'income':
      return 'Доход'
    default:
      return type
  }
}

export function DuplicatesList({ duplicates }: DuplicatesListProps) {
  const [isOpen, setIsOpen] = useState(duplicates.length <= 5)
  const [selectedTypes, setSelectedTypes] = useState<Set<OperationType>>(new Set(['expense', 'transfer', 'income']))
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())

  // Get unique accounts from duplicates
  const availableAccounts = useMemo(() => {
    const accounts = new Set<string>()
    duplicates.forEach((dup) => {
      if (dup.account) accounts.add(dup.account)
    })
    return Array.from(accounts).sort()
  }, [duplicates])

  // Get type counts
  const typeCounts = useMemo(() => {
    const counts: Record<OperationType, number> = { expense: 0, transfer: 0, income: 0 }
    duplicates.forEach((dup) => {
      if (dup.type in counts) {
        counts[dup.type as OperationType]++
      }
    })
    return counts
  }, [duplicates])

  // Filter duplicates
  const filteredDuplicates = useMemo(() => {
    return duplicates.filter((dup) => {
      const typeMatch = selectedTypes.has(dup.type as OperationType)
      const accountMatch = selectedAccounts.size === 0 || selectedAccounts.has(dup.account)
      return typeMatch && accountMatch
    })
  }, [duplicates, selectedTypes, selectedAccounts])

  const toggleType = (type: OperationType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        // Don't allow removing all types
        if (next.size > 1) {
          next.delete(type)
        }
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

  if (duplicates.length === 0) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      <Alert className="border-muted">
        <Copy className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Найдено дубликатов: {duplicates.length}</span>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7">
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Скрыть
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Показать
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </AlertTitle>
        <AlertDescription>
          Эти операции уже существуют и будут пропущены при импорте
        </AlertDescription>
      </Alert>

      <CollapsibleContent className="space-y-3">
        {/* Filters */}
        <div className="flex flex-col gap-3 p-3 rounded-lg border bg-muted/30">
          {/* Type filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">Тип:</span>
            {OPERATION_TYPES.map(({ type, label, icon: Icon, color }) => {
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

          {/* Filter result info */}
          {(selectedTypes.size < 3 || selectedAccounts.size > 0) && (
            <div className="text-xs text-muted-foreground">
              Показано: {filteredDuplicates.length} из {duplicates.length}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Дата</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Счёт</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead className="text-right pr-4">Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDuplicates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Нет дубликатов с выбранными фильтрами
                  </TableCell>
                </TableRow>
              ) : (
                filteredDuplicates.slice(0, 50).map((dup, idx) => (
                  <TableRow key={`${dup.existingId}-${idx}`}>
                    <TableCell className="pl-4">
                      {format(parseISO(dup.date), 'd MMM yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(dup.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{dup.account}</TableCell>
                    <TableCell>{dup.category ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums pr-4">
                      {dup.amount.toLocaleString('ru-RU', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {CURRENCY_SYMBOLS[dup.currency] ?? dup.currency}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {filteredDuplicates.length > 50 && (
            <div className="p-2 text-center text-sm text-muted-foreground border-t">
              И ещё {filteredDuplicates.length - 50} дубликатов...
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
