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
import { Textarea } from '@/components/ui/textarea'
import type { BudgetItemWithCategory } from '@/lib/api/types'

const formSchema = z.object({
  plannedAmount: z.string().min(1, 'Введите сумму'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface BudgetItemDialogProps {
  item: BudgetItemWithCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (categoryId: string, plannedAmount: number, notes?: string) => Promise<void>
  isPending?: boolean
}

export function BudgetItemDialog({
  item,
  open,
  onOpenChange,
  onSave,
  isPending,
}: BudgetItemDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plannedAmount: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (item) {
      form.reset({
        plannedAmount: String(item.plannedAmount),
        notes: item.notes || '',
      })
    }
  }, [item, form])

  async function onSubmit(values: FormValues) {
    if (!item) return
    await onSave(
      item.categoryId,
      parseFloat(values.plannedAmount) || 0,
      values.notes || undefined
    )
    onOpenChange(false)
  }

  if (!item) return null

  const variance = item.plannedAmount - item.actualAmount
  const isOverBudget = variance < 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
              style={{ backgroundColor: item.categoryColor + '20' }}
            >
              {item.categoryIcon}
            </span>
            {item.categoryName}
          </DialogTitle>
          <DialogDescription>
            Редактирование плана по категории
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Факт</p>
            <p className="text-lg font-semibold tabular-nums">
              {item.actualAmount.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Разница</p>
            <p
              className={`text-lg font-semibold tabular-nums ${
                isOverBudget ? 'text-destructive' : 'text-emerald-500'
              }`}
            >
              {isOverBudget ? '' : '+'}
              {variance.toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="plannedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Планируемая сумма (₽)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                    />
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
                  <FormLabel>Заметки</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Опционально"
                      className="resize-none"
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
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
