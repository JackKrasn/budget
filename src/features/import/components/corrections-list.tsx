import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
import type { ImportCorrection } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

interface CorrectionsListProps {
  corrections: ImportCorrection[]
  defaultOpen?: boolean
}

export function CorrectionsList({ corrections, defaultOpen }: CorrectionsListProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? corrections.length <= 5)

  // React to external open requests
  useEffect(() => {
    if (defaultOpen) {
      setIsOpen(true)
    }
  }, [defaultOpen])

  if (corrections.length === 0) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20">
        <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="flex items-center justify-between">
          <span className="text-amber-800 dark:text-amber-200">
            Корректировок: {corrections.length}
          </span>
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
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          Операции корректировки баланса автоматически пропускаются при импорте
        </AlertDescription>
      </Alert>

      <CollapsibleContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Дата</TableHead>
                <TableHead>Счёт</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right pr-4">Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corrections.slice(0, 20).map((correction, idx) => (
                <TableRow key={`${correction.lineNumber}-${idx}`}>
                  <TableCell className="pl-4">
                    {format(parseISO(correction.date), 'd MMM yyyy', { locale: ru })}
                  </TableCell>
                  <TableCell>{correction.account}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {correction.description || '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums pr-4">
                    {correction.amount >= 0 ? '+' : ''}
                    {correction.amount.toLocaleString('ru-RU', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {CURRENCY_SYMBOLS[correction.currency] ?? correction.currency}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {corrections.length > 20 && (
            <div className="p-2 text-center text-sm text-muted-foreground border-t">
              И ещё {corrections.length - 20} корректировок...
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
