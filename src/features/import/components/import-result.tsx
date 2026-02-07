import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingDown,
  ArrowRightLeft,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { ExecuteImportResponse, ImportedOperation } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

type OperationType = 'expense' | 'transfer' | 'income'

interface OperationConfig {
  type: OperationType
  label: string
  labelPlural: string
  icon: typeof TrendingDown
  bgColor: string
  iconColor: string
}

const OPERATION_CONFIGS: OperationConfig[] = [
  {
    type: 'expense',
    label: 'Расход',
    labelPlural: 'Расходы',
    icon: TrendingDown,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    type: 'transfer',
    label: 'Перевод',
    labelPlural: 'Переводы',
    icon: ArrowRightLeft,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    type: 'income',
    label: 'Доход',
    labelPlural: 'Доходы',
    icon: TrendingUp,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
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

const INITIAL_VISIBLE = 20
const LOAD_MORE_COUNT = 30

interface ImportResultProps {
  result: ExecuteImportResponse
  onNavigateToExpenses: () => void
  onImportMore: () => void
}

export function ImportResult({
  result,
  onNavigateToExpenses,
  onImportMore,
}: ImportResultProps) {
  const [errorsOpen, setErrorsOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Set<OperationType>>(new Set())
  const [visibleCounts, setVisibleCounts] = useState<Record<OperationType, number>>({
    expense: INITIAL_VISIBLE,
    transfer: INITIAL_VISIBLE,
    income: INITIAL_VISIBLE,
  })

  const { summary, imported } = result
  const totalImported =
    summary.expensesImported + summary.transfersImported + summary.incomesImported
  const hasErrors = summary.errorsCount > 0
  const isSuccess = totalImported > 0 && !hasErrors

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

  const getOperations = (type: OperationType): ImportedOperation[] => {
    switch (type) {
      case 'expense':
        return imported.expenses
      case 'transfer':
        return imported.transfers
      case 'income':
        return imported.incomes
    }
  }

  const getTotal = (operations: ImportedOperation[]) => {
    return operations.reduce((sum, op) => sum + op.amount, 0)
  }

  return (
    <div className="space-y-6">
      {/* Success/Warning Banner */}
      <Card
        className={
          isSuccess
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
            : hasErrors
            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
            : ''
        }
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            {isSuccess ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : hasErrors ? (
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <span
              className={
                isSuccess
                  ? 'text-green-800 dark:text-green-200'
                  : hasErrors
                  ? 'text-amber-800 dark:text-amber-200'
                  : 'text-red-800 dark:text-red-200'
              }
            >
              {isSuccess
                ? 'Импорт завершён успешно'
                : hasErrors
                ? 'Импорт завершён с ошибками'
                : 'Импорт не выполнен'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground">
            Импортировано {totalImported} операций
            {summary.duplicatesSkipped > 0 && `, пропущено ${summary.duplicatesSkipped} дубликатов`}
          </p>
        </CardContent>
      </Card>

      {/* Imported Operations by Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Импортированные операции</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {OPERATION_CONFIGS.map((config) => {
            const operations = getOperations(config.type)
            const isOpen = openSections.has(config.type)
            const visibleCount = visibleCounts[config.type]
            const hasMore = operations.length > visibleCount

            if (operations.length === 0) return null

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
                      <span className="font-medium">{config.labelPlural}</span>
                      <Badge variant="secondary" className="text-xs">
                        {operations.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium tabular-nums">
                        {formatMoney(getTotal(operations))}
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
                    <div className="max-h-[300px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                          <tr className="border-b">
                            <th className="text-left font-medium px-3 py-2">Дата</th>
                            <th className="text-right font-medium px-3 py-2">Сумма</th>
                          </tr>
                        </thead>
                        <tbody>
                          {operations.slice(0, visibleCount).map((op, idx) => (
                            <tr
                              key={`${op.id}-${idx}`}
                              className="border-b last:border-0 hover:bg-muted/30"
                            >
                              <td className="px-3 py-2 text-muted-foreground">
                                {format(parseISO(op.date), 'd MMMM yyyy', { locale: ru })}
                              </td>
                              <td className="px-3 py-2 text-right font-medium tabular-nums">
                                {formatMoney(op.amount, op.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {hasMore && (
                      <div className="px-3 py-2 border-t bg-muted/30 flex items-center justify-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Ещё {operations.length - visibleCount} операций
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

          {totalImported === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Нет импортированных операций
            </p>
          )}
        </CardContent>
      </Card>

      {/* Errors List */}
      {result.errors.length > 0 && (
        <Collapsible open={errorsOpen} onOpenChange={setErrorsOpen}>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>Ошибки ({result.errors.length})</span>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7">
                  {errorsOpen ? (
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
              Некоторые операции не удалось импортировать
            </AlertDescription>

            <CollapsibleContent>
              <div className="mt-4 rounded-md border border-destructive/20 bg-background overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="text-left font-medium px-3 py-2 w-[80px]">Строка</th>
                      <th className="text-left font-medium px-3 py-2">Тип</th>
                      <th className="text-left font-medium px-3 py-2">Ошибка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.slice(0, 20).map((error, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-3 py-2 font-mono text-xs">
                          #{error.lineNumber}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {error.type === 'expense'
                              ? 'Расход'
                              : error.type === 'transfer'
                              ? 'Перевод'
                              : 'Доход'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-sm">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.errors.length > 20 && (
                  <div className="p-2 text-center text-sm text-muted-foreground border-t">
                    И ещё {result.errors.length - 20} ошибок...
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Alert>
        </Collapsible>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" onClick={onImportMore}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Импортировать ещё
        </Button>
        <Button onClick={onNavigateToExpenses}>
          Посмотреть расходы
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
