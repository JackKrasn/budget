import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon, CreditCard, ArrowRight, Wallet, Loader2, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { AccountIcon } from '@/components/ui/account-icon'
import { useAccounts, useRepayCredit, useCreditCardReserves } from '../hooks'
import type { AccountWithType } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formSchema = z.object({
  fromAccountId: z.string().min(1, 'Выберите счёт для погашения'),
  amount: z.string().min(1, 'Введите сумму'),
  date: z.date(),
  description: z.string().optional(),
  applyReserves: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface RepayCreditCardDialogProps {
  creditCard: AccountWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RepayCreditCardDialog({
  creditCard,
  open,
  onOpenChange,
}: RepayCreditCardDialogProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const { data: accountsData } = useAccounts()
  const repayCredit = useRepayCredit()

  // Fetch pending reserves for the credit card
  const { data: reservesData } = useCreditCardReserves(creditCard?.id || '')

  const pendingReservesAmount = reservesData?.totalPending ?? 0
  const pendingReservesCount = reservesData?.data?.length ?? 0

  // Filter to only show debit accounts (not credit cards) with same currency
  const debitAccounts = (accountsData?.data ?? []).filter(
    (account) =>
      !account.is_credit &&
      !account.is_archived &&
      account.currency === creditCard?.currency
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAccountId: '',
      amount: '',
      date: new Date(),
      description: '',
      applyReserves: true,
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open && creditCard) {
      const debtAmount = creditCard.current_balance < 0 ? Math.abs(creditCard.current_balance) : 0
      form.reset({
        fromAccountId: '',
        amount: debtAmount > 0 ? debtAmount.toString() : '',
        date: new Date(),
        description: '',
        applyReserves: true,
      })
    }
  }, [open, creditCard, form])

  if (!creditCard) return null

  const currencySymbol = CURRENCY_SYMBOLS[creditCard.currency] || creditCard.currency
  const currentDebt = creditCard.current_balance < 0 ? Math.abs(creditCard.current_balance) : 0

  const handleSubmit = async (values: FormValues) => {
    try {
      await repayCredit.mutateAsync({
        creditCardId: creditCard.id,
        data: {
          fromAccountId: values.fromAccountId,
          amount: parseFloat(values.amount),
          date: format(values.date, 'yyyy-MM-dd'),
          description: values.description || undefined,
          applyReserves: values.applyReserves,
        },
      })
      onOpenChange(false)
    } catch {
      // Error handled in mutation
    }
  }

  const watchAmount = form.watch('amount')
  const watchApplyReserves = form.watch('applyReserves')
  const enteredAmount = parseFloat(watchAmount) || 0
  const reservesToApply = watchApplyReserves ? Math.min(pendingReservesAmount, enteredAmount) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Погашение кредитной карты
          </DialogTitle>
          <DialogDescription>
            Погасите задолженность по карте &quot;{creditCard.name}&quot;
          </DialogDescription>
        </DialogHeader>

        {/* Current debt info */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Текущий долг:</span>
            <span className={cn(
              'font-semibold tabular-nums',
              currentDebt > 0 ? 'text-destructive' : 'text-emerald-600'
            )}>
              {currentDebt > 0 ? '-' : ''}{formatMoney(currentDebt)} {currencySymbol}
            </span>
          </div>
          {pendingReservesCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ожидающих резервов:</span>
              <span className="font-medium text-amber-600">
                {formatMoney(pendingReservesAmount)} {currencySymbol}
                <span className="text-muted-foreground ml-1">({pendingReservesCount})</span>
              </span>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* From Account */}
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Счёт списания</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите счёт..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {debitAccounts.map((account) => (
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
                            {account.bank_name && (
                              <span className="text-muted-foreground">
                                ({account.bank_name})
                              </span>
                            )}
                            <span className="ml-auto text-muted-foreground tabular-nums">
                              {formatMoney(account.current_balance)} {currencySymbol}
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

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма погашения</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currencySymbol}
                      </span>
                    </div>
                  </FormControl>
                  {currentDebt > 0 && (
                    <FormDescription>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => form.setValue('amount', currentDebt.toString())}
                      >
                        Погасить весь долг ({formatMoney(currentDebt)} {currencySymbol})
                      </Button>
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Дата</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'd MMMM yyyy', { locale: ru })
                          ) : (
                            <span>Выберите дату</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setCalendarOpen(false)
                        }}
                        initialFocus
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий (опционально)</FormLabel>
                  <FormControl>
                    <Input placeholder="Погашение кредитки" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Apply Reserves Checkbox */}
            {pendingReservesCount > 0 && (
              <FormField
                control={form.control}
                name="applyReserves"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border/50 bg-muted/20 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Применить резервы
                      </FormLabel>
                      <FormDescription>
                        Автоматически пометить ожидающие резервы как использованные
                        (до {formatMoney(Math.min(pendingReservesAmount, enteredAmount || pendingReservesAmount))} {currencySymbol})
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Flow visualization */}
            <div className="flex items-center justify-center gap-3 py-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span>Дебетовый счёт</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <span>Кредитная карта</span>
              </div>
            </div>

            {/* Summary */}
            {enteredAmount > 0 && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm text-blue-700 dark:text-blue-400">
                  Будет создан перевод на сумму {formatMoney(enteredAmount)} {currencySymbol}
                  {watchApplyReserves && reservesToApply > 0 && (
                    <span> и применены резервы на {formatMoney(reservesToApply)} {currencySymbol}</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={repayCredit.isPending}
              >
                {repayCredit.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Погашение...
                  </>
                ) : (
                  'Погасить'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
