import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Check, X, Lock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// Типы обязательных расходов (локально, позже можно вынести в API)
export interface FixedExpense {
  id: string
  name: string
  plannedAmount: number
  actualAmount: number
  icon: string
  color: string
  frequency: 'monthly' | 'twice_monthly' // раз в месяц или 2 раза
}

interface FixedExpensesSectionProps {
  expenses: FixedExpense[]
  onUpdate: (id: string, plannedAmount: number) => Promise<void>
  onAdd?: () => void
  isPending?: boolean
}

// Предустановленные обязательные расходы
export const DEFAULT_FIXED_EXPENSES: Omit<FixedExpense, 'actualAmount'>[] = [
  {
    id: 'credit-1',
    name: 'Кредит (1-й платёж)',
    plannedAmount: 0,
    icon: '💳',
    color: '#ef4444',
    frequency: 'twice_monthly',
  },
  {
    id: 'credit-2',
    name: 'Кредит (2-й платёж)',
    plannedAmount: 0,
    icon: '💳',
    color: '#ef4444',
    frequency: 'twice_monthly',
  },
  {
    id: 'gym',
    name: 'Зал',
    plannedAmount: 0,
    icon: '🏋️',
    color: '#10b981',
    frequency: 'monthly',
  },
  {
    id: 'dance',
    name: 'Танцы',
    plannedAmount: 0,
    icon: '💃',
    color: '#8b5cf6',
    frequency: 'monthly',
  },
  {
    id: 'spouse-transfer',
    name: 'Перевод супруге',
    plannedAmount: 0,
    icon: '💝',
    color: '#ec4899',
    frequency: 'monthly',
  },
  {
    id: 'trainer',
    name: 'Тренер',
    plannedAmount: 0,
    icon: '🏃',
    color: '#f59e0b',
    frequency: 'monthly',
  },
]

export function FixedExpensesSection({
  expenses,
  onUpdate,
  onAdd,
  isPending,
}: FixedExpensesSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const totals = expenses.reduce(
    (acc, exp) => ({
      planned: acc.planned + exp.plannedAmount,
      actual: acc.actual + exp.actualAmount,
    }),
    { planned: 0, actual: 0 }
  )

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleStartEdit = (id: string, currentValue: number) => {
    setEditingId(id)
    setEditValue(String(currentValue))
  }

  const handleSave = async (id: string) => {
    const amount = parseFloat(editValue) || 0
    await onUpdate(id, amount)
    setEditingId(null)
    setEditValue('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSave(id)
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Обязательные ежемесячные расходы
            </CardTitle>
            {onAdd && (
              <Button variant="outline" size="sm" onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[250px]">Статья</TableHead>
                <TableHead className="w-[120px] text-right">План</TableHead>
                <TableHead className="w-[120px] text-right">Факт</TableHead>
                <TableHead className="w-[120px] text-right">Статус</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const isEditing = editingId === expense.id
                const isPaid = expense.actualAmount >= expense.plannedAmount
                const variance = expense.plannedAmount - expense.actualAmount

                return (
                  <TableRow key={expense.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                          style={{ backgroundColor: expense.color + '20' }}
                        >
                          {expense.icon}
                        </span>
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {expense.frequency === 'twice_monthly'
                              ? '2 раза в месяц'
                              : 'Ежемесячно'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, expense.id)}
                          className="h-8 w-24 text-right ml-auto"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={cn(
                            'tabular-nums',
                            expense.plannedAmount === 0 && 'text-muted-foreground'
                          )}
                        >
                          {formatMoney(expense.plannedAmount)} ₽
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      {formatMoney(expense.actualAmount)} ₽
                    </TableCell>

                    <TableCell className="text-right">
                      {expense.plannedAmount > 0 ? (
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-amber-500/10 text-amber-500'
                          )}
                        >
                          {isPaid ? 'Оплачено' : `Осталось ${formatMoney(variance)} ₽`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleSave(expense.id)}
                            disabled={isPending}
                          >
                            <Check className="h-4 w-4 text-emerald-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() =>
                            handleStartEdit(expense.id, expense.plannedAmount)
                          }
                        >
                          <Edit2 className="h-4 w-4" />
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
                <TableCell className="text-right tabular-nums">
                  {formatMoney(totals.planned)} ₽
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(totals.actual)} ₽
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
