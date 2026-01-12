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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CalendarIcon, TrendingDown, Clock } from 'lucide-react'
import { useCreateEarlyPayment } from '../hooks/use-credits'
import type { UUID, EarlyPaymentReductionType } from '@/lib/api/credits'

function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const formSchema = z.object({
  amount: z.string().min(1, 'Введите сумму платежа'),
  paymentDate: z.string().min(1, 'Выберите дату платежа'),
  reductionType: z.enum(['reduce_payment', 'reduce_term']),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EarlyPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditId: UUID
  creditName: string
  currentBalance: number
}

export function EarlyPaymentDialog({
  open,
  onOpenChange,
  creditId,
  creditName,
  currentBalance,
}: EarlyPaymentDialogProps) {
  const createEarlyPayment = useCreateEarlyPayment()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      paymentDate: formatDateToString(new Date()),
      reductionType: 'reduce_term',
      notes: '',
    },
  })

  const amount = form.watch('amount')
  const parsedAmount = parseFloat(amount) || 0
  const balanceAfter = Math.max(0, currentBalance - parsedAmount)

  async function onSubmit(values: FormValues) {
    try {
      await createEarlyPayment.mutateAsync({
        creditId,
        data: {
          amount: parseFloat(values.amount),
          paymentDate: values.paymentDate,
          reductionType: values.reductionType as EarlyPaymentReductionType,
          notes: values.notes || undefined,
        },
      })

      form.reset()
      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Частично-досрочное погашение</DialogTitle>
          <DialogDescription>
            {creditName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма платежа</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={currentBalance}
                      placeholder="500000"
                      className="h-11 text-base tabular-nums"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Текущий остаток:</span>
                <span className="font-medium tabular-nums">
                  {currentBalance.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">После ЧДП:</span>
                <span className="font-medium tabular-nums text-green-600">
                  {balanceAfter.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Дата платежа</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full h-11 pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(parseDateString(field.value), 'PPP', { locale: ru })
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
              name="reductionType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Что уменьшить?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <FormControl>
                          <RadioGroupItem value="reduce_term" />
                        </FormControl>
                        <div className="space-y-1 leading-none flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <FormLabel className="font-medium cursor-pointer">
                              Сократить срок
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Платёж остаётся прежним, срок кредита уменьшается
                          </FormDescription>
                        </div>
                      </FormItem>
                      <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <FormControl>
                          <RadioGroupItem value="reduce_payment" />
                        </FormControl>
                        <div className="space-y-1 leading-none flex-1">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-green-500" />
                            <FormLabel className="font-medium cursor-pointer">
                              Уменьшить платёж
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Срок остаётся прежним, ежемесячный платёж уменьшается
                          </FormDescription>
                        </div>
                      </FormItem>
                    </RadioGroup>
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
                  <FormLabel>Комментарий (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Например: Бонус за год"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={createEarlyPayment.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createEarlyPayment.isPending || parsedAmount <= 0 || parsedAmount > currentBalance}
              >
                {createEarlyPayment.isPending ? 'Внесение...' : 'Внести ЧДП'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
