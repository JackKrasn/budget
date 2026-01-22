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
import { Settings, Loader2, Coins, TrendingUp } from 'lucide-react'
import { useCreateContribution } from '../hooks'
import { useAssets } from '@/features/assets'
import type { FundBalance, AssetWithType } from '@/lib/api/types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

const formSchema = z.object({
  date: z.string().min(1, 'Выберите дату'),
  amount: z.string().min(1, 'Введите количество'),
  assetId: z.string().min(1, 'Выберите актив'),
})

type FormValues = z.infer<typeof formSchema>

function formatMoney(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

function formatQuantity(amount: number): string {
  // For quantities (stocks, ETF), show without decimal if whole number
  if (Number.isInteger(amount)) {
    return new Intl.NumberFormat('ru-RU').format(amount)
  }
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(amount)
}

function isCurrencyAsset(asset: AssetWithType | undefined): boolean {
  return asset?.type_code === 'currency'
}

interface SetInitialBalanceDialogProps {
  fund: FundBalance | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SetInitialBalanceDialog({
  fund,
  open,
  onOpenChange,
}: SetInitialBalanceDialogProps) {
  const createContribution = useCreateContribution()
  const { data: assetsData } = useAssets()

  const allAssets = assetsData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: '',
      assetId: '',
    },
  })

  const watchAmount = form.watch('amount')
  const watchAssetId = form.watch('assetId')

  // Find selected asset to determine its type
  const selectedAsset = allAssets.find((a) => a.id === watchAssetId)
  const isCurrency = isCurrencyAsset(selectedAsset)

  // Get currency symbol for currency assets
  const currencySymbol = selectedAsset
    ? CURRENCY_SYMBOLS[selectedAsset.currency] || selectedAsset.currency
    : ''

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  async function onSubmit(values: FormValues) {
    if (!fund || !selectedAsset) return

    const amount = parseFloat(values.amount)

    try {
      await createContribution.mutateAsync({
        fundId: fund.fund.id,
        data: {
          date: values.date,
          totalAmount: amount,
          currency: selectedAsset.currency,
          allocations: [
            {
              assetId: values.assetId,
              amount: amount,
            },
          ],
          note: isCurrency
            ? 'Начальный остаток'
            : `Начальный остаток: ${selectedAsset.name}${selectedAsset.ticker ? ` (${selectedAsset.ticker})` : ''}`,
        },
      })

      handleClose()
    } catch {
      // Error is handled in mutation
    }
  }

  if (!fund) return null

  const amountNum = parseFloat(watchAmount) || 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden border-0 bg-gradient-to-b from-background to-background/95 p-0 shadow-2xl sm:max-w-[480px]">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent px-6 pb-8 pt-6">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
          </div>

          <DialogHeader className="relative">
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25"
              >
                <Settings className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Установить начальный остаток
                </DialogTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {fund.fund.name}
                </p>
              </div>
            </div>

            {/* Live Amount Preview */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${watchAmount}-${watchAssetId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-2"
              >
                <p className="text-sm text-muted-foreground">
                  {isCurrency ? 'Начальный остаток' : 'Количество'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums tracking-tight">
                    {amountNum > 0
                      ? isCurrency
                        ? formatMoney(amountNum)
                        : formatQuantity(amountNum)
                      : '0'}
                  </span>
                  <span className="text-2xl font-medium text-muted-foreground">
                    {isCurrency
                      ? currencySymbol
                      : selectedAsset
                        ? 'шт.'
                        : ''}
                  </span>
                </div>
                {selectedAsset && !isCurrency && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedAsset.name}
                    {selectedAsset.ticker && ` (${selectedAsset.ticker})`}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </DialogHeader>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 pb-6">
            {/* Asset - first, so user knows what they're adding */}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Выберите актив" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allAssets.map((asset) => {
                          const isAssetCurrency = asset.type_code === 'currency'
                          const icon = isAssetCurrency ? (
                            <Coins className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          )
                          return (
                            <SelectItem key={asset.id} value={asset.id}>
                              <div className="flex items-center gap-2">
                                {icon}
                                <span>{asset.name}</span>
                                {asset.ticker && (
                                  <span className="text-muted-foreground">
                                    ({asset.ticker})
                                  </span>
                                )}
                                {isAssetCurrency && (
                                  <span className="text-muted-foreground">
                                    {CURRENCY_SYMBOLS[asset.currency] || asset.currency}
                                  </span>
                                )}
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
            </motion.div>

            {/* Amount/Quantity */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      {isCurrency ? 'Сумма' : 'Количество'} *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step={isCurrency ? '0.01' : '1'}
                          min="0"
                          placeholder="0"
                          className="h-12 border-0 bg-muted/50 text-lg font-medium tabular-nums transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20 pr-12"
                          {...field}
                        />
                        {selectedAsset && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {isCurrency ? currencySymbol : 'шт.'}
                          </span>
                        )}
                      </div>
                    </FormControl>
                    {selectedAsset && !isCurrency && (
                      <FormDescription>
                        Укажите количество единиц актива
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Date - hidden for now, using current date */}
            <input type="hidden" {...form.register('date')} />

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
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
                disabled={createContribution.isPending}
              >
                {createContribution.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить'
                )}
              </Button>
            </motion.div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
