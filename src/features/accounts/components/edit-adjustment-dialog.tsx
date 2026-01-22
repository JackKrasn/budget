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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Loader2, RefreshCw } from 'lucide-react'
import { useUpdateBalanceAdjustment } from '../hooks'
import type { BalanceAdjustmentWithAccount } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

const formSchema = z.object({
  amount: z.string().min(1, 'Введите сумму').refine(
    (val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num !== 0
    },
    { message: 'Сумма не может быть 0' }
  ),
  reason: z.string().min(1, 'Введите причину'),
  date: z.string().min(1, 'Выберите дату'),
})

type FormValues = z.infer<typeof formSchema>

interface EditAdjustmentDialogProps {
  adjustment: BalanceAdjustmentWithAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAdjustmentDialog({
  adjustment,
  open,
  onOpenChange,
}: EditAdjustmentDialogProps) {
  const updateAdjustment = useUpdateBalanceAdjustment()

  const currencySymbol = adjustment
    ? CURRENCY_SYMBOLS[adjustment.account_currency] || adjustment.account_currency
    : '₽'

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      reason: '',
      date: new Date().toISOString().split('T')[0],
    },
  })

  // Reset form with adjustment data when dialog opens
  useEffect(() => {
    if (open && adjustment) {
      form.reset({
        amount: String(adjustment.amount),
        reason: adjustment.reason,
        date: adjustment.date.split('T')[0],
      })
    }
  }, [open, adjustment, form])

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  async function onSubmit(values: FormValues) {
    if (!adjustment) return

    const amount = parseFloat(values.amount)
    if (isNaN(amount) || amount === 0) {
      form.setError('amount', { message: 'Введите корректную сумму (не 0)' })
      return
    }

    try {
      await updateAdjustment.mutateAsync({
        id: adjustment.id,
        data: {
          amount,
          reason: values.reason,
          date: values.date,
        },
      })
      handleClose()
    } catch {
      // Error is handled in mutation
    }
  }

  if (!adjustment) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Редактировать корректировку
          </DialogTitle>
          <DialogDescription>
            Изменение суммы и метаданных корректировки
          </DialogDescription>
        </DialogHeader>

        {/* Account Info (read-only) */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Счёт</p>
            <p className="font-medium">{adjustment.account_name}</p>
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
                  <FormLabel>Сумма корректировки</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        className="pr-10"
                        {...field}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currencySymbol}
                      </span>
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Положительное значение увеличит баланс, отрицательное - уменьшит
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Причина</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Найдена ошибка в учёте"
                      {...field}
                    />
                  </FormControl>
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
                disabled={updateAdjustment.isPending}
              >
                {updateAdjustment.isPending ? (
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
