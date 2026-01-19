import { motion } from 'framer-motion'
import {
  MoreHorizontal,
  Archive,
  Pencil,
  Trash2,
  RefreshCw,
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
import { AccountIcon } from '@/components/ui/account-icon'
import type { AccountWithType } from '@/lib/api'
import { cn } from '@/lib/utils'
import { getBankByName } from '@/lib/banks'

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GEL: '₾',
  TRY: '₺',
}

interface AccountCardProps {
  account: AccountWithType
  onEdit?: () => void
  onArchive?: () => void
  onDelete?: () => void
  onSyncBalance?: () => void
}

export function AccountCard({
  account,
  onEdit,
  onArchive,
  onDelete,
  onSyncBalance,
}: AccountCardProps) {
  const currencySymbol = CURRENCY_SYMBOLS[account.currency] || account.currency
  const typeName = account.type_name || 'Загрузка...'
  const bank = account.bank_name ? getBankByName(account.bank_name) : undefined

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
          account.is_archived && 'opacity-60'
        )}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
          style={{
            background: `linear-gradient(135deg, ${account.color || '#10b981'} 0%, transparent 60%)`,
          }}
        />

        <CardContent className="relative p-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <AccountIcon
                bankName={account.bank_name}
                typeCode={account.type_code}
                color={account.color}
                size="lg"
                className="group-hover:scale-105"
              />
              <div>
                <h3 className="font-semibold">{account.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {typeName}
                  </Badge>
                  {account.is_archived && (
                    <Badge variant="outline" className="text-xs">
                      В архиве
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
                <DropdownMenuItem onClick={onSyncBalance}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Синхронизировать баланс
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  {account.is_archived ? 'Восстановить' : 'В архив'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
          <div className="mb-3 rounded-lg bg-background/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Баланс</p>
            <p className="text-2xl font-bold tabular-nums">
              {account.current_balance.toLocaleString('ru-RU', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-lg">{currencySymbol}</span>
            </p>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Валюта</span>
              <span className="font-medium">
                {account.currency} {currencySymbol}
              </span>
            </div>
            {account.bank_name && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Банк</span>
                <div className="flex items-center gap-2">
                  {bank && (
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      className="h-4 w-4 object-contain"
                    />
                  )}
                  <span className="font-medium">{account.bank_name}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
