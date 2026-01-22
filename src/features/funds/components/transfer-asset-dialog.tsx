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
import {
  ArrowRight,
  Loader2,
  Wallet,
  TrendingUp,
  Home,
  ShoppingBag,
  Calendar,
  Plane,
  PiggyBank,
  Gift,
  Car,
  Briefcase,
  GraduationCap,
  Heart,
  ChevronRight,
} from 'lucide-react'
import { useTransferAsset, useFunds } from '../hooks'
import type { FundBalance } from '@/lib/api/types'

const FUND_ICONS: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  home: Home,
  'shopping-bag': ShoppingBag,
  calendar: Calendar,
  plane: Plane,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  gift: Gift,
  car: Car,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  heart: Heart,
}

const formSchema = z.object({
  assetId: z.string().min(1, 'Выберите актив'),
  amount: z.string().min(1, 'Введите количество'),
  toFundId: z.string().min(1, 'Выберите целевой фонд'),
  date: z.string().min(1, 'Выберите дату'),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatQuantity(amount: number): string {
  if (Number.isInteger(amount)) {
    return new Intl.NumberFormat('ru-RU').format(amount)
  }
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(amount)
}

interface TransferAssetDialogProps {
  fund: FundBalance | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferAssetDialog({
  fund,
  open,
  onOpenChange,
}: TransferAssetDialogProps) {
  const transferAsset = useTransferAsset()
  const fundId = fund?.fund?.id ?? ''
  const { data: fundsData } = useFunds()

  // Используем активы из пропса fund.assets
  const fundAssets = (fund?.assets ?? []).filter((a) => a?.asset?.id != null)
  const allFunds = fundsData?.data ?? []
  const otherFunds = allFunds.filter(
    (f): f is typeof f & { fund: NonNullable<typeof f['fund']> } =>
      f?.fund?.id != null && f.fund.id !== fundId
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetId: '',
      amount: '',
      toFundId: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    },
  })

  const watchAmount = form.watch('amount')
  const watchAssetId = form.watch('assetId')
  const watchToFundId = form.watch('toFundId')

  const selectedAsset = fundAssets.find((a) => a?.asset?.id === watchAssetId)
  const selectedTargetFund = otherFunds.find((f) => f.fund.id === watchToFundId)

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  async function onSubmit(values: FormValues) {
    if (!fund) return

    const amount = parseFloat(values.amount)

    try {
      await transferAsset.mutateAsync({
        fundId: fund.fund.id,
        data: {
          toFundId: values.toFundId,
          assetId: values.assetId,
          amount,
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
  const hasInsufficientAmount =
    selectedAsset && amountNum > selectedAsset.amount

  const SourceIcon = FUND_ICONS[fund.fund.icon] || Wallet
  const TargetIcon = selectedTargetFund
    ? FUND_ICONS[selectedTargetFund.fund.icon] || Wallet
    : Wallet

  const sourceColor = fund.fund.color || '#f97316'
  const targetColor = selectedTargetFund?.fund.color || '#6b7280'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden border-0 bg-gradient-to-b from-background to-background/95 p-0 shadow-2xl sm:max-w-[720px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Header with Transfer Flow Visualization */}
            <div className="relative overflow-hidden px-6 pb-4 pt-6">
              {/* Background gradient */}
              <div className="absolute inset-0 opacity-20">
                <div
                  className="absolute -left-16 top-0 h-48 w-48 rounded-full blur-3xl"
                  style={{ backgroundColor: sourceColor }}
                />
                <div
                  className="absolute -right-16 top-0 h-48 w-48 rounded-full blur-3xl"
                  style={{ backgroundColor: targetColor }}
                />
              </div>

              <DialogHeader className="relative">
                <DialogTitle className="sr-only">Перевести актив</DialogTitle>

                {/* Transfer Flow Visualization */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-stretch justify-between gap-3"
                >
                  {/* Source Fund Card */}
                  <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="relative flex-1 overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm"
                  >
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `linear-gradient(135deg, ${sourceColor} 0%, transparent 60%)`,
                      }}
                    />
                    <div className="relative flex h-full flex-col">
                      {/* Header */}
                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${sourceColor}25` }}
                        >
                          <SourceIcon
                            className="h-4 w-4"
                            style={{ color: sourceColor }}
                          />
                        </div>
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Откуда
                        </span>
                      </div>

                      {/* Fund Name */}
                      <p className="mb-3 font-semibold leading-tight">
                        {fund.fund.name}
                      </p>

                      {/* Asset Selector */}
                      <FormField
                        control={form.control}
                        name="assetId"
                        render={({ field }) => (
                          <FormItem className="mt-auto">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-auto min-h-[52px] border-0 bg-muted/50 px-3 py-2 transition-all hover:bg-muted/70 focus:ring-2 focus:ring-orange-500/20 [&>span]:text-left [&>span]:w-full [&>span]:whitespace-normal [&>span]:break-words">
                                  <SelectValue placeholder="Выберите актив" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-w-[300px]">
                                {fundAssets.map((a) => {
                                  const isCurrency = a.asset.typeCode === 'currency'
                                  const unit = isCurrency
                                    ? CURRENCY_SYMBOLS[a.asset.currency] || a.asset.currency
                                    : 'шт.'
                                  return (
                                    <SelectItem key={a.asset.id} value={a.asset.id} className="whitespace-normal">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-medium">{a.asset.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {isCurrency ? formatMoney(a.amount) : formatQuantity(a.amount)} {unit}
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

                      {/* Selected asset info */}
                      {selectedAsset && (() => {
                        const isCurrency = selectedAsset.asset.typeCode === 'currency'
                        const unit = isCurrency
                          ? CURRENCY_SYMBOLS[selectedAsset.asset.currency] || selectedAsset.asset.currency
                          : 'шт.'
                        return (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 overflow-hidden"
                          >
                            <div className="rounded-lg bg-muted/30 px-2 py-1.5">
                              <p className="text-xs text-muted-foreground">
                                Доступно
                              </p>
                              <p className="font-mono text-sm font-medium tabular-nums">
                                {isCurrency ? formatMoney(selectedAsset.amount) : formatQuantity(selectedAsset.amount)}{' '}
                                {unit}
                              </p>
                            </div>
                          </motion.div>
                        )
                      })()}
                    </div>
                  </motion.div>

                  {/* Animated Arrow Flow */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className="relative flex flex-col items-center justify-center gap-1"
                  >
                    {/* Transfer Amount Badge */}
                    <AnimatePresence mode="wait">
                      {amountNum > 0 && selectedAsset && (() => {
                        const isCurrency = selectedAsset.asset.typeCode === 'currency'
                        return (
                          <motion.div
                            key={amountNum}
                            initial={{ opacity: 0, y: -10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.8 }}
                            className={`rounded-full px-2.5 py-1 text-center ${
                              hasInsufficientAmount
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                            }`}
                          >
                            <span className="font-mono text-xs font-bold tabular-nums">
                              {isCurrency ? formatMoney(amountNum) : formatQuantity(amountNum)}
                            </span>
                          </motion.div>
                        )
                      })()}
                    </AnimatePresence>

                    {/* Animated Arrows */}
                    <div className="flex items-center gap-0">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0.3, x: -3 }}
                          animate={{
                            opacity: [0.3, 1, 0.3],
                            x: [-3, 3, -3],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: 'easeInOut',
                          }}
                        >
                          <ChevronRight className="h-4 w-4 text-orange-500" />
                        </motion.div>
                      ))}
                    </div>

                    {hasInsufficientAmount && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-[80px] text-center text-[9px] leading-tight text-destructive"
                      >
                        Недостаточно
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Target Fund Card */}
                  <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className={`relative flex-1 overflow-hidden rounded-2xl border p-4 backdrop-blur-sm transition-all ${
                      selectedTargetFund
                        ? 'border-border/50 bg-card/80'
                        : 'border-dashed border-muted-foreground/30 bg-muted/30'
                    }`}
                  >
                    {selectedTargetFund && (
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          background: `linear-gradient(135deg, ${targetColor} 0%, transparent 60%)`,
                        }}
                      />
                    )}
                    <div className="relative flex h-full flex-col">
                      {/* Header */}
                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: selectedTargetFund
                              ? `${targetColor}25`
                              : 'hsl(var(--muted))',
                          }}
                        >
                          <TargetIcon
                            className="h-4 w-4"
                            style={{
                              color: selectedTargetFund
                                ? targetColor
                                : 'hsl(var(--muted-foreground))',
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Куда
                        </span>
                      </div>

                      {/* Fund Selector */}
                      <FormField
                        control={form.control}
                        name="toFundId"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-auto min-h-[44px] w-full border-0 bg-muted/50 px-3 py-2 transition-all hover:bg-muted/70 focus:ring-2 focus:ring-orange-500/20 [&>span]:text-left [&>span]:w-full">
                                  <SelectValue placeholder="Выберите фонд" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {otherFunds.map((f) => (
                                  <SelectItem key={f.fund.id} value={f.fund.id}>
                                    {f.fund.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Amount to be credited */}
                      {selectedTargetFund && amountNum > 0 && selectedAsset && (() => {
                        const isCurrency = selectedAsset.asset.typeCode === 'currency'
                        const unit = isCurrency
                          ? CURRENCY_SYMBOLS[selectedAsset.asset.currency] || selectedAsset.asset.currency
                          : 'шт.'
                        return (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-auto overflow-hidden pt-2"
                          >
                            <div className="rounded-lg bg-emerald-500/10 px-3 py-2">
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                Будет зачислено
                              </p>
                              <p className="font-mono text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                                +{isCurrency ? formatMoney(amountNum) : formatQuantity(amountNum)}{' '}
                                <span className="opacity-70">
                                  {unit}
                                </span>
                              </p>
                            </div>
                          </motion.div>
                        )
                      })()}
                    </div>
                  </motion.div>
                </motion.div>
              </DialogHeader>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 px-6 pb-6">
              {/* Amount Input - prominent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => {
                    const isCurrency = selectedAsset?.asset.typeCode === 'currency'
                    const unit = selectedAsset
                      ? isCurrency
                        ? CURRENCY_SYMBOLS[selectedAsset.asset.currency] || selectedAsset.asset.currency
                        : 'шт.'
                      : ''
                    return (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {isCurrency ? 'Сумма' : 'Количество'}
                          </span>
                          <FormControl>
                            <Input
                              type="number"
                              step={isCurrency ? '0.01' : '1'}
                              placeholder="0"
                              className="h-12 flex-1 border-0 bg-muted/50 text-center font-mono text-xl font-medium tabular-nums transition-all focus:bg-muted/70 focus:ring-2 focus:ring-orange-500/20"
                              {...field}
                            />
                          </FormControl>
                          {selectedAsset && (
                            <span className="text-lg text-muted-foreground">
                              {unit}
                            </span>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </motion.div>

              {/* Date & Note Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-[140px_1fr] gap-3"
              >
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <span className="text-xs text-muted-foreground">Дата</span>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-10 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-orange-500/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <span className="text-xs text-muted-foreground">
                        Комментарий
                      </span>
                      <FormControl>
                        <Input
                          placeholder="Опционально"
                          className="h-10 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-orange-500/20"
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
                transition={{ delay: 0.3 }}
                className="flex gap-3 pt-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 flex-1 text-muted-foreground hover:text-foreground"
                  onClick={handleClose}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="h-11 flex-1 gap-2 bg-gradient-to-r from-orange-500 to-orange-600 font-medium text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700"
                  disabled={transferAsset.isPending || hasInsufficientAmount}
                >
                  {transferAsset.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Перевод...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Перевести
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
