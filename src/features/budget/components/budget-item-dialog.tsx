import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PiggyBank } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FundIcon, CategoryIcon } from '@/components/common'
import { useFunds } from '@/features/funds'
import type { BudgetItemWithCategory } from '@/lib/api/types'

const formSchema = z.object({
  plannedAmount: z.string().min(1, 'Введите сумму'),
  notes: z.string().optional(),
  fundId: z.string().optional(),
  fundAllocation: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface BudgetItemDialogProps {
  item: BudgetItemWithCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (categoryId: string, plannedAmount: number, notes?: string, fundId?: string, fundAllocation?: number) => Promise<void>
  isPending?: boolean
}

export function BudgetItemDialog({
  item,
  open,
  onOpenChange,
  onSave,
  isPending,
}: BudgetItemDialogProps) {
  const [useFundFinancing, setUseFundFinancing] = useState(false)
  const { data: fundsData } = useFunds({ status: 'active' })
  const funds = fundsData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plannedAmount: '',
      notes: '',
      fundId: '',
      fundAllocation: '',
    },
  })

  useEffect(() => {
    if (item) {
      const hasFund = !!item.fundId
      setUseFundFinancing(hasFund)
      form.reset({
        plannedAmount: String(item.plannedAmount),
        notes: item.notes || '',
        fundId: item.fundId || '',
        fundAllocation: item.fundAllocation ? String(item.fundAllocation) : '',
      })
    }
  }, [item, form])

  // Watch planned amount to auto-fill fund allocation
  const plannedAmount = form.watch('plannedAmount')
  const fundAllocationValue = form.watch('fundAllocation')
  const selectedFundId = form.watch('fundId')
  const selectedFundBalance = funds.find(f => f.fund.id === selectedFundId)

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleUseFundChange = (checked: boolean) => {
    setUseFundFinancing(checked)
    if (!checked) {
      form.setValue('fundId', '')
      form.setValue('fundAllocation', '')
    } else if (plannedAmount) {
      // Auto-fill fund allocation with planned amount
      form.setValue('fundAllocation', plannedAmount)
    }
  }

  async function onSubmit(values: FormValues) {
    if (!item) return
    await onSave(
      item.categoryId,
      parseFloat(values.plannedAmount) || 0,
      values.notes || undefined,
      useFundFinancing && values.fundId ? values.fundId : undefined,
      useFundFinancing && values.fundAllocation ? parseFloat(values.fundAllocation) : undefined
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
            <CategoryIcon
              code={item.categoryCode}
              iconName={item.categoryIcon}
              color={item.categoryColor}
              size="lg"
            />
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

            {/* Fund Financing Section */}
            {funds.length > 0 && (
              <div className="space-y-3 rounded-lg border border-border/50 p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useFund"
                    checked={useFundFinancing}
                    onCheckedChange={handleUseFundChange}
                  />
                  <Label
                    htmlFor="useFund"
                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    Финансировать из фонда
                  </Label>
                </div>

                {useFundFinancing && (
                  <div className="space-y-3 pt-2">
                    <FormField
                      control={form.control}
                      name="fundId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Фонд</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите фонд">
                                  {field.value && (() => {
                                    const selectedFund = funds.find(f => f.fund.id === field.value)
                                    if (!selectedFund) return null
                                    return (
                                      <span className="flex items-center gap-2">
                                        <FundIcon
                                          name={selectedFund.fund.name}
                                          iconName={selectedFund.fund.icon}
                                          color={selectedFund.fund.color}
                                          size="sm"
                                        />
                                        {selectedFund.fund.name}
                                      </span>
                                    )
                                  })()}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {funds.map((fb) => {
                                const allocationAmt = parseFloat(fundAllocationValue || '0') || 0
                                const remaining = fb.totalBase - allocationAmt
                                return (
                                  <SelectItem
                                    key={fb.fund.id}
                                    value={fb.fund.id}
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <span className="flex items-center gap-2">
                                        <FundIcon
                                          name={fb.fund.name}
                                          iconName={fb.fund.icon}
                                          color={fb.fund.color}
                                          size="sm"
                                        />
                                        {fb.fund.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground ml-8">
                                        Доступно: {formatMoney(fb.totalBase)} ₽
                                        {allocationAmt > 0 && (
                                          <span className={remaining < 0 ? ' text-destructive' : ''}>
                                            {' → после: '}{formatMoney(remaining)} ₽
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fundAllocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Сумма из фонда (₽)</FormLabel>
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

                    {/* Preview: баланс фонда и остаток */}
                    {selectedFundBalance && (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Доступно в фонде:</span>
                          <span className="tabular-nums font-medium">
                            {formatMoney(selectedFundBalance.totalBase)} ₽
                          </span>
                        </div>
                        {parseFloat(fundAllocationValue || '0') > 0 && (
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">Останется после:</span>
                            <span className={`tabular-nums font-medium ${
                              selectedFundBalance.totalBase - parseFloat(fundAllocationValue || '0') < 0
                                ? 'text-destructive'
                                : 'text-emerald-500'
                            }`}>
                              {formatMoney(selectedFundBalance.totalBase - parseFloat(fundAllocationValue || '0'))} ₽
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
