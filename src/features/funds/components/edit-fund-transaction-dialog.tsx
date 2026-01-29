import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Pencil, Loader2, ShoppingCart, DollarSign, ArrowDownLeft, ArrowUpRight, Plus, Receipt, CreditCard } from 'lucide-react'
import { useUpdateFundTransaction } from '../hooks'
import type { FundTransaction, FundTransactionType } from '@/lib/api/types'
import { TRANSACTION_TYPES } from '../constants'

const formSchema = z.object({
  amount: z.string().min(1, 'Введите количество'),
  pricePerUnit: z.string().optional(),
  totalValue: z.string().optional(),
  date: z.string().min(1, 'Выберите дату'),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

function getTransactionIcon(type: FundTransactionType) {
  const icons = {
    buy: ShoppingCart,
    sell: DollarSign,
    transfer_in: ArrowDownLeft,
    transfer_out: ArrowUpRight,
    deposit: Plus,
    withdrawal: Receipt,
    contribution: Plus,
    reserve: CreditCard,
  }
  return icons[type] || ShoppingCart
}

function getNullableFloat(value: { Float64: number; Valid: boolean } | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (value.Valid) return value.Float64
  return null
}

interface EditFundTransactionDialogProps {
  transaction: FundTransaction | null
  fundId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditFundTransactionDialog({
  transaction,
  fundId,
  open,
  onOpenChange,
}: EditFundTransactionDialogProps) {
  const updateTransaction = useUpdateFundTransaction()

  const isBuyOrSell = transaction?.transaction_type === 'buy' || transaction?.transaction_type === 'sell'
  const isDeposit = transaction?.transaction_type === 'deposit'
  const isTransfer = transaction?.transaction_type === 'transfer_in' || transaction?.transaction_type === 'transfer_out'

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      pricePerUnit: '',
      totalValue: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    },
  })

  const watchedAmount = form.watch('amount')
  const watchedPricePerUnit = form.watch('pricePerUnit')

  // Auto-calculate totalValue for buy/sell when amount or pricePerUnit changes
  useEffect(() => {
    if (isBuyOrSell && watchedAmount && watchedPricePerUnit) {
      const amount = parseFloat(watchedAmount)
      const price = parseFloat(watchedPricePerUnit)
      if (amount > 0 && price > 0) {
        form.setValue('totalValue', (amount * price).toFixed(2))
      }
    }
  }, [watchedAmount, watchedPricePerUnit, isBuyOrSell, form])

  // Reset form with transaction data when dialog opens
  useEffect(() => {
    if (open && transaction) {
      const pricePerUnit = getNullableFloat(transaction.price_per_unit)
      const totalValue = getNullableFloat(transaction.total_value)

      form.reset({
        amount: String(transaction.amount),
        pricePerUnit: pricePerUnit ? String(pricePerUnit) : '',
        totalValue: totalValue ? String(totalValue) : '',
        date: transaction.date.split('T')[0],
        note: transaction.note || '',
      })
    }
  }, [open, transaction, form])

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  async function onSubmit(values: FormValues) {
    if (!transaction) return

    const amount = parseFloat(values.amount)
    if (isNaN(amount) || amount <= 0) {
      form.setError('amount', { message: 'Введите корректное количество' })
      return
    }

    const pricePerUnit = values.pricePerUnit ? parseFloat(values.pricePerUnit) : undefined
    const totalValue = values.totalValue ? parseFloat(values.totalValue) : undefined

    try {
      await updateTransaction.mutateAsync({
        fundId,
        transactionId: transaction.id,
        data: {
          amount,
          ...(pricePerUnit !== undefined ? { pricePerUnit } : {}),
          ...(totalValue !== undefined ? { totalValue } : {}),
          date: values.date,
          note: values.note || undefined,
        },
      })
      handleClose()
    } catch {
      // Error is handled in mutation
    }
  }

  if (!transaction) return null

  const Icon = getTransactionIcon(transaction.transaction_type)
  const transactionConfig = TRANSACTION_TYPES[transaction.transaction_type]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Редактировать транзакцию
          </DialogTitle>
          <DialogDescription>
            {transactionConfig?.label || transaction.transaction_type}
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Info (read-only) */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {transaction.asset_name}
              {transaction.asset_ticker && ` (${transaction.asset_ticker})`}
            </p>
            {transaction.counterpart_fund_name && (
              <p className="text-sm text-muted-foreground">
                {transaction.transaction_type === 'transfer_out' ? '→' : '←'} {transaction.counterpart_fund_name}
              </p>
            )}
            {transaction.source_account_name && (
              <p className="text-sm text-muted-foreground">
                Со счёта: {transaction.source_account_name}
              </p>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Количество</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {isDeposit && 'Сумма пополнения'}
                    {isBuyOrSell && 'Количество единиц актива'}
                    {isTransfer && 'Количество актива для перевода'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Per Unit (for buy/sell) */}
            {isBuyOrSell && (
              <FormField
                control={form.control}
                name="pricePerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цена за единицу</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Total Value (for buy/sell) */}
            {isBuyOrSell && (
              <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Общая стоимость</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Рассчитывается автоматически"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Сумма списания/зачисления валютного актива
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

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Примечание (опционально)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Комментарий к транзакции"
                      className="min-h-[80px] resize-none"
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
                disabled={updateTransaction.isPending}
              >
                {updateTransaction.isPending ? (
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
