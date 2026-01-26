import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CategoryIcon } from '@/components/common'
import { cn } from '@/lib/utils'
import type { RecurringExpenseWithCategory, ExchangeRate } from '@/lib/api/types'
import { CURRENCY_SYMBOLS } from '@/types'

interface RecurringExpensesSectionProps {
  expenses: RecurringExpenseWithCategory[]
  exchangeRates?: ExchangeRate[]
  onAdd: () => void
  onEdit: (expense: RecurringExpenseWithCategory) => void
  onDelete: (id: string) => Promise<void>
  onToggleActive: (id: string, isActive: boolean) => Promise<void>
  isDeleting?: boolean
  isToggling?: boolean
}

export function RecurringExpensesSection({
  expenses,
  exchangeRates = [],
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  isDeleting,
  isToggling,
}: RecurringExpensesSectionProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Получить курс валюты к RUB
  const getExchangeRate = (currency: string): number => {
    if (currency === 'RUB') return 1
    const rate = exchangeRates.find(
      (r) => r.from_currency === currency && r.to_currency === 'RUB'
    )
    return rate?.rate ?? 1
  }

  // Конвертировать в RUB
  const toRub = (amount: number, currency: string): number => {
    return amount * getExchangeRate(currency)
  }

  // Форматирование суммы с символом валюты
  const formatMoneyWithCurrency = (amount: number, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency
    return `${formatMoney(amount)} ${symbol}`
  }

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId)
      setDeleteId(null)
    }
  }

  // Сортируем: активные сначала, потом по дню месяца
  const sortedExpenses = [...expenses].sort((a, b) => {
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1
    }
    return a.day_of_month - b.day_of_month
  })

  // Считаем общую сумму активных расходов (в RUB)
  const totalActiveRub = expenses
    .filter((e) => e.is_active)
    .reduce((sum, e) => sum + toRub(e.amount, e.currency || 'RUB'), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              Шаблоны повторяющихся расходов
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Всего в месяц:{' '}
                <span className="font-semibold text-foreground">
                  {formatMoney(totalActiveRub)} ₽
                </span>
              </span>
              <Button variant="outline" size="sm" onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {expenses.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/30">
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Нет шаблонов повторяющихся расходов
              </p>
              <Button variant="outline" size="sm" onClick={onAdd}>
                Создать шаблон
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Название</TableHead>
                  <TableHead className="w-[100px] text-center">День</TableHead>
                  <TableHead className="w-[120px] text-right">Сумма</TableHead>
                  <TableHead className="w-[100px] text-center">Статус</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    className={cn(
                      'group',
                      !expense.is_active && 'opacity-50'
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <CategoryIcon
                          code={expense.category_code}
                          iconName={expense.category_icon}
                          color={expense.category_color}
                          size="md"
                        />
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {expense.category_name}
                            {expense.fund_name && ` • ${expense.fund_name}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {expense.day_of_month}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="tabular-nums font-medium">
                          {formatMoneyWithCurrency(expense.amount, expense.currency || 'RUB')}
                        </span>
                        {expense.currency && expense.currency !== 'RUB' && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            ≈ {formatMoney(toRub(expense.amount, expense.currency))} ₽
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => onToggleActive(expense.id, !expense.is_active)}
                        disabled={isToggling}
                      >
                        {expense.is_active ? (
                          <ToggleRight className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onEdit(expense)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setDeleteId(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить шаблон?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Шаблон будет удалён, но уже
              созданные на его основе расходы останутся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
