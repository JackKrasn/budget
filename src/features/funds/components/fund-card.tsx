import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  Home,
  ShoppingBag,
  Calendar,
  Plane,
  MoreHorizontal,
  PiggyBank,
  Gift,
  Car,
  Briefcase,
  GraduationCap,
  Heart,
  Trash2,
  Pencil,
  Plus,
  Minus,
  Eye,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { FundBalance } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { useFundDistributionRules } from '../hooks'

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

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface FundCardProps {
  fund: FundBalance
  onView?: () => void
  onEdit?: () => void
  onDeposit?: () => void
  onWithdraw?: () => void
  onDelete?: () => void
}

export function FundCard({
  fund,
  onView,
  onEdit,
  onDeposit,
  onWithdraw,
  onDelete,
}: FundCardProps) {
  const { fund: fundData, totalRub, assets } = fund
  const Icon = FUND_ICONS[fundData.icon] || Wallet

  // Fetch distribution rules for this fund
  const { data: rulesData } = useFundDistributionRules(fundData.id)
  const activeRule = rulesData?.data?.find((r) => r.is_active)

  const ruleLabel = activeRule
    ? activeRule.rule_type === 'percentage'
      ? `${activeRule.value}%`
      : `${formatMoney(activeRule.value || 0)} ₽`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5',
          fundData.status === 'paused' && 'opacity-60'
        )}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
          style={{
            background: `linear-gradient(135deg, ${fundData.color} 0%, transparent 60%)`,
          }}
        />

        <CardContent className="relative p-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${fundData.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: fundData.color }} />
              </div>
              <div>
                <h3 className="font-semibold">{fundData.name}</h3>
                <div className="flex items-center gap-2">
                  {ruleLabel && (
                    <Badge variant="secondary" className="text-xs">
                      {ruleLabel}
                    </Badge>
                  )}
                  {fundData.is_virtual && (
                    <Badge variant="outline" className="text-xs">
                      Виртуальный
                    </Badge>
                  )}
                  {fundData.status === 'paused' && (
                    <Badge variant="outline" className="text-xs text-amber-500">
                      Приостановлен
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="mr-2 h-4 w-4" />
                  Подробнее
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDeposit}>
                  <Plus className="mr-2 h-4 w-4" />
                  Пополнить
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onWithdraw}>
                  <Minus className="mr-2 h-4 w-4" />
                  Списать
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Balance */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Баланс</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {formatMoney(totalRub)}{' '}
              <span className="text-lg text-muted-foreground">₽</span>
            </p>
          </div>

          {/* Assets summary */}
          {assets.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {assets.slice(0, 3).map((asset) => (
                <Badge
                  key={asset.asset.id}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {asset.asset.name}: {formatMoney(asset.amount)}{' '}
                  {asset.asset.currency}
                </Badge>
              ))}
              {assets.length > 3 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{assets.length - 3}
                </Badge>
              )}
            </div>
          )}

        </CardContent>
      </Card>
    </motion.div>
  )
}
