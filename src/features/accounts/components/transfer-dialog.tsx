import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowDown, ArrowUpDown } from 'lucide-react'
import { AccountIcon } from '@/components/ui/account-icon'
import { useCreateTransfer, useAccounts } from '../hooks'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

const formSchema = z.object({
  fromAccountId: z.string().min(1, 'Выберите счёт списания'),
  toAccountId: z.string().min(1, 'Выберите счёт зачисления'),
  amount: z.string().min(1, 'Введите сумму'),
  toAmount: z.string().optional(),
  exchangeRate: z.string().optional(),
  feeAmount: z.string().optional(),
  date: z.string().min(1, 'Выберите дату'),
  description: z.string().optional(),
}).refine((data) => data.fromAccountId !== data.toAccountId, {
  message: 'Счёт списания и зачисления должны быть разными',
  path: ['toAccountId'],
})

type FormValues = z.infer<typeof formSchema>

interface TransferDialogProps {
  children: React.ReactNode
  defaultFromAccountId?: string
  defaultToAccountId?: string
}

export function TransferDialog({
  children,
  defaultFromAccountId,
  defaultToAccountId,
}: TransferDialogProps) {
  const [open, setOpen] = useState(false)
  const createTransfer = useCreateTransfer()
  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts()

  const accounts = accountsData?.data.filter((a) => !a.is_archived) ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAccountId: defaultFromAccountId || '',
      toAccountId: defaultToAccountId || '',
      amount: '',
      toAmount: '',
      exchangeRate: '',
      feeAmount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    },
  })

  // Update defaults when props change
  useEffect(() => {
    if (defaultFromAccountId) {
      form.setValue('fromAccountId', defaultFromAccountId)
    }
    if (defaultToAccountId) {
      form.setValue('toAccountId', defaultToAccountId)
    }
  }, [defaultFromAccountId, defaultToAccountId, form])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        fromAccountId: defaultFromAccountId || '',
        toAccountId: defaultToAccountId || '',
        amount: '',
        toAmount: '',
        exchangeRate: '',
        feeAmount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      })
    }
  }, [open, defaultFromAccountId, defaultToAccountId, form])

  const watchedFromAccountId = form.watch('fromAccountId')
  const watchedToAccountId = form.watch('toAccountId')
  const watchedAmount = form.watch('amount')
  const watchedToAmount = form.watch('toAmount')

  const fromAccount = accounts.find((a) => a.id === watchedFromAccountId)
  const toAccount = accounts.find((a) => a.id === watchedToAccountId)

  const fromCurrency = fromAccount?.currency
  const toCurrency = toAccount?.currency
  const isDifferentCurrencies = fromCurrency && toCurrency && fromCurrency !== toCurrency

  const fromCurrencySymbol = fromCurrency
    ? CURRENCY_SYMBOLS[fromCurrency] || fromCurrency
    : '₽'
  const toCurrencySymbol = toCurrency
    ? CURRENCY_SYMBOLS[toCurrency] || toCurrency
    : '₽'

  // Auto-calculate exchange rate when both amounts are entered
  // Rate shows: how much fromCurrency per 1 toCurrency (e.g., 80.55 RUB per 1 USD)
  useEffect(() => {
    if (isDifferentCurrencies && watchedAmount && watchedToAmount) {
      const amount = parseFloat(watchedAmount)
      const toAmount = parseFloat(watchedToAmount)
      if (amount > 0 && toAmount > 0) {
        const rate = amount / toAmount
        form.setValue('exchangeRate', rate.toFixed(2))
      }
    }
  }, [watchedAmount, watchedToAmount, isDifferentCurrencies, form])

  const handleSwapAccounts = () => {
    const from = form.getValues('fromAccountId')
    const to = form.getValues('toAccountId')
    form.setValue('fromAccountId', to)
    form.setValue('toAccountId', from)
  }

  async function onSubmit(values: FormValues) {
    try {
      const amount = parseFloat(values.amount)
      if (isNaN(amount) || amount <= 0) {
        form.setError('amount', { message: 'Введите корректную сумму' })
        return
      }

      // Validate toAmount is required for different currencies
      if (isDifferentCurrencies) {
        const toAmount = values.toAmount ? parseFloat(values.toAmount) : 0
        if (isNaN(toAmount) || toAmount <= 0) {
          form.setError('toAmount', { message: 'Введите сумму зачисления' })
          return
        }
      }

      // Parse optional numeric fields
      const toAmount = values.toAmount ? parseFloat(values.toAmount) : undefined
      const exchangeRate = values.exchangeRate ? parseFloat(values.exchangeRate) : undefined
      const feeAmount = values.feeAmount ? parseFloat(values.feeAmount) : undefined

      await createTransfer.mutateAsync({
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount,
        ...(isDifferentCurrencies && toAmount ? { toAmount } : {}),
        ...(exchangeRate ? { exchangeRate } : {}),
        ...(feeAmount && feeAmount > 0 ? { feeAmount } : {}),
        date: values.date,
        description: values.description || undefined,
      })
      form.reset()
      setOpen(false)
    } catch {
      // Error is handled in mutation
    }
  }

  const formatNumber = (num: number) =>
    num.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Перевод между счетами
          </DialogTitle>
          <DialogDescription>
            Переведите средства с одного счёта на другой
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Transfer Direction Block */}
            <div className="relative rounded-xl border border-border/60 bg-muted/30 p-4">
              {/* Vertical connector line */}
              <div className="absolute left-7 top-[4.5rem] bottom-[4.5rem] w-px bg-gradient-to-b from-red-400/50 via-muted-foreground/30 to-emerald-400/50" />

              {/* From Account */}
              <FormField
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <FormItem className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-background z-10">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                      </div>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        Откуда
                      </FormLabel>
                    </div>
                    <div className="pl-8">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingAccounts}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full bg-background border-border/50 h-12">
                            <SelectValue placeholder="Выберите счёт списания" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
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
                                <span className="text-muted-foreground ml-auto">
                                  {formatNumber(account.current_balance)}{' '}
                                  {CURRENCY_SYMBOLS[account.currency] || account.currency}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Arrow & Swap Button */}
              <div className="flex items-center gap-3 py-3 pl-8">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border/50 shadow-sm">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSwapAccounts}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Поменять
                </Button>
              </div>

              {/* To Account */}
              <FormField
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <FormItem className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-background z-10">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        Куда
                      </FormLabel>
                    </div>
                    <div className="pl-8">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingAccounts}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full bg-background border-border/50 h-12">
                            <SelectValue placeholder="Выберите счёт зачисления" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
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
                                <span className="text-muted-foreground ml-auto">
                                  {formatNumber(account.current_balance)}{' '}
                                  {CURRENCY_SYMBOLS[account.currency] || account.currency}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isDifferentCurrencies ? 'Сумма списания' : 'Сумма'}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0"
                        className="pr-10"
                        {...field}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {fromCurrencySymbol}
                      </span>
                    </div>
                  </FormControl>
                  {fromAccount && (
                    <FormDescription>
                      Доступно: {formatNumber(fromAccount.current_balance)} {fromCurrencySymbol}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency Conversion Fields - shown only when currencies differ */}
            {isDifferentCurrencies && (
              <div className="space-y-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <ArrowUpDown className="h-4 w-4" />
                  Конвертация {fromCurrency} → {toCurrency}
                </div>

                {/* To Amount */}
                <FormField
                  control={form.control}
                  name="toAmount"
                  render={({ field }) => {
                    const amountNotEntered = !watchedAmount || parseFloat(watchedAmount) <= 0
                    return (
                      <FormItem>
                        <FormLabel>Сумма зачисления</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder={amountNotEntered ? 'Сначала введите сумму списания' : '0'}
                              className="pr-10"
                              disabled={amountNotEntered}
                              {...field}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {toCurrencySymbol}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />

                {/* Exchange Rate */}
                <FormField
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => {
                    const rate = field.value ? parseFloat(field.value) : 0
                    // For reverse rate use more precision for small values
                    const reverseRate = rate > 0
                      ? (1 / rate < 1 ? (1 / rate).toFixed(4) : (1 / rate).toFixed(2))
                      : '?'
                    return (
                      <FormItem>
                        <FormLabel>Курс обмена</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Рассчитывается автоматически"
                              className="pr-24"
                              {...field}
                              readOnly
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {fromCurrencySymbol}/{toCurrencySymbol}
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          1 {toCurrencySymbol} = {field.value || '?'} {fromCurrencySymbol}
                          {' · '}
                          1 {fromCurrencySymbol} = {reverseRate} {toCurrencySymbol}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />

                {/* Fee Amount */}
                <FormField
                  control={form.control}
                  name="feeAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Комиссия (опционально)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            className="pr-10"
                            {...field}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {fromCurrencySymbol}
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Дополнительно спишется со счёта-источника
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Fee Amount for same currency transfers */}
            {!isDifferentCurrencies && (
              <FormField
                control={form.control}
                name="feeAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Комиссия (опционально)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          className="pr-10"
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {fromCurrencySymbol}
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Дополнительно спишется со счёта-источника
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
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
                  <FormLabel>Описание (опционально)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Пополнение накопительного"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createTransfer.isPending}
              >
                {createTransfer.isPending ? 'Перевод...' : 'Перевести'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
