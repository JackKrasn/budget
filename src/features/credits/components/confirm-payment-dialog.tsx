import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
  FormDescription,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CalendarIcon, CheckCircle2 } from 'lucide-react'
import { useAccounts } from '@/features/accounts'
import { confirmPlannedExpenseWithExpense } from '@/lib/api/planned-expenses/client'
import type { ScheduleItem } from '@/lib/api/credits'

// Форматирует дату в YYYY-MM-DD без смещения часового пояса
function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Парсит строку YYYY-MM-DD в Date без смещения часового пояса
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formSchema = z.object({
  accountId: z.string().optional(),
  date: z.string().min(1, 'Выберите дату'),
  currency: z.string().min(1, 'Выберите валюту'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ConfirmPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleItem: ScheduleItem | null
  plannedExpenseId?: string
  creditId: string
  defaultAccountId?: string
}

export function ConfirmPaymentDialog({
  open,
  onOpenChange,
  scheduleItem,
  plannedExpenseId,
  creditId,
  defaultAccountId,
}: ConfirmPaymentDialogProps) {
  const queryClient = useQueryClient()
  const { data: accountsData } = useAccounts()
  const accounts = accountsData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: defaultAccountId || '',
      date: new Date().toISOString().split('T')[0],
      currency: 'RUB',
      description: '',
    },
  })

  const confirmPayment = useMutation({
    mutationFn: (values: FormValues) => {
      if (!plannedExpenseId) {
        throw new Error('Planned expense ID is required')
      }
      return confirmPlannedExpenseWithExpense(plannedExpenseId, {
        accountId: values.accountId || undefined,
        date: values.date,
        currency: values.currency,
        description: values.description || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', creditId] })
      queryClient.invalidateQueries({ queryKey: ['credits', creditId, 'schedule'] })
      queryClient.invalidateQueries({ queryKey: ['credits', creditId, 'payments'] })
      queryClient.invalidateQueries({ queryKey: ['credits', creditId, 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      toast.success('Платёж успешно подтверждён')
      form.reset()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при подтверждении платежа: ${error.message}`)
    },
  })

  async function onSubmit(values: FormValues) {
    await confirmPayment.mutateAsync(values)
  }

  if (!scheduleItem) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            Подтвердить платёж #{scheduleItem.paymentNumber}
          </DialogTitle>
          <DialogDescription className="text-base">
            Создание расхода и подтверждение платежа по кредиту
          </DialogDescription>
        </DialogHeader>

        {/* Payment Info */}
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Сумма платежа</span>
            <span className="text-2xl font-bold tabular-nums text-primary">
              {formatMoney(scheduleItem.totalPayment)} ₽
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-primary/10">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Основной долг</span>
              <span className="text-base font-semibold tabular-nums">
                {formatMoney(scheduleItem.principalPart)} ₽
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Проценты</span>
              <span className="text-base font-semibold tabular-nums">
                {formatMoney(scheduleItem.interestPart)} ₽
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-primary/10">
            <span className="text-xs font-medium text-muted-foreground">Дата по плану</span>
            <span className="text-sm font-medium">
              {new Date(scheduleItem.dueDate).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Account */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Счёт списания (необязательно)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="По умолчанию из кредита" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">По умолчанию из кредита</SelectItem>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Если не указано, будет использован счёт из настроек кредита
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Дата платежа</FormLabel>
                    <Popover>
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
                              format(parseDateString(field.value), 'PP', { locale: ru })
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
                          selected={field.value ? parseDateString(field.value) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(formatDateToString(date))
                            }
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date(2020, 0, 1)
                          }
                          locale={ru}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Валюта</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RUB">₽ RUB</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="EUR">€ EUR</SelectItem>
                        <SelectItem value="GEL">₾ GEL</SelectItem>
                        <SelectItem value="TRY">₺ TRY</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Примечание (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Дополнительная информация..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-8 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => onOpenChange(false)}
                disabled={confirmPayment.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 font-semibold"
                disabled={confirmPayment.isPending}
              >
                {confirmPayment.isPending ? 'Подтверждение...' : 'Подтвердить платёж'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
