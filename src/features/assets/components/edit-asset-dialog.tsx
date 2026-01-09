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
import { useUpdateAsset, useAssetTypes } from '../hooks'
import type { AssetWithType } from '@/lib/api'

const CURRENCIES = [
  { value: 'RUB', label: 'Рубль (₽)' },
  { value: 'USD', label: 'Доллар ($)' },
  { value: 'EUR', label: 'Евро (€)' },
  { value: 'GEL', label: 'Лари (₾)' },
  { value: 'TRY', label: 'Лира (₺)' },
]

const formSchema = z.object({
  name: z.string().min(1, 'Введите название актива'),
  assetTypeId: z.string().min(1, 'Выберите тип актива'),
  ticker: z.string().optional(),
  currency: z.string().min(1, 'Выберите валюту'),
  currentPrice: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditAssetDialogProps {
  asset: AssetWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Helper to extract price from Go nullable float format
function extractPrice(price?: number | { Float64: number; Valid: boolean }): number | null {
  if (price == null) return null
  if (typeof price === 'number') return price
  if (typeof price === 'object' && 'Float64' in price && 'Valid' in price) {
    return price.Valid ? price.Float64 : null
  }
  return null
}

export function EditAssetDialog({
  asset,
  open,
  onOpenChange,
}: EditAssetDialogProps) {
  const updateAsset = useUpdateAsset()
  const { data: assetTypesData, isLoading: isLoadingTypes } = useAssetTypes()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      assetTypeId: '',
      ticker: '',
      currency: 'RUB',
      currentPrice: '',
    },
  })

  useEffect(() => {
    if (asset) {
      const priceValue = extractPrice(asset.current_price)
      form.reset({
        name: asset.name,
        assetTypeId: asset.asset_type_id,
        ticker: asset.ticker || '',
        currency: asset.currency,
        currentPrice: priceValue?.toString() || '',
      })
    }
  }, [asset, form])

  async function onSubmit(values: FormValues) {
    if (!asset) return

    try {
      await updateAsset.mutateAsync({
        id: asset.id,
        data: {
          name: values.name,
          assetTypeId: values.assetTypeId,
          ticker: values.ticker || undefined,
          currency: values.currency,
          currentPrice: values.currentPrice
            ? parseFloat(values.currentPrice)
            : undefined,
        },
      })
      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать актив</DialogTitle>
          <DialogDescription>Измените данные актива</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Доллар США" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Asset Type */}
            <FormField
              control={form.control}
              name="assetTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип актива</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingTypes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetTypesData?.data.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ticker */}
            <FormField
              control={form.control}
              name="ticker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тикер (опционально)</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: USD, SBER, BTC" {...field} />
                  </FormControl>
                  <FormDescription>
                    Биржевой тикер или код валюты
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Валюта котировки</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите валюту" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    В какой валюте указана цена актива
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Price */}
            <FormField
              control={form.control}
              name="currentPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Текущая цена (опционально)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Цена за единицу актива</FormDescription>
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
                className="flex-1"
                disabled={updateAsset.isPending}
              >
                {updateAsset.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
