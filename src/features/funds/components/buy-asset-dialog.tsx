import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { useBuyAsset, useFundCurrencyAssets } from '../hooks'
import { useAssets } from '@/features/assets'
import { useExchangeRates } from '@/features/expenses/hooks'
import type { FundBalance } from '@/lib/api/types'

const formSchema = z.object({
  assetId: z.string().min(1, 'Выберите актив'),
  amount: z.string().min(1, 'Введите количество'),
  pricePerUnit: z.string().min(1, 'Введите цену за единицу'),
  currencyAssetId: z.string().min(1, 'Выберите валюту списания'),
  date: z.string().min(1, 'Выберите дату'),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface BuyAssetDialogProps {
  fund: FundBalance | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BuyAssetDialog({
  fund,
  open,
  onOpenChange,
}: BuyAssetDialogProps) {
  const buyAsset = useBuyAsset()
  const { data: assetsData } = useAssets()
  const { data: currencyAssetsData } = useFundCurrencyAssets(fund?.fund.id ?? '')
  const { data: exchangeRatesData } = useExchangeRates()

  const allAssets = (assetsData?.data ?? []).filter((a) => a?.id != null)
  const exchangeRates = exchangeRatesData?.data ?? []

  // Используем валютные активы из API, либо fallback на активы фонда с типом currency
  const apiCurrencyAssets = (currencyAssetsData?.data ?? []).filter(
    (a) => a?.asset?.id != null
  )
  const fundCurrencyAssets = (fund?.assets ?? []).filter(
    (a) => a?.asset?.id != null && a.asset.typeCode === 'currency'
  )
  const currencyAssets =
    apiCurrencyAssets.length > 0 ? apiCurrencyAssets : fundCurrencyAssets

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetId: '',
      amount: '',
      pricePerUnit: '',
      currencyAssetId: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    },
  })

  const watchAmount = form.watch('amount')
  const watchPrice = form.watch('pricePerUnit')
  const watchCurrencyAssetId = form.watch('currencyAssetId')

  const selectedCurrencyAsset = currencyAssets.find(
    (a) => a?.asset?.id === watchCurrencyAssetId
  )

  const handleAssetChange = (assetId: string) => {
    form.setValue('assetId', assetId)
    const selectedAsset = allAssets.find((a) => a.id === assetId)
    if (!selectedAsset) return

    // Для валютных активов берём курс из таблицы курсов валют
    if (selectedAsset.type_code === 'currency' && selectedAsset.currency) {
      const rate = exchangeRates.find(
        (r) => r.from_currency === selectedAsset.currency && r.to_currency === 'RUB'
      )
      if (rate?.rate && rate.rate > 0) {
        form.setValue('pricePerUnit', String(rate.rate))
        return
      }
    }

    // Для остальных активов используем current_price
    if (selectedAsset.current_price) {
      const price =
        typeof selectedAsset.current_price === 'number'
          ? selectedAsset.current_price
          : selectedAsset.current_price.Float64 ?? 0
      if (price > 0) {
        form.setValue('pricePerUnit', String(price))
      }
    }
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  async function onSubmit(values: FormValues) {
    if (!fund) return

    const amount = parseFloat(values.amount)
    const pricePerUnit = parseFloat(values.pricePerUnit)

    try {
      await buyAsset.mutateAsync({
        fundId: fund.fund.id,
        data: {
          assetId: values.assetId,
          amount,
          pricePerUnit,
          currencyAssetId: values.currencyAssetId,
          date: values.date,
          note: values.note || undefined,
        },
      })

      handleClose()
    } catch {
      // Error is handled in mutation
    }
  }

  if (!fund || !open) return null

  const amountNum = parseFloat(watchAmount) || 0
  const priceNum = parseFloat(watchPrice) || 0
  const totalCost = amountNum * priceNum

  const hasInsufficientFunds =
    selectedCurrencyAsset && totalCost > selectedCurrencyAsset.amount

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden border-0 bg-gradient-to-b from-background to-background/95 p-0 shadow-2xl sm:max-w-[480px]">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent px-6 pb-8 pt-6">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
          </div>

          <DialogHeader className="relative">
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25"
              >
                <ShoppingCart className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Купить актив
                </DialogTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {fund.fund.name}
                </p>
              </div>
            </div>

            {/* Live Total Preview */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${watchAmount}-${watchPrice}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-2"
              >
                <p className="text-sm text-muted-foreground">Итого</p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-4xl font-bold tabular-nums tracking-tight ${hasInsufficientFunds ? 'text-destructive' : ''}`}
                  >
                    {totalCost > 0 ? formatMoney(totalCost) : '0'}
                  </span>
                  <span className="text-2xl font-medium text-muted-foreground">
                    {selectedCurrencyAsset?.asset.currency || '₽'}
                  </span>
                </div>
                {hasInsufficientFunds && (
                  <p className="mt-1 text-sm text-destructive">
                    Недостаточно средств
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </DialogHeader>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 pb-6">
            {/* Asset */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Актив *
                    </FormLabel>
                    <Select onValueChange={handleAssetChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Выберите актив" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allAssets.map((a) => {
                          const price =
                            typeof a.current_price === 'number'
                              ? a.current_price
                              : a.current_price?.Float64 ?? 0
                          return (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                              {a.ticker && ` (${a.ticker})`}
                              {price > 0 && ` • ${formatMoney(price)} ₽`}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Amount & Price */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Количество *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0"
                        className="h-12 border-0 bg-muted/50 text-lg font-medium tabular-nums transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Цена за единицу *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        className="h-12 border-0 bg-muted/50 text-lg font-medium tabular-nums transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Currency Asset */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <FormField
                control={form.control}
                name="currencyAssetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Списать из валюты *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Выберите валюту" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencyAssets.map((a) => (
                          <SelectItem key={a.asset.id} value={a.asset.id}>
                            {a.asset.name} ({formatMoney(a.amount)}{' '}
                            {a.asset.currency} доступно)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Date */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Дата
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Note */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Комментарий
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опционально"
                        className="min-h-[80px] resize-none border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-3 pt-2"
            >
              <Button
                type="button"
                variant="ghost"
                className="h-12 flex-1 text-muted-foreground hover:text-foreground"
                onClick={handleClose}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="h-12 flex-1 font-medium"
                disabled={buyAsset.isPending || hasInsufficientFunds}
              >
                {buyAsset.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Покупка...
                  </>
                ) : (
                  'Купить'
                )}
              </Button>
            </motion.div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
