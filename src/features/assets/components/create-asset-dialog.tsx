import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useCreateAsset, useAssetTypes } from '../hooks'

const CURRENCIES = [
  { value: 'RUB', label: 'Рубль (₽)' },
  { value: 'USD', label: 'Доллар ($)' },
  { value: 'EUR', label: 'Евро (€)' },
  { value: 'GEL', label: 'Лари (₾)' },
  { value: 'TRY', label: 'Лира (₺)' },
  { value: 'CNY', label: 'Юань (¥)' },
  { value: 'AED', label: 'Дирхам (د.إ)' },
]

const formSchema = z.object({
  name: z.string().min(1, 'Введите название актива'),
  assetTypeId: z.string().min(1, 'Выберите тип актива'),
  ticker: z.string().optional(),
  currency: z.string().min(1, 'Выберите валюту'),
  currentPrice: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateAssetDialogProps {
  children: React.ReactNode
}

export function CreateAssetDialog({ children }: CreateAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const createAsset = useCreateAsset()
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

  // Check if selected asset type is currency
  const selectedTypeId = form.watch('assetTypeId')
  const selectedType = assetTypesData?.data.find((t) => t.id === selectedTypeId)
  const isCurrencyType = selectedType?.code === 'currency'

  async function onSubmit(values: FormValues) {
    try {
      await createAsset.mutateAsync({
        name: values.name,
        assetTypeId: values.assetTypeId,
        ticker: values.ticker || undefined,
        currency: values.currency,
        currentPrice: isCurrencyType
          ? 1.0
          : values.currentPrice
            ? parseFloat(values.currentPrice)
            : undefined,
      })
      form.reset()
      setOpen(false)
    } catch {
      // Error is handled in mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Новый актив</DialogTitle>
          <DialogDescription>
            Добавьте валюту, акцию, ETF или другой актив
          </DialogDescription>
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
                    defaultValue={field.value}
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                    {isCurrencyType
                      ? 'К какой валюте привязан курс (например, RUB для пары USD/RUB)'
                      : 'В какой валюте указана цена актива'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Price - only for non-currency assets */}
            {!isCurrencyType && (
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
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createAsset.isPending}
              >
                {createAsset.isPending ? 'Создание...' : 'Создать актив'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
