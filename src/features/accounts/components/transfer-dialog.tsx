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
        date: new Date().toISOString().split('T')[0],
        description: '',
      })
    }
  }, [open, defaultFromAccountId, defaultToAccountId, form])

  const watchedFromAccountId = form.watch('fromAccountId')
  const fromAccount = accounts.find((a) => a.id === watchedFromAccountId)
  const currencySymbol = fromAccount
    ? CURRENCY_SYMBOLS[fromAccount.currency] || fromAccount.currency
    : '₽'

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

      // Get currency from source account
      const currency = fromAccount?.currency || 'RUB'

      await createTransfer.mutateAsync({
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount,
        currency,
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
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: account.color || '#10b981' }}
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
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: account.color || '#10b981' }}
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
                  <FormLabel>Сумма</FormLabel>
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
                        {currencySymbol}
                      </span>
                    </div>
                  </FormControl>
                  {fromAccount && (
                    <FormDescription>
                      Доступно: {formatNumber(fromAccount.current_balance)} {currencySymbol}
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
