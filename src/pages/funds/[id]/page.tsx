import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  Home,
  ShoppingBag,
  Calendar,
  Plane,
  Wallet,
  PiggyBank,
  Gift,
  Car,
  Briefcase,
  GraduationCap,
  Heart,
  Loader2,
  ArrowDownRight,
  Settings,
  History,
  BarChart3,
  ArrowLeft,
  AlertCircle,
  Plus,
  ArrowRightLeft,
  Banknote,
  LineChart,
  Landmark,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useFund,
  useUpdateFund,
  useFundDistributionRules,
  useCreateDistributionRule,
  useUpdateDistributionRule,
  useDeleteDistributionRule,
  ContributionDialog,
  WithdrawalDialog,
  BuyAssetDialog,
  DepositToFundDialog,
  TransferAssetDialog,
  FundTransactionsHistory,
  SetInitialBalanceDialog,
} from '@/features/funds'
import type { FundStatus, RuleType, FundBalance, FundAssetBalance } from '@/lib/api/types'

const FUND_ICONS = [
  { value: 'trending-up', icon: TrendingUp, label: 'Инвестиции' },
  { value: 'home', icon: Home, label: 'Дом' },
  { value: 'shopping-bag', icon: ShoppingBag, label: 'Покупки' },
  { value: 'calendar', icon: Calendar, label: 'События' },
  { value: 'plane', icon: Plane, label: 'Путешествия' },
  { value: 'wallet', icon: Wallet, label: 'Кошелёк' },
  { value: 'piggy-bank', icon: PiggyBank, label: 'Накопления' },
  { value: 'gift', icon: Gift, label: 'Подарки' },
  { value: 'car', icon: Car, label: 'Авто' },
  { value: 'briefcase', icon: Briefcase, label: 'Работа' },
  { value: 'graduation-cap', icon: GraduationCap, label: 'Образование' },
  { value: 'heart', icon: Heart, label: 'Здоровье' },
]

const FUND_COLORS = [
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#ef4444',
  '#3b82f6',
  '#84cc16',
  '#f97316',
  '#6366f1',
]

// Asset type configuration for grouping
const ASSET_TYPE_CONFIG: Record<string, { label: string; icon: typeof Banknote; color: string }> = {
  currency: { label: 'Валюта', icon: Banknote, color: '#10b981' },
  etf: { label: 'ETF', icon: LineChart, color: '#8b5cf6' },
  stock: { label: 'Акции', icon: TrendingUp, color: '#3b82f6' },
  bond: { label: 'Облигации', icon: Landmark, color: '#f59e0b' },
  crypto: { label: 'Криптовалюта', icon: Sparkles, color: '#ec4899' },
  other: { label: 'Другое', icon: Wallet, color: '#6b7280' },
}

const formSchema = z.object({
  name: z.string().min(1, 'Введите название фонда'),
  icon: z.string().min(1, 'Выберите иконку'),
  color: z.string().min(1, 'Выберите цвет'),
  isVirtual: z.string(),
  status: z.enum(['active', 'paused', 'completed']),
})

type FormValues = z.infer<typeof formSchema>

const ruleFormSchema = z.object({
  ruleType: z.enum(['percentage', 'fixed']),
  ruleValue: z.string().min(1, 'Введите значение'),
  isActive: z.boolean(),
})

type RuleFormValues = z.infer<typeof ruleFormSchema>

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(price)
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    GEL: '₾',
    TRY: '₺',
  }
  return symbols[currency] || currency
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const assetCardVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
}

// Asset Group Component
interface AssetGroupProps {
  typeCode: string
  assets: FundAssetBalance[]
  onAssetClick: (asset: FundAssetBalance) => void
}

