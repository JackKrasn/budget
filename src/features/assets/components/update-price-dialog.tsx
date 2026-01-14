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
import { useUpdateAssetPrice } from '../hooks'
import type { AssetWithType } from '@/lib/api'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

const formSchema = z.object({
  price: z.string().min(1, 'Введите цену'),
  source: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface UpdatePriceDialogProps {
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

export function UpdatePriceDialog({
  asset,
  open,
  onOpenChange,
}: UpdatePriceDialogProps) {
  const updatePrice = useUpdateAssetPrice()
  const currentPrice = extractPrice(asset?.current_price)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: currentPrice?.toString() || '',
      source: 'manual',
    },
  })

  async function onSubmit(values: FormValues) {
    if (!asset) return

    try {
      await updatePrice.mutateAsync({
        id: asset.id,
        data: {
          price: parseFloat(values.price),
          source: values.source || undefined,
        },
      })
      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  if (!asset) return null

  const isCurrencyType = asset.type_code === 'currency'
  const currencySymbol = isCurrencyType ? '₽' : (CURRENCY_SYMBOLS[asset.currency] || asset.currency)
  const priceLabel = isCurrencyType ? 'Курс' : 'Текущая цена'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isCurrencyType ? 'Обновить курс' : 'Обновить цену'}</DialogTitle>
          <DialogDescription>
            {isCurrencyType
              ? `Обновите курс валюты ${asset.name} к рублю`
              : `Обновите текущую цену для ${asset.name}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Price Info */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">{priceLabel}</p>
              <p className="text-2xl font-bold tabular-nums">
                {currentPrice?.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || '—'}{' '}
                {currencySymbol}
              </p>
            </div>

            {/* New Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isCurrencyType ? `Новый курс (${currencySymbol})` : `Новая цена (${currencySymbol})`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Источник (опционально)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: MOEX, Binance"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Откуда взята котировка
                  </FormDescription>
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
                disabled={updatePrice.isPending}
              >
                {updatePrice.isPending ? 'Обновление...' : 'Обновить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
