import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Banknote,
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
import { cn } from '@/lib/utils'
import type { RecurringIncome } from '@/lib/api/types'

interface RecurringIncomesSectionProps {
  incomes: RecurringIncome[]
  onAdd: () => void
  onEdit: (income: RecurringIncome) => void
  onDelete: (id: string) => Promise<void>
  onToggleActive: (id: string, isActive: boolean) => Promise<void>
  isDeleting?: boolean
  isToggling?: boolean
}

export function RecurringIncomesSection({
  incomes,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  isDeleting,
  isToggling,
}: RecurringIncomesSectionProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId)
      setDeleteId(null)
    }
  }

  // Сортируем: активные сначала, потом по дню месяца
  const sortedIncomes = [...incomes].sort((a, b) => {
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1
    }
    return a.day_of_month - b.day_of_month
  })

  // Считаем общую сумму активных доходов
  const totalActive = incomes
    .filter((e) => e.is_active)
    .reduce((sum, e) => sum + e.expected_amount, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-4 w-4" style={{ color: 'oklch(0.68 0.15 230)' }} />
              Шаблоны регулярных доходов
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Всего в месяц:{' '}
                <span className="font-semibold text-emerald-500">
                  +{formatMoney(totalActive)} ₽
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
          {incomes.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/30">
              <Banknote className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Нет шаблонов регулярных доходов
              </p>
              <Button variant="outline" size="sm" onClick={onAdd}>
                Создать шаблон
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Источник</TableHead>
                  <TableHead className="w-[100px] text-center">День</TableHead>
                  <TableHead className="w-[140px] text-right">Сумма</TableHead>
                  <TableHead className="w-[100px] text-center">Статус</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedIncomes.map((income) => (
                  <TableRow
                    key={income.id}
                    className={cn(
                      'group',
                      !income.is_active && 'opacity-50'
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'oklch(0.68 0.15 230 / 0.1)' }}>
                          <Banknote className="h-4 w-4" style={{ color: 'oklch(0.68 0.15 230)' }} />
                        </div>
                        <div>
                          <p className="font-medium">{income.source}</p>
                          {income.notes && (
                            <p className="text-xs text-muted-foreground">
                              {income.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {income.day_of_month}
                      </span>
                    </TableCell>

                    <TableCell className="text-right tabular-nums font-medium text-emerald-500">
                      +{formatMoney(income.expected_amount)} ₽
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => onToggleActive(income.id, !income.is_active)}
                        disabled={isToggling}
                      >
                        {income.is_active ? (
                          <ToggleRight className="h-5 w-5" style={{ color: 'oklch(0.68 0.15 230)' }} />
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
                          onClick={() => onEdit(income)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setDeleteId(income.id)}
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
            <AlertDialogTitle>Удалить шаблон дохода?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Шаблон будет удалён, но уже
              созданные на его основе доходы останутся.
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
