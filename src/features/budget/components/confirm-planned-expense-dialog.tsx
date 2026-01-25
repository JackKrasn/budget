import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Wallet, PiggyBank } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryIcon } from '@/components/common'
import type { PlannedExpenseWithDetails, Account } from '@/lib/api/types'

const formSchema = z.object({
  actualAmount: z.string().optional(),
  accountId: z.string().min(1, 'Выберите счёт'),
  date: z.string().min(1, 'Выберите дату'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface ConfirmPlannedExpenseDialogProps {
  expense: PlannedExpenseWithDetails | null
  accounts: Account[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: {
    actualAmount?: number
    accountId: string
    date: string
    notes?: string
  }) => Promise<void>
  isPending?: boolean
}

export function ConfirmPlannedExpenseDialog({
  expense,
  accounts,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: ConfirmPlannedExpenseDialogProps) {
  // Дата по умолчанию — сегодня
  const today = new Date().toISOString().split('T')[0]

  // Извлечь число из nullable типа бэкенда (может быть {Float64: number, Valid: boolean} или просто number)
  const getActualAmount = (
    value: number | { Float64: number; Valid: boolean } | null | undefined
  ): number | null => {
    if (value == null) return null
    if (typeof value === 'number') return value
    if (typeof value === 'object' && 'Valid' in value && value.Valid) {
      return value.Float64
    }
    return null
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualAmount: '',
      accountId: '',
      date: today,
      notes: '',
    },
  })

  // При открытии диалога подставляем счёт по умолчанию из планового расхода
  useEffect(() => {
    if (expense && open) {
      form.reset({
        actualAmount: '',
        accountId: expense.account_id ?? '',
        date: today,
        notes: '',
      })
    }
  }, [expense, open, form, today])

  const handleSubmit = async (data: FormData) => {
    const actualAmount = data.actualAmount ? parseFloat(data.actualAmount) : undefined
    await onConfirm({
      actualAmount,
      accountId: data.accountId,
      date: data.date,
      notes: data.notes || undefined,
    })
    form.reset()
    onOpenChange(false)
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  if (!expense) return null

  const plannedAmount = expense.planned_amount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Подтвердить оплату</DialogTitle>
          <DialogDescription>
            Отметьте запланированный расход как оплаченный
          </DialogDescription>
        </DialogHeader>

        {/* Expense Info */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
          <div className="flex items-center gap-3 mb-2">
            <CategoryIcon
              code={expense.category_code}
              iconName={expense.category_icon}
              color={expense.category_color}
              size="md"
            />
            <div>
              <p className="font-semibold">{expense.name}</p>
              <p className="text-xs text-muted-foreground">{expense.category_name}</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">Запланировано:</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatMoney(plannedAmount)} ₽
            </span>
          </div>
          {/* Fund Financing Info */}
          {expense.fund_id && getActualAmount(expense.funded_amount) ? (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30 text-muted-foreground">
              <PiggyBank className="h-4 w-4" />
              <span className="text-sm">Из фонда:</span>
              <span className="text-sm font-medium tabular-nums">
                {formatMoney(getActualAmount(expense.funded_amount) ?? 0)} ₽
              </span>
            </div>
          ) : null}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="actualAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Фактическая сумма (опционально)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={`${plannedAmount}`}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Оставьте пустым, если оплатили как запланировано
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Счёт оплаты</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите счёт" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4" />
                              <span>{account.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums ml-2">
                              {account.current_balance.toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата оплаты</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Примечание (опционально)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Дополнительная информация..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                <Check className="mr-2 h-4 w-4" />
                Подтвердить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
