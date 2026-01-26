import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Check, Wallet, PiggyBank, CalendarIcon } from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CategoryIcon } from '@/components/common'
import { AccountIcon } from '@/components/ui/account-icon'
import { cn } from '@/lib/utils'
import type { PlannedExpenseWithDetails, AccountWithType } from '@/lib/api/types'
import { CURRENCY_SYMBOLS } from '@/types'

const formSchema = z.object({
  actualAmount: z.string().optional(),
  accountId: z.string().min(1, 'Выберите счёт'),
  date: z.string().min(1, 'Выберите дату'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface ConfirmPlannedExpenseDialogProps {
  expense: PlannedExpenseWithDetails | null
  accounts: AccountWithType[]
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

  const getDateFromValue = (dateStr: string | { Time: string; Valid: boolean } | null | undefined): Date | null => {
    if (!dateStr) return null
    const dateValue = typeof dateStr === 'string' ? dateStr : dateStr.Valid ? dateStr.Time : null
    if (!dateValue) return null
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return null
    return date
  }

  const formatDateLong = (date: Date | null): string | null => {
    if (!date) return null
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    })
  }

  if (!expense) return null

  const plannedDate = getDateFromValue(expense.planned_date)
  const plannedDateFormatted = formatDateLong(plannedDate)

  const plannedAmount = expense.planned_amount
  const currency = expense.currency || 'RUB'
  const currencySymbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency

  // Фильтруем счета по валюте расхода
  const filteredAccounts = accounts.filter((account) => account.currency === currency)

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
              {formatMoney(plannedAmount)} {currencySymbol}
            </span>
          </div>
          {/* Fund Financing Info */}
          {expense.fund_id && getActualAmount(expense.funded_amount) ? (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30 text-muted-foreground">
              <PiggyBank className="h-4 w-4" />
              <span className="text-sm">Из фонда:</span>
              <span className="text-sm font-medium tabular-nums">
                {formatMoney(getActualAmount(expense.funded_amount) ?? 0)} {currencySymbol}
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
                      {filteredAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <AccountIcon
                              bankName={account.bank_name}
                              typeCode={account.type_code}
                              color={account.color}
                              size="sm"
                              showBackground={false}
                            />
                            <span>{account.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums ml-auto">
                              {formatMoney(account.current_balance)} {currencySymbol}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filteredAccounts.length === 0 && (
                    <FormDescription className="text-destructive">
                      Нет счетов в валюте {currency}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => {
                const selectedDate = field.value ? new Date(field.value) : undefined
                return (
                  <FormItem>
                    <FormLabel>Дата оплаты</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !selectedDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate
                              ? format(selectedDate, 'PPP', { locale: ru })
                              : 'Выберите дату'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(format(date, 'yyyy-MM-dd'))
                            }
                          }}
                          modifiers={plannedDate ? { planned: plannedDate } : undefined}
                          modifiersStyles={{
                            planned: {
                              backgroundColor: 'oklch(0.85 0.15 85)',
                              borderRadius: '9999px',
                              color: 'oklch(0.35 0.1 85)',
                              fontWeight: 600,
                            },
                          }}
                          initialFocus
                          locale={ru}
                        />
                        {plannedDateFormatted && (
                          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'oklch(0.85 0.15 85)' }} />
                            Запланировано на {plannedDateFormatted}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )
              }}
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
