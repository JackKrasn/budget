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
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useUpdateScheduleItem } from '../hooks/use-credits'
import type { UUID, ScheduleItem } from '@/lib/api/credits'
import { useEffect } from 'react'

const formSchema = z.object({
  totalPayment: z.string().min(1, 'Введите сумму платежа'),
})

type FormValues = z.infer<typeof formSchema>

interface EditScheduleItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditId: UUID
  scheduleItem: ScheduleItem | null
}

export function EditScheduleItemDialog({
  open,
  onOpenChange,
  creditId,
  scheduleItem,
}: EditScheduleItemDialogProps) {
  const updateScheduleItem = useUpdateScheduleItem()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      totalPayment: '',
    },
  })

  useEffect(() => {
    if (scheduleItem) {
      form.reset({
        totalPayment: scheduleItem.totalPayment.toString(),
      })
    }
  }, [scheduleItem, form])

  const originalPayment = scheduleItem?.isManual && scheduleItem?.originalTotalPayment
    ? scheduleItem.originalTotalPayment
    : scheduleItem?.totalPayment ?? 0

  async function onSubmit(values: FormValues) {
    if (!scheduleItem) return

    try {
      await updateScheduleItem.mutateAsync({
        creditId,
        scheduleId: scheduleItem.id,
        data: {
          totalPayment: parseFloat(values.totalPayment),
        },
      })

      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  const formatDueDate = () => {
    if (!scheduleItem?.dueDate) return ''
    try {
      const dueDate = new Date(scheduleItem.dueDate + 'T00:00:00')
      if (isNaN(dueDate.getTime())) return scheduleItem.dueDate
      return format(dueDate, 'd MMMM yyyy', { locale: ru })
    } catch {
      return scheduleItem.dueDate
    }
  }

  if (!scheduleItem) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Изменить платёж #{scheduleItem.paymentNumber}</DialogTitle>
          <DialogDescription>
            {formatDueDate()}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/50 p-4 space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Расчётный платёж:</span>
            <span className="font-medium tabular-nums">
              {originalPayment.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Проценты:</span>
            <span className="font-medium tabular-nums">
              {scheduleItem.interestPart.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Тело долга:</span>
            <span className="font-medium tabular-nums">
              {scheduleItem.principalPart.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="totalPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Новая сумма платежа</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={originalPayment.toString()}
                      className="h-11 text-base tabular-nums"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    После изменения все последующие платежи будут пересчитаны
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={updateScheduleItem.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateScheduleItem.isPending}
              >
                {updateScheduleItem.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
