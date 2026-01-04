import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { DayPicker } from '@/components/common'
import type { RecurringIncome } from '@/lib/api/types'

const formSchema = z.object({
  source: z.string().min(1, 'Введите источник дохода'),
  expectedAmount: z.string().min(1, 'Введите сумму'),
  dayOfMonth: z.string().min(1, 'Выберите день'),
  isActive: z.boolean(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface RecurringIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  income?: RecurringIncome | null
  onSubmit: (data: {
    source: string
    expectedAmount: number
    currency: string
    dayOfMonth: number
    isActive: boolean
    notes?: string
  }) => Promise<void>
  isPending?: boolean
}

export function RecurringIncomeDialog({
  open,
  onOpenChange,
  income,
  onSubmit,
  isPending,
}: RecurringIncomeDialogProps) {
  const isEditing = !!income

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      source: '',
      expectedAmount: '',
      dayOfMonth: '10',
      isActive: true,
      notes: '',
    },
  })

  // При открытии с данными для редактирования
  useEffect(() => {
    if (income) {
      form.reset({
        source: income.source,
        expectedAmount: String(income.expected_amount),
        dayOfMonth: String(income.day_of_month),
        isActive: income.is_active,
        notes: income.notes ?? '',
      })
    } else {
      form.reset({
        source: '',
        expectedAmount: '',
        dayOfMonth: '10',
        isActive: true,
        notes: '',
      })
    }
  }, [income, form])

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      source: data.source,
      expectedAmount: parseFloat(data.expectedAmount),
      currency: 'RUB',
      dayOfMonth: parseInt(data.dayOfMonth, 10),
      isActive: data.isActive,
      notes: data.notes || undefined,
    })
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Редактировать шаблон дохода' : 'Создать шаблон дохода'}
          </DialogTitle>
          <DialogDescription>
            Шаблон будет использоваться для автоматической генерации
            ожидаемых доходов каждый месяц
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Источник дохода</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Зарплата, Аванс, Бонус" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expectedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ожидаемая сумма</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>День месяца</FormLabel>
                    <FormControl>
                      <DayPicker
                        value={parseInt(field.value, 10) || 10}
                        onChange={(day) => field.onChange(String(day))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметки (опционально)</FormLabel>
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

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Активен</FormLabel>
                    <FormDescription>
                      Неактивные шаблоны не генерируются
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {isEditing ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
