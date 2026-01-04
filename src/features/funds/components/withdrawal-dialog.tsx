import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { useCreateWithdrawal } from '../hooks'
import type { FundBalance } from '@/lib/api/types'

const CURRENCIES = [
  { value: 'RUB', label: '₽', name: 'Рубль' },
  { value: 'USD', label: '$', name: 'Доллар' },
  { value: 'EUR', label: '€', name: 'Евро' },
]

const allocationSchema = z.object({
  assetId: z.string().min(1, 'Выберите актив'),
  amount: z.string().min(1, 'Введите сумму'),
})

const formSchema = z.object({
  date: z.string().min(1, 'Выберите дату'),
  totalAmount: z.string().min(1, 'Введите сумму'),
  currency: z.string().min(1, 'Выберите валюту'),
  purpose: z.string().min(1, 'Укажите цель списания'),
  allocations: z.array(allocationSchema).min(1, 'Добавьте хотя бы один актив'),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface WithdrawalDialogProps {
  fund: FundBalance | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WithdrawalDialog({
  fund,
  open,
  onOpenChange,
}: WithdrawalDialogProps) {
  const createWithdrawal = useCreateWithdrawal()
  const [totalAllocated, setTotalAllocated] = useState(0)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      totalAmount: '',
      currency: 'RUB',
      purpose: '',
      allocations: [{ assetId: '', amount: '' }],
      note: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'allocations',
  })

  const watchAllocations = form.watch('allocations')
  const watchTotalAmount = form.watch('totalAmount')

  useEffect(() => {
    const total = watchAllocations.reduce((sum, a) => {
      const amount = parseFloat(a.amount) || 0
      return sum + amount
    }, 0)
    setTotalAllocated(total)
  }, [watchAllocations])

  async function onSubmit(values: FormValues) {
    if (!fund) return

    try {
      await createWithdrawal.mutateAsync({
        fundId: fund.fund.id,
        data: {
          date: values.date,
          totalAmount: parseFloat(values.totalAmount),
          currency: values.currency,
          purpose: values.purpose,
          allocations: values.allocations.map((a) => ({
            assetId: a.assetId,
            amount: parseFloat(a.amount),
          })),
          note: values.note || undefined,
        },
      })

      form.reset()
      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  const availableAssets = fund?.assets ?? []
  const totalAmount = parseFloat(watchTotalAmount) || 0
  const remaining = totalAmount - totalAllocated

  if (!fund) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Списание из фонда</DialogTitle>
          <DialogDescription>
            Снять средства из фонда «{fund.fund.name}»
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Цель списания</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Покупка телевизора"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Общая сумма</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        {...field}
                      />
                    </FormControl>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Current Balance Info */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Доступно в фонде:</span>
                <span className="font-medium">{formatMoney(fund.totalRub)} ₽</span>
              </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
              <span className="text-sm text-muted-foreground">
                Распределено:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium tabular-nums">
                  {formatMoney(totalAllocated)} / {formatMoney(totalAmount)}
                </span>
                {remaining !== 0 && (
                  <Badge variant={remaining > 0 ? 'secondary' : 'destructive'}>
                    {remaining > 0 ? `+${formatMoney(remaining)}` : formatMoney(remaining)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Allocations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>С каких активов списать</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ assetId: '', amount: '' })}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Добавить
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-3 rounded-lg border border-border/50 bg-card/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Актив #{index + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`allocations.${index}.assetId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Актив</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите актив" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableAssets.map((a) => (
                              <SelectItem key={a.asset.id} value={a.asset.id}>
                                {a.asset.name} — {formatMoney(a.amount)} {a.asset.currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`allocations.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Количество</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Сколько списать с этого актива
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметка (опционально)</FormLabel>
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="flex-1"
                disabled={createWithdrawal.isPending || remaining !== 0}
              >
                {createWithdrawal.isPending
                  ? 'Сохранение...'
                  : 'Списать из фонда'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
