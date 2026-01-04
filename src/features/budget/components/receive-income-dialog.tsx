import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon, Banknote, TrendingUp, TrendingDown } from 'lucide-react'
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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { PlannedIncome } from '@/lib/api/types'

const formSchema = z.object({
  actualAmount: z.string().min(1, 'Введите сумму'),
  actualDate: z.date(),
})

type FormData = z.infer<typeof formSchema>

interface ReceiveIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  income: PlannedIncome | null
  onSubmit: (data: { actualAmount: number; actualDate: string }) => Promise<void>
  isPending?: boolean
}

export function ReceiveIncomeDialog({
  open,
  onOpenChange,
  income,
  onSubmit,
  isPending,
}: ReceiveIncomeDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualAmount: '',
      actualDate: new Date(),
    },
  })

  // При открытии заполняем ожидаемой суммой
  useEffect(() => {
    if (income) {
      form.reset({
        actualAmount: String(income.expected_amount),
        actualDate: new Date(),
      })
    }
  }, [income, form])

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      actualAmount: parseFloat(data.actualAmount),
      actualDate: format(data.actualDate, 'yyyy-MM-dd'),
    })
    form.reset()
    onOpenChange(false)
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const actualAmount = parseFloat(form.watch('actualAmount')) || 0
  const expectedAmount = income?.expected_amount ?? 0
  const diff = actualAmount - expectedAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-500" />
            Получить доход
          </DialogTitle>
          <DialogDescription>
            Укажите фактическую сумму полученного дохода
          </DialogDescription>
        </DialogHeader>

        {income && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 mb-4">
            <p className="font-medium">{income.source}</p>
            <p className="text-sm text-muted-foreground">
              Ожидалось: {formatMoney(expectedAmount)} ₽
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="actualAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Фактическая сумма</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        className="pr-8"
                        {...field}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₽
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                  {diff !== 0 && actualAmount > 0 && (
                    <p
                      className={cn(
                        'text-sm flex items-center gap-1',
                        diff > 0 ? 'text-emerald-500' : 'text-red-500'
                      )}
                    >
                      {diff > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {diff > 0 ? '+' : ''}
                      {formatMoney(diff)} ₽ от ожидаемой суммы
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actualDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Дата получения</FormLabel>
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
                            format(field.value, 'PPP', { locale: ru })
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
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                Подтвердить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