function AssetGroup({ typeCode, assets, onAssetClick }: AssetGroupProps) {
  const config = ASSET_TYPE_CONFIG[typeCode] || ASSET_TYPE_CONFIG.other
  const Icon = config.icon
  const totalValue = assets.reduce((sum, a) => sum + a.valueBase, 0)

  return (
    <motion.div
      variants={itemVariants}
      className="space-y-3"
    >
      {/* Group Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{config.label}</h3>
          <p className="text-xs text-muted-foreground">
            {assets.length} {assets.length === 1 ? 'актив' : assets.length < 5 ? 'актива' : 'активов'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">
            {formatMoney(totalValue)} ₽
          </p>
        </div>
      </div>

      {/* Assets List */}
      <div className="space-y-2 pl-11">
        {assets.map((asset, index) => (
          <motion.div
            key={asset.asset.id}
            variants={assetCardVariants}
            custom={index}
            className="group flex items-center justify-between rounded-xl bg-muted/40 p-3 cursor-pointer transition-all hover:bg-muted/60 hover:shadow-sm"
            onClick={() => onAssetClick(asset)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{asset.asset.name}</p>
                {asset.asset.ticker && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {asset.asset.ticker}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {typeCode === 'currency'
                  ? `${formatMoney(asset.amount)} ${getCurrencySymbol(asset.asset.currency)}`
                  : `${asset.amount} шт. × ${formatPrice(asset.amount > 0 ? asset.valueBase / asset.amount : 0)} ₽`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-semibold tabular-nums">
                  {typeCode === 'currency'
                    ? `${formatMoney(asset.amount)} ${getCurrencySymbol(asset.asset.currency)}`
                    : `${formatMoney(asset.valueBase)} ₽`
                  }
                </p>
                {typeCode === 'currency' && asset.asset.currency !== 'RUB' && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {formatMoney(asset.valueBase)} ₽
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function FundDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingRule, setIsEditingRule] = useState(false)
  const [contributionOpen, setContributionOpen] = useState(false)
  const [withdrawalOpen, setWithdrawalOpen] = useState(false)
  const [buyAssetOpen, setBuyAssetOpen] = useState(false)
  const [depositFromAccountOpen, setDepositFromAccountOpen] = useState(false)
  const [transferAssetOpen, setTransferAssetOpen] = useState(false)
  const [setInitialBalanceOpen, setSetInitialBalanceOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [selectedAssetName, setSelectedAssetName] = useState<string | null>(null)

  const { data: fund, isLoading, error } = useFund(id!)
  const updateFund = useUpdateFund()
  const { data: rulesData } = useFundDistributionRules(id!)
  const createRule = useCreateDistributionRule()
  const updateRule = useUpdateDistributionRule()
  const deleteRule = useDeleteDistributionRule()

  const activeRule = rulesData?.data?.find((r) => r.is_active)

  const fundData = fund?.fund
  const totalBase = fund?.totalBase ?? 0
  const baseCurrency = fund?.baseCurrency ?? 'RUB'
  const assets = fund?.assets ?? []

  // Group assets by type
  const assetGroups = useMemo(() => {
    const groups: Record<string, FundAssetBalance[]> = {}

    assets.forEach((asset) => {
      const typeCode = asset.asset.typeCode || 'other'
      if (!groups[typeCode]) {
        groups[typeCode] = []
      }
      groups[typeCode].push(asset)
    })

    // Sort groups by predefined order
    const order = ['currency', 'etf', 'stock', 'bond', 'crypto', 'other']
    const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
      const indexA = order.indexOf(a) === -1 ? 999 : order.indexOf(a)
      const indexB = order.indexOf(b) === -1 ? 999 : order.indexOf(b)
      return indexA - indexB
    })

    return sortedEntries
  }, [assets])

  // Separate currency assets for header display
  const currencyAssets = assets.filter((a) => a.asset.typeCode === 'currency')
  const otherAssets = assets.filter((a) => a.asset.typeCode !== 'currency')

  // Group currency assets by currency for balance display
  const currencyBalances = currencyAssets.reduce(
    (acc, a) => {
      const currency = a.asset.currency || 'RUB'
      acc[currency] = (acc[currency] || 0) + a.amount
      return acc
    },
    {} as Record<string, number>
  )

  // Calculate total value of other assets in base currency
  const otherAssetsTotalBase = otherAssets.reduce((sum, a) => sum + a.valueBase, 0)

  const Icon = FUND_ICONS.find((i) => i.value === fundData?.icon)?.icon || Wallet

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: fundData
      ? {
          name: fundData.name,
          icon: fundData.icon,
          color: fundData.color,
          isVirtual: fundData.is_virtual ? 'true' : 'false',
          status: fundData.status,
        }
      : undefined,
  })

  const ruleForm = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    values: activeRule
      ? {
          ruleType: activeRule.rule_type,
          ruleValue: String(activeRule.value || ''),
          isActive: activeRule.is_active,
        }
      : {
          ruleType: 'percentage',
          ruleValue: '10',
          isActive: true,
        },
  })

  const ruleType = ruleForm.watch('ruleType')

  async function onSubmit(values: FormValues) {
    if (!fundData) return

    try {
      await updateFund.mutateAsync({
        id: fundData.id,
        data: {
          name: values.name,
          icon: values.icon,
          color: values.color,
          isVirtual: values.isVirtual === 'true',
          status: values.status as FundStatus,
        },
      })
      setIsEditing(false)
    } catch {
      // Error is handled in mutation
    }
  }

  async function onRuleSubmit(values: RuleFormValues) {
    if (!fundData) return

    try {
      if (activeRule) {
        await updateRule.mutateAsync({
          id: activeRule.id,
          data: {
            ruleType: values.ruleType as RuleType,
            value: parseFloat(values.ruleValue),
            isActive: values.isActive,
          },
        })
      } else {
        await createRule.mutateAsync({
          fundId: fundData.id,
          ruleType: values.ruleType as RuleType,
          value: parseFloat(values.ruleValue),
          isActive: values.isActive,
        })
      }
      setIsEditingRule(false)
    } catch {
      // Error is handled in mutation
    }
  }

  async function handleDeleteRule() {
    if (!activeRule) return

    if (confirm('Удалить правило распределения?')) {
      try {
        await deleteRule.mutateAsync(activeRule.id)
        setIsEditingRule(false)
      } catch {
        // Error is handled in mutation
      }
    }
  }

  const handleAssetClick = (asset: FundAssetBalance) => {
    setSelectedAssetId(asset.asset.id)
    setSelectedAssetName(asset.asset.name)
    setActiveTab('history')
  }

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>ID фонда не указан</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/funds')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ошибка при загрузке фонда: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading || !fund || !fundData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  // Create a FundBalance object for dialogs
  const fundBalance: FundBalance = {
    fund: fundData,
    totalBase,
    baseCurrency,
    assets,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Button variant="ghost" onClick={() => navigate('/funds')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к фондам
        </Button>

        {/* Hero Section with gradient */}
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-8"
          style={{
            background: `linear-gradient(135deg, ${fundData.color}15 0%, ${fundData.color}05 50%, transparent 100%)`,
          }}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
              style={{ backgroundColor: `${fundData.color}30` }}
            />
            <div
              className="absolute -left-16 bottom-0 h-40 w-40 rounded-full blur-3xl"
              style={{ backgroundColor: `${fundData.color}20` }}
            />
            <div
              className="absolute right-1/4 top-1/2 h-24 w-24 rounded-full blur-2xl"
              style={{ backgroundColor: `${fundData.color}15` }}
            />
          </div>

          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
                style={{
                  backgroundColor: fundData.color,
                  boxShadow: `0 10px 30px ${fundData.color}40`,
                }}
              >
                <Icon className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 mb-1"
                >
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    {fundData.name}
                  </h1>
                  <Badge
                    variant={
                      fundData.status === 'active'
                        ? 'default'
                        : fundData.status === 'paused'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {fundData.status === 'active'
                      ? 'Активен'
                      : fundData.status === 'paused'
                        ? 'Пауза'
                        : 'Завершён'}
                  </Badge>
                  {fundData.is_virtual && (
                    <Badge variant="outline">Виртуальный</Badge>
                  )}
                </motion.div>
                {activeRule && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-muted-foreground"
                  >
                    {activeRule.rule_type === 'percentage'
                      ? `${activeRule.value}% от дохода`
                      : `${formatMoney(activeRule.value || 0)} ₽ фиксированно`}
                  </motion.p>
                )}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-end gap-3"
            >
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Общий баланс</p>
                <div className="flex items-baseline gap-2">
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                    className="text-4xl font-bold tabular-nums tracking-tight"
                  >
                    {formatMoney(totalBase)}
                  </motion.span>
                  <span className="text-2xl font-medium text-muted-foreground">₽</span>
                </div>

                {/* Breakdown by asset type */}
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.4 }}
                    className="mt-2 space-y-1"
                  >
                    {/* Currency balances */}
                    {Object.keys(currencyBalances).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Валюта</p>
                        <div className="flex flex-wrap gap-3 justify-end">
                          {Object.entries(currencyBalances).map(([currency, amount]) => (
                            <div key={currency} className="flex items-baseline gap-1">
                              <span className="text-lg font-semibold tabular-nums">
                                {formatMoney(amount)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {getCurrencySymbol(currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other assets total */}
                    {otherAssets.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Другие активы</p>
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-lg font-semibold tabular-nums">
                            ≈ {formatMoney(otherAssetsTotalBase)}
                          </span>
                          <span className="text-sm text-muted-foreground">₽</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 bg-background/50 backdrop-blur-sm"
                  onClick={() => setBuyAssetOpen(true)}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Купить актив
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 bg-background/50 backdrop-blur-sm"
                  onClick={() => setDepositFromAccountOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Пополнить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 bg-background/50 backdrop-blur-sm"
                  onClick={() => setTransferAssetOpen(true)}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Перевести
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 bg-background/50 backdrop-blur-sm"
                  onClick={() => setSetInitialBalanceOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  Начальный остаток
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 bg-background/50 backdrop-blur-sm"
                  onClick={() => setWithdrawalOpen(true)}
                >
                  <ArrowDownRight className="h-4 w-4" />
                  Списать
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-4 w-4" />
              История
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" />
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Assets grouped by type */}
              <Card className="md:col-span-2 lg:col-span-2 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Активы в фонде</CardTitle>
                    <Badge variant="secondary" className="font-mono">
                      {assets.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {assets.length > 0 ? (
                    <motion.div
                      className="space-y-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {assetGroups.map(([typeCode, typeAssets]) => (
                        <AssetGroup
                          key={typeCode}
                          typeCode={typeCode}
                          assets={typeAssets}
                          onAssetClick={handleAssetClick}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/30 text-center"
                    >
                      <Wallet className="mb-2 h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Нет активов в фонде</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={() => setBuyAssetOpen(true)}
                      >
                        Добавить актив
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Distribution Rule */}
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Распределение</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeRule ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div
                        className="rounded-xl p-4"
                        style={{ backgroundColor: `${fundData.color}10` }}
                      >
                        <p className="text-3xl font-bold tabular-nums" style={{ color: fundData.color }}>
                          {activeRule.rule_type === 'percentage'
                            ? `${activeRule.value}%`
                            : `${formatMoney(activeRule.value || 0)} ₽`}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activeRule.rule_type === 'percentage'
                            ? 'от каждого дохода'
                            : 'фиксированная сумма'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Статус</span>
                        <Badge variant={activeRule.is_active ? 'default' : 'secondary'}>
                          {activeRule.is_active ? 'Активно' : 'Неактивно'}
                        </Badge>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex h-24 flex-col items-center justify-center text-center">
                      <p className="text-sm text-muted-foreground">
                        Правило не настроено
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={() => {
                          setActiveTab('settings')
                          setIsEditingRule(true)
                        }}
                      >
                        Настроить
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <FundTransactionsHistory
                  fundId={id!}
                  assetId={selectedAssetId || undefined}
                  assetName={selectedAssetName || undefined}
                  onClearAssetFilter={() => {
                    setSelectedAssetId(null)
                    setSelectedAssetName(null)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Fund Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Настройки фонда</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      {/* Name */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">
                              Название
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={!isEditing}
                                className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Status */}
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">
                              Статус
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!isEditing}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Активен</SelectItem>
                                <SelectItem value="paused">Приостановлен</SelectItem>
                                <SelectItem value="completed">Завершён</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Icon */}
                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">
                              Иконка
                            </FormLabel>
                            <div className="grid grid-cols-6 gap-2">
                              {FUND_ICONS.map((item) => {
                                const ItemIcon = item.icon
                                return (
                                  <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => isEditing && field.onChange(item.value)}
                                    disabled={!isEditing}
                                    className={cn(
                                      'flex h-11 w-11 items-center justify-center rounded-xl bg-muted/50 transition-all',
                                      isEditing && 'hover:bg-muted',
                                      field.value === item.value &&
                                        'bg-primary/10 ring-2 ring-primary',
                                      !isEditing && 'opacity-50'
                                    )}
                                    title={item.label}
                                  >
                                    <ItemIcon className="h-5 w-5" />
                                  </button>
                                )
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Color */}
                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">
                              Цвет
                            </FormLabel>
                            <div className="flex flex-wrap gap-2">
                              {FUND_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => isEditing && field.onChange(color)}
                                  disabled={!isEditing}
                                  className={cn(
                                    'h-9 w-9 rounded-xl transition-all',
                                    field.value === color
                                      ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110'
                                      : '',
                                    isEditing && 'hover:scale-105',
                                    !isEditing && 'opacity-50'
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Type */}
                      <FormField
                        control={form.control}
                        name="isVirtual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">
                              Тип фонда
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!isEditing}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 border-0 bg-muted/50 transition-all focus:bg-muted/70 focus:ring-2 focus:ring-primary/20">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="false">Реальный</SelectItem>
                                <SelectItem value="true">Виртуальный</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-2">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              className="flex-1 h-12"
                              onClick={() => {
                                form.reset()
                                setIsEditing(false)
                              }}
                            >
                              Отмена
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1 h-12 font-medium"
                              disabled={updateFund.isPending}
                            >
                              {updateFund.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Сохранение...
                                </>
                              ) : (
                                'Сохранить'
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            className="w-full h-12 font-medium"
                            onClick={() => setIsEditing(true)}
                          >
                            Редактировать
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Distribution Rule */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Правило распределения</CardTitle>
                    {activeRule && !isEditingRule && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingRule(true)}
                      >
                        Изменить
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingRule || !activeRule ? (
                    <Form {...ruleForm}>
                      <form
                        onSubmit={ruleForm.handleSubmit(onRuleSubmit)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={ruleForm.control}
                            name="ruleType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm text-muted-foreground">
                                  Тип
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11 border-0 bg-muted/50">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="percentage">Процент</SelectItem>
                                    <SelectItem value="fixed">Фикс. сумма</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={ruleForm.control}
                            name="ruleValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm text-muted-foreground">
                                  {ruleType === 'percentage' ? 'Процент' : 'Сумма'}
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      placeholder={ruleType === 'percentage' ? '10' : '5000'}
                                      {...field}
                                      className="h-11 border-0 bg-muted/50 pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                      {ruleType === 'percentage' ? '%' : '₽'}
                                    </span>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={ruleForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-3">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded"
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer text-sm">
                                Правило активно
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-3">
                          {activeRule && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-10"
                              onClick={handleDeleteRule}
                              disabled={deleteRule.isPending}
                            >
                              Удалить
                            </Button>
                          )}
                          <div className="flex flex-1 gap-3">
                            {(isEditingRule || activeRule) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="flex-1 h-10"
                                onClick={() => {
                                  ruleForm.reset()
                                  setIsEditingRule(false)
                                }}
                              >
                                Отмена
                              </Button>
                            )}
                            <Button
                              type="submit"
                              size="sm"
                              className="flex-1 h-10"
                              disabled={createRule.isPending || updateRule.isPending}
                            >
                              {createRule.isPending || updateRule.isPending
                                ? 'Сохранение...'
                                : activeRule
                                  ? 'Сохранить'
                                  : 'Создать'}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Тип</span>
                        <Badge variant="secondary">
                          {activeRule.rule_type === 'percentage' ? 'Процент' : 'Фикс. сумма'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Значение</span>
                        <span className="font-semibold">
                          {activeRule.rule_type === 'percentage'
                            ? `${activeRule.value}%`
                            : `${formatMoney(activeRule.value || 0)} ₽`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Статус</span>
                        <Badge variant={activeRule.is_active ? 'default' : 'secondary'}>
                          {activeRule.is_active ? 'Активно' : 'Неактивно'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {!activeRule && !isEditingRule && (
                    <Button
                      variant="outline"
                      className="w-full h-11 border-dashed mt-4"
                      onClick={() => setIsEditingRule(true)}
                    >
                      Добавить правило
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Dialogs */}
      <ContributionDialog
        fund={fundBalance}
        open={contributionOpen}
        onOpenChange={setContributionOpen}
      />
      <WithdrawalDialog
        fund={fundBalance}
        open={withdrawalOpen}
        onOpenChange={setWithdrawalOpen}
      />
      <BuyAssetDialog
        fund={fundBalance}
        open={buyAssetOpen}
        onOpenChange={setBuyAssetOpen}
      />
      <DepositToFundDialog
        fund={fundBalance}
        open={depositFromAccountOpen}
        onOpenChange={setDepositFromAccountOpen}
      />
      <TransferAssetDialog
        fund={fundBalance}
        open={transferAssetOpen}
        onOpenChange={setTransferAssetOpen}
      />
      <SetInitialBalanceDialog
        fund={fundBalance}
        open={setInitialBalanceOpen}
        onOpenChange={setSetInitialBalanceOpen}
      />
    </div>
  )
}
