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
  allocations: z.array(allocationSchema),
  date: z.string().min(1, 'Дата обязательна'),
})

type FormValues = z.infer<typeof formSchema>

interface ConfirmDistributionDialogProps {
  distribution: IncomeDistribution | null
  incomeDate?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: { actualAmount: number; allocations: Array<{ assetId: string; amount: number }>; actualDate?: string }) => void
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
  incomeDate,
  open,
  onOpenChange,
  onConfirm,
  isConfirming,
}: ConfirmDistributionDialogProps) {
  // Only fetch assets when we have a valid fund_id and dialog is open
  const fundId = open ? (distribution?.fund_id ?? '') : ''
  const { data: fundAssetsData, isLoading: isLoadingAssets } = useFundAssets(fundId)

  const fundAssets = fundAssetsData?.data ?? []
  const assetsReady = !isLoadingAssets && fundId !== ''

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualAmount: 0,
      allocations: [],
      date: '',
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'allocations',
  })

  // Helper to get asset id (defined early for useEffect)
  const getAssetIdFromFa = (fa: FundAssetBalance | undefined): string | undefined => {
    if (!fa) return undefined
    return fa.asset?.id ?? (fa as unknown as { asset_id: string }).asset_id
  }

  // Initialize form when dialog opens and assets are loaded
  useEffect(() => {
    if (!open || !distribution || !assetsReady) return

    const firstAsset = fundAssets[0]
    const firstAssetId = getAssetIdFromFa(firstAsset)

    // Set actual amount
    form.setValue('actualAmount', distribution.planned_amount)

    // Set date (use income date if provided, otherwise today)
    const defaultDate = incomeDate
      ? new Date(incomeDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
    form.setValue('date', defaultDate)

    // Set initial allocation if we have assets
    if (firstAssetId) {
      replace([{ assetId: firstAssetId, amount: distribution.planned_amount }])
    } else {
      replace([])
    }
  }, [open, distribution?.id, assetsReady, fundAssets, form, replace, distribution?.planned_amount, incomeDate])

  // Watch actual amount and allocations to check balance
  const actualAmount = form.watch('actualAmount')
  const allocations = form.watch('allocations')
  const allocatedTotal = allocations.reduce((sum, a) => sum + (a.amount || 0), 0)
  const remaining = actualAmount - allocatedTotal

  const handleSubmit = (values: FormValues) => {
    // Convert date to ISO format if it differs from income date
    const selectedDate = values.date
    const defaultDate = incomeDate
      ? new Date(incomeDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    onConfirm({
      actualAmount: values.actualAmount,
      allocations: values.allocations,
      // Only send actualDate if it's different from the income date
      actualDate: selectedDate !== defaultDate ? new Date(selectedDate).toISOString() : undefined,
    })
  }

  // Helper to get asset id from fund asset (handles both flat and nested structure)
  const getAssetId = (fa: FundAssetBalance): string | undefined => {
    // Try nested structure first (FundAssetBalance type), then flat structure (actual API response)
    return fa.asset?.id ?? (fa as unknown as { asset_id: string }).asset_id
  }

  const getAssetName = (fa: FundAssetBalance): string => {
    return fa.asset?.name ?? (fa as unknown as { asset_name: string }).asset_name ?? 'Неизвестный актив'
  }

  const getAssetCurrency = (fa: FundAssetBalance): string => {
    return fa.asset?.currency ?? (fa as unknown as { currency: string }).currency ?? ''
  }

  const handleAddAllocation = () => {
    if (fundAssets.length === 0) return

    const usedAssetIds = new Set(allocations.map((a) => a.assetId))
    const availableAsset = fundAssets.find((fa) => {
      const assetId = getAssetId(fa)
      return assetId && !usedAssetIds.has(assetId)
    })

    const assetToAdd = availableAsset ?? fundAssets.find((fa) => getAssetId(fa))
    const assetId = assetToAdd ? getAssetId(assetToAdd) : undefined

    if (assetId) {
      append({ assetId, amount: remaining > 0 ? remaining : actualAmount })
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
            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата операции</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                <span className="text-sm font-medium">Распределение по активам</span>
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
                  <span className="ml-2 text-sm text-muted-foreground">Загрузка активов...</span>
                </div>
              ) : fundAssets.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 p-4 text-center text-sm text-muted-foreground">
                  В этом фонде нет активов. Добавьте активы в настройках фонда.
                </div>
              ) : fields.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 p-4 text-center text-sm text-muted-foreground">
                  <p className="mb-2">Выберите актив для распределения ({fundAssets.length} доступно)</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const firstAsset = fundAssets[0]
                      const assetId = getAssetIdFromFa(firstAsset)
                      if (assetId) {
                        append({ assetId, amount: actualAmount })
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить актив
                  </Button>
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
                                  {fundAssets.map((fa: FundAssetBalance) => {
                                    const assetId = getAssetId(fa)
                                    if (!assetId) return null
                                    return (
                                      <SelectItem key={assetId} value={assetId}>
                                        {getAssetName(fa)} ({getAssetCurrency(fa)})
                                      </SelectItem>
                                    )
                                  })}
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
                disabled={
                  isConfirming ||
                  !assetsReady ||
                  (fundAssets.length > 0 && (remaining !== 0 || fields.length === 0))
                }
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
