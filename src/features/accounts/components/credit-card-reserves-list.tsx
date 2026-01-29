import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCardReserveRow } from './credit-card-reserve-row'
import { ApplyReservesDialog } from './apply-reserves-dialog'
import { useCreditCardReserves } from '../hooks'
import type { AccountWithType } from '@/lib/api/types'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface CreditCardReservesListProps {
  account: AccountWithType
}

export function CreditCardReservesList({ account }: CreditCardReservesListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)

  const { data, isLoading, error } = useCreditCardReserves(account.id)

  const reserves = data?.data ?? []
  const totalPending = data?.totalPending ?? 0

  // Calculate selected amount (use remaining, not full amount)
  const selectedAmount = useMemo(() => {
    return reserves
      .filter((r) => selectedIds.has(r.id))
      .reduce((sum, r) => sum + r.remaining, 0)
  }, [reserves, selectedIds])

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(reserves.map((r) => r.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleApplySuccess = () => {
    setSelectedIds(new Set())
  }

  // Only show for credit cards
  if (!account.is_credit) {
    return null
  }

  // Show nothing if no linked fund (reserves won't be created)
  if (!account.linked_fund_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Резервы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Для автоматического резервирования привяжите фонд к кредитной карте в настройках счёта.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Резервы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Резервы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ошибка при загрузке резервов: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Резервы
            </CardTitle>
            {reserves.length > 0 && (
              <Badge variant="secondary" className="font-mono">
                {reserves.length}
              </Badge>
            )}
          </div>
          {reserves.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Ожидает</p>
              <p className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                {formatMoney(totalPending)} ₽
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reserves.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-24 flex-col items-center justify-center rounded-xl bg-muted/30 text-center"
          >
            <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500/50" />
            <p className="text-sm text-muted-foreground">Нет ожидающих резервов</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Select all header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedIds.size === reserves.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Выбрать все</span>
              </label>
              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-sm text-muted-foreground">
                      Выбрано: <span className="font-medium">{formatMoney(selectedAmount)} ₽</span>
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setApplyDialogOpen(true)}
                      className="gap-2"
                    >
                      <Wallet className="h-4 w-4" />
                      Применить резервы
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reserves list */}
            <div className="space-y-2">
              {reserves.map((reserve) => (
                <CreditCardReserveRow
                  key={reserve.id}
                  reserve={reserve}
                  isSelected={selectedIds.has(reserve.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Apply Reserves Dialog */}
      <ApplyReservesDialog
        creditCardId={account.id}
        selectedReserveIds={Array.from(selectedIds)}
        selectedAmount={selectedAmount}
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        onSuccess={handleApplySuccess}
      />
    </Card>
  )
}
