import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Loader2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FundIcon } from '@/components/common/category-icon'
import { useFundAssets } from '@/features/funds'
import type { IncomeDistribution, FundAssetBalance } from '@/lib/api/types'

const allocationSchema = z.object({
  assetId: z.string().min(1, 'Выберите актив'),
  amount: z.number().min(0.01, 'Сумма должна быть больше 0'),
})

const formSchema = z.object({
  actualAmount: z.number().min(0.01, 'Сумма должна быть больше 0'),
  allocations: z.array(allocationSchema).min(1, 'Добавьте хотя бы один актив'),
})

type FormValues = z.infer<typeof formSchema>

interface ConfirmDistributionDialogProps {
  distribution: IncomeDistribution | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: { actualAmount: number; allocations: Array<{ assetId: string; amount: number }> }) => void
  isConfirming?: boolean
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ConfirmDistributionDialog({
  distribution,
  open,
  onOpenChange,
  onConfirm,
  isConfirming,
}: ConfirmDistributionDialogProps) {
  const { data: fundAssetsData, isLoading: isLoadingAssets } = useFundAssets(
    distribution?.fund_id ?? ''
  )

  const fundAssets = fundAssetsData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualAmount: distribution?.planned_amount ?? 0,
      allocations: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'allocations',
  })

  // Reset form when distribution changes
  useEffect(() => {
    if (distribution) {
      form.reset({
        actualAmount: distribution.planned_amount,
        allocations: fundAssets.length > 0
          ? [{ assetId: fundAssets[0].asset.id, amount: distribution.planned_amount }]
          : [],
      })
    }
  }, [distribution, fundAssets, form])

  // Watch actual amount and allocations to check balance
  const actualAmount = form.watch('actualAmount')
  const allocations = form.watch('allocations')
  const allocatedTotal = allocations.reduce((sum, a) => sum + (a.amount || 0), 0)
  const remaining = actualAmount - allocatedTotal

  const handleSubmit = (values: FormValues) => {
    onConfirm({
      actualAmount: values.actualAmount,
      allocations: values.allocations,
    })
  }

  const handleAddAllocation = () => {
    const usedAssetIds = new Set(allocations.map((a) => a.assetId))
    const availableAsset = fundAssets.find((fa) => !usedAssetIds.has(fa.asset.id))

    if (availableAsset) {
      append({ assetId: availableAsset.asset.id, amount: remaining > 0 ? remaining : 0 })
    }
  }

  if (!distribution) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FundIcon
              name={distribution.fund_name}
              color={distribution.fund_color}
              size="md"
            />
            Подтвердить распределение
          </DialogTitle>
          <DialogDescription>
            Фонд: <strong>{distribution.fund_name}</strong>
            <br />
            Запланировано: <strong>{formatMoney(distribution.planned_amount)} ₽</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Actual Amount */}
            <FormField
              control={form.control}
              name="actualAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Фактическая сумма</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Введите сумму"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Allocations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Распределение по активам</FormLabel>
                {fundAssets.length > fields.length && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddAllocation}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить актив
                  </Button>
                )}
              </div>

              {isLoadingAssets ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : fundAssets.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 p-4 text-center text-sm text-muted-foreground">
                  В этом фонде нет активов. Добавьте активы в настройках фонда.
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      {/* Asset Select */}
                      <FormField
                        control={form.control}
                        name={`allocations.${index}.assetId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите актив" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fundAssets.map((fa: FundAssetBalance) => (
                                    <SelectItem key={fa.asset.id} value={fa.asset.id}>
                                      {fa.asset.name} ({fa.asset.currency})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Amount Input */}
                      <FormField
                        control={form.control}
                        name={`allocations.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Сумма"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Remove Button */}
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Balance Check */}
              {fields.length > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="text-muted-foreground">Нераспределено:</span>
                  <span
                    className={
                      remaining === 0
                        ? 'text-emerald-500 font-medium'
                        : remaining > 0
                        ? 'text-amber-500 font-medium'
                        : 'text-destructive font-medium'
                    }
                  >
                    {formatMoney(remaining)} ₽
                  </span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isConfirming}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isConfirming || remaining !== 0 || fields.length === 0}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Подтверждение...
                  </>
                ) : (
                  'Подтвердить'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
