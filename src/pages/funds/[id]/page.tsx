import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
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
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  History,
  BarChart3,
  ArrowLeft,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useFund,
  useUpdateFund,
  useFundHistory,
  useFundDistributionRules,
  useCreateDistributionRule,
  useUpdateDistributionRule,
  useDeleteDistributionRule,
  useDeleteContribution,
  ContributionDialog,
  WithdrawalDialog,
} from '@/features/funds'
import type { FundStatus, RuleType, FundBalance } from '@/lib/api/types'

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
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export default function FundDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingRule, setIsEditingRule] = useState(false)
  const [contributionOpen, setContributionOpen] = useState(false)
  const [withdrawalOpen, setWithdrawalOpen] = useState(false)
  const [deletingContributionId, setDeletingContributionId] = useState<string | null>(null)

  const { data: fund, isLoading, error } = useFund(id!)
  const updateFund = useUpdateFund()
  const { data: historyData, isLoading: isLoadingHistory } = useFundHistory(id!)
  const { data: rulesData } = useFundDistributionRules(id!)
  const createRule = useCreateDistributionRule()
  const updateRule = useUpdateDistributionRule()
  const deleteRule = useDeleteDistributionRule()
  const deleteContribution = useDeleteContribution()

  const activeRule = rulesData?.data?.find((r) => r.is_active)

  const fundData = fund?.fund
  const totalBase = fund?.totalBase ?? 0
  const baseCurrency = fund?.baseCurrency ?? 'RUB'
  const assets = fund?.assets ?? []

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
        transition={{ duration: 0.3 }}
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
          <div className="absolute inset-0 opacity-30">
            <div
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
              style={{ backgroundColor: `${fundData.color}30` }}
            />
            <div
              className="absolute -left-16 bottom-0 h-40 w-40 rounded-full blur-3xl"
              style={{ backgroundColor: `${fundData.color}20` }}
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
                <div className="flex items-center gap-3 mb-1">
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
                </div>
                {activeRule && (
                  <p className="text-sm text-muted-foreground">
                    {activeRule.rule_type === 'percentage'
                      ? `${activeRule.value}% от дохода`
                      : `${formatMoney(activeRule.value || 0)} ₽ фиксированно`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Баланс</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums tracking-tight">
                    {formatMoney(totalBase)}
                  </span>
                  <span className="text-2xl font-medium text-muted-foreground">₽</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  style={{ backgroundColor: '#10b981' }}
                  onClick={() => setContributionOpen(true)}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Пополнить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setWithdrawalOpen(true)}
                >
                  <ArrowDownRight className="h-4 w-4" />
                  Списать
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
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
            {/* Assets */}
            <Card className="md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Активы в фонде</CardTitle>
              </CardHeader>
              <CardContent>
                {assets.length > 0 ? (
                  <div className="space-y-3">
                    {assets.map((asset, index) => (
                      <motion.div
                        key={asset.asset.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between rounded-xl bg-muted/50 p-4"
                      >
                        <div>
                          <p className="font-medium">{asset.asset.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {asset.asset.ticker || asset.asset.typeCode}
                          </p>
                        </div>
                        <div className="text-right">
                          {asset.asset.typeCode === 'currency' ? (
                            <>
                              <p className="font-semibold tabular-nums">
                                {formatMoney(asset.amount)} {asset.asset.currency}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ≈ {formatMoney(asset.valueBase)} ₽
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold tabular-nums">
                                {formatMoney(asset.valueBase)} ₽
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {asset.amount} шт. × {formatMoney(asset.amount > 0 ? asset.valueBase / asset.amount : 0)} ₽
                              </p>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/30 text-center">
                    <Wallet className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Нет активов в фонде</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribution Rule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Распределение</CardTitle>
              </CardHeader>
              <CardContent>
                {activeRule ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Тип</span>
                      <Badge variant="secondary">
                        {activeRule.rule_type === 'percentage' ? 'Процент' : 'Фикс. сумма'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Значение</span>
                      <span className="font-semibold">
                        {activeRule.rule_type === 'percentage'
                          ? `${activeRule.value}%`
                          : `${formatMoney(activeRule.value || 0)} ₽`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Статус</span>
                      <Badge variant={activeRule.is_active ? 'default' : 'secondary'}>
                        {activeRule.is_active ? 'Активно' : 'Неактивно'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-24 flex-col items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">
                      Правило не настроено
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">История операций</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Contributions */}
                  {historyData?.contributions?.map((c, index) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                        <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">
                          +{formatMoney(c.total_amount)} {c.currency}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(c.date)}
                          {c.note && ` • ${c.note}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        disabled={deletingContributionId === c.id}
                        onClick={() => {
                          if (confirm('Удалить это пополнение? Баланс фонда будет уменьшен.')) {
                            setDeletingContributionId(c.id)
                            deleteContribution.mutate(
                              { fundId: id!, contributionId: c.id },
                              { onSettled: () => setDeletingContributionId(null) }
                            )
                          }
                        }}
                      >
                        {deletingContributionId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                  ))}

                  {/* Withdrawals */}
                  {historyData?.withdrawals?.map((w, index) => (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
                        <ArrowDownRight className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-red-600 dark:text-red-400">
                          -{formatMoney(w.total_amount)} {w.currency}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(w.date)} • {w.purpose}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {(!historyData?.contributions?.length && !historyData?.withdrawals?.length) && (
                    <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-muted/30 text-center">
                      <History className="mb-2 h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">История операций пуста</p>
                    </div>
                  )}
                </div>
              )}
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
    </div>
  )
}
