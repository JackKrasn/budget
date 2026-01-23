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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Loader2, TrendingUp } from 'lucide-react'
import { useUpdateFundDeposit } from '../hooks'
import type { FundDeposit, UpdateFundDepositResponse } from '@/lib/api/types'

const formSchema = z.object({
  amount: z.string().min(1, 'Введите сумму'),
  date: z.string().min(1, 'Выберите дату'),
})

type FormValues = z.infer<typeof formSchema>

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    GEL: '₾',
    TRY: '₺',
  }
  return symbols[currency] || currency
}

interface EditFundDepositDialogProps {
  deposit: FundDeposit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (result: UpdateFundDepositResponse) => void
}

export function EditFundDepositDialog({
  deposit,
  open,
  onOpenChange,
  onSuccess,
}: EditFundDepositDialogProps) {
  const updateDeposit = useUpdateFundDeposit()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      date: new Date().toISOString().split('T')[0],
    },
  })

  // Reset form with deposit data when dialog opens
  useEffect(() => {
    if (open && deposit) {
      form.reset({
        amount: String(deposit.amount),
        date: deposit.date.split('T')[0],
      })
    }
  }, [open, deposit, form])

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = async (values: FormValues) => {
    if (!deposit) return

    try {
      const result = await updateDeposit.mutateAsync({
        id: deposit.id,
        data: {
          amount: parseFloat(values.amount),
          date: values.date,
        },
      })

      handleClose()

      // Call onSuccess callback with result for showing balance changes
      if (onSuccess && (result.accountBalance || result.fundBalance)) {
        onSuccess(result)
      }
    } catch {
      // Error handled in mutation
    }
  }

  if (!deposit) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: deposit.fund_color
                  ? `${deposit.fund_color}15`
                  : 'rgba(139, 92, 246, 0.1)',
                color: deposit.fund_color || '#8b5cf6',
              }}
            >
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Редактировать перевод
              </DialogTitle>
              <DialogDescription>
                {deposit.fund_name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Current values */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Текущее значение</p>
              <p className="font-semibold tabular-nums">
                {formatMoney(deposit.amount)} {getCurrencySymbol(deposit.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Счёт: {deposit.account_name}
              </p>
            </div>

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма ({deposit.currency})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
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

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateDeposit.isPending}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={updateDeposit.isPending}>
                {updateDeposit.isPending ? (
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
