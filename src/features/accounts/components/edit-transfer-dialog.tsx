import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowUpDown, Pencil, Loader2 } from 'lucide-react'
import { useUpdateTransfer } from '../hooks'
import type { TransferWithAccounts } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

const formSchema = z.object({
  fromAmount: z.string().min(1, 'Введите сумму списания'),
  toAmount: z.string().optional(),
  exchangeRate: z.string().optional(),
  feeAmount: z.string().optional(),
  date: z.string().min(1, 'Выберите дату'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditTransferDialogProps {
  transfer: TransferWithAccounts | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTransferDialog({
  transfer,
  open,
  onOpenChange,
}: EditTransferDialogProps) {
  const updateTransfer = useUpdateTransfer()

  const isDifferentCurrencies = transfer
    ? transfer.from_currency !== transfer.to_currency
    : false

  const fromCurrencySymbol = transfer
    ? CURRENCY_SYMBOLS[transfer.from_currency] || transfer.from_currency
    : '₽'
  const toCurrencySymbol = transfer
    ? CURRENCY_SYMBOLS[transfer.to_currency] || transfer.to_currency
    : '₽'

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAmount: '',
      toAmount: '',
      exchangeRate: '',
      feeAmount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    },
  })

  const watchedFromAmount = form.watch('fromAmount')
  const watchedToAmount = form.watch('toAmount')

  // Auto-calculate exchange rate when both amounts are entered
  useEffect(() => {
    if (isDifferentCurrencies && watchedFromAmount && watchedToAmount) {
      const fromAmount = parseFloat(watchedFromAmount)
      const toAmount = parseFloat(watchedToAmount)
      if (fromAmount > 0 && toAmount > 0) {
        const rate = fromAmount / toAmount
        form.setValue('exchangeRate', rate.toFixed(4))
      }
    }
  }, [watchedFromAmount, watchedToAmount, isDifferentCurrencies, form])

  // Reset form with transfer data when dialog opens
  useEffect(() => {
    if (open && transfer) {
      form.reset({
        fromAmount: String(transfer.amount),
        toAmount: transfer.to_amount ? String(transfer.to_amount) : '',
        exchangeRate: transfer.exchange_rate ? String(transfer.exchange_rate) : '',
        feeAmount: transfer.fee_amount ? String(transfer.fee_amount) : '',
        date: transfer.date.split('T')[0],
        description: transfer.description || '',
      })
    }
  }, [open, transfer, form])

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  async function onSubmit(values: FormValues) {
    if (!transfer) return

    const fromAmount = parseFloat(values.fromAmount)
    if (isNaN(fromAmount) || fromAmount <= 0) {
      form.setError('fromAmount', { message: 'Введите корректную сумму' })
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

    try {
      await updateTransfer.mutateAsync({
        id: transfer.id,
        data: {
          fromAmount,
          ...(isDifferentCurrencies && toAmount ? { toAmount } : {}),
          ...(exchangeRate ? { exchangeRate } : {}),
          ...(feeAmount !== undefined ? { feeAmount } : {}),
          date: values.date,
          description: values.description || null,
        },
      })
      handleClose()
    } catch {
      // Error is handled in mutation
    }
  }

  if (!transfer) return null

  const exchangeRateValue = form.watch('exchangeRate')
  const rate = exchangeRateValue ? parseFloat(exchangeRateValue) : 0
  const reverseRate = rate > 0
    ? (1 / rate < 1 ? (1 / rate).toFixed(4) : (1 / rate).toFixed(2))
    : '?'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Редактировать перевод
          </DialogTitle>
          <DialogDescription>
            Изменение сумм и метаданных перевода
          </DialogDescription>
        </DialogHeader>

        {/* Account Info (read-only) */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Откуда</p>
            <p className="font-medium text-sm">{transfer.from_account_name}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Куда</p>
            <p className="font-medium text-sm">{transfer.to_account_name}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* From Amount */}
            <FormField
              control={form.control}
              name="fromAmount"
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency Conversion Fields */}
            {isDifferentCurrencies && (
              <div className="space-y-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <ArrowUpDown className="h-4 w-4" />
                  Конвертация {transfer.from_currency} → {transfer.to_currency}
                </div>

                {/* To Amount */}
                <FormField
                  control={form.control}
                  name="toAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сумма зачисления</FormLabel>
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
                            {toCurrencySymbol}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Exchange Rate */}
                <FormField
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Курс обмена</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.0001"
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
                  )}
                />
              </div>
            )}

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
                    Дополнительно списывается со счёта-источника
                  </FormDescription>
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
                onClick={handleClose}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateTransfer.isPending}
              >
                {updateTransfer.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
