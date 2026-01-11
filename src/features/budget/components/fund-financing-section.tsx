import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Check, X, Wallet, Plus, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FundIcon } from '@/components/common'
import { cn } from '@/lib/utils'
import type { FundBalance } from '@/lib/api/types'

export interface FundFinancing {
  fundId: string
  fundName: string
  fundIcon: string
  fundColor: string
  availableAmount: number // Сколько есть в фонде
  plannedAmount: number // Сколько планируем использовать
  usedAmount: number // Сколько уже использовано
}

interface FundFinancingSectionProps {
  funds: FundFinancing[]
  onUpdate: (fundId: string, plannedAmount: number) => Promise<void>
  onAddFund?: () => void
  isPending?: boolean
  /** Скрыть обёртку Card (когда используется внутри CollapsibleSection) */
  hideWrapper?: boolean
}

export function FundFinancingSection({
  funds,
  onUpdate,
  onAddFund,
  isPending,
  hideWrapper,
}: FundFinancingSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const totals = funds.reduce(
    (acc, fund) => ({
      available: acc.available + fund.availableAmount,
      planned: acc.planned + fund.plannedAmount,
      used: acc.used + fund.usedAmount,
      remainingInFund: acc.remainingInFund + (fund.availableAmount - fund.plannedAmount),
    }),
    { available: 0, planned: 0, used: 0, remainingInFund: 0 }
  )

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const handleStartEdit = (fundId: string, currentValue: number) => {
    setEditingId(fundId)
    setEditValue(String(currentValue))
  }

  const handleSave = async (fundId: string) => {
    const amount = parseFloat(editValue) || 0
    await onUpdate(fundId, amount)
    setEditingId(null)
    setEditValue('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, fundId: string) => {
    if (e.key === 'Enter') {
      handleSave(fundId)
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  // Empty state content
  const emptyContent = (
    <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/30">
      <p className="text-sm text-muted-foreground">
        Нет доступных фондов для финансирования
      </p>
      {onAddFund && (
        <Button variant="outline" size="sm" onClick={onAddFund}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить фонд
        </Button>
      )}
    </div>
  )

  if (funds.length === 0) {
    if (hideWrapper) {
      return <div>{emptyContent}</div>
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Финансирование из фондов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emptyContent}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const tableContent = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[200px]">Фонд</TableHead>
          <TableHead className="w-[120px] text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help">
                  Доступно
                  <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p>Текущий баланс фонда — сколько денег есть в фонде прямо сейчас</p>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="w-[120px] text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help">
                  План
                  <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p>Сколько планируете потратить из этого фонда в этом месяце</p>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="w-[120px] text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help">
                  После плана
                  <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p>Сколько останется в фонде после выполнения плана (Доступно − План)</p>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="w-[120px] text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help">
                  Использовано
                  <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p>Сколько уже фактически потрачено из фонда в этом месяце</p>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="w-[120px] text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help">
                  Остаток
                  <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p>Сколько ещё можно потратить в рамках плана (План − Использовано)</p>
              </TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {funds.map((fund) => {
          const isEditing = editingId === fund.fundId
          const remaining = fund.plannedAmount - fund.usedAmount
          const isOverused = remaining < 0
          const remainingInFund = fund.availableAmount - fund.plannedAmount
          const isOverPlanned = remainingInFund < 0

          return (
            <TableRow key={fund.fundId} className="group">
              <TableCell>
                <div className="flex items-center gap-3">
                  <FundIcon
                    name={fund.fundName}
                    iconName={fund.fundIcon}
                    color={fund.fundColor}
                    size="md"
                  />
                  <span className="font-medium">{fund.fundName}</span>
                </div>
              </TableCell>

              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatMoney(fund.availableAmount)} ₽
              </TableCell>

              <TableCell className="text-right">
                {isEditing ? (
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, fund.fundId)}
                    className="h-8 w-24 text-right ml-auto"
                    autoFocus
                  />
                ) : (
                  <span
                    className={cn(
                      'tabular-nums',
                      fund.plannedAmount === 0 && 'text-muted-foreground'
                    )}
                  >
                    {formatMoney(fund.plannedAmount)} ₽
                  </span>
                )}
              </TableCell>

              <TableCell className="text-right">
                <span
                  className={cn(
                    'tabular-nums',
                    isOverPlanned
                      ? 'text-destructive font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {formatMoney(remainingInFund)} ₽
                </span>
              </TableCell>

              <TableCell className="text-right tabular-nums">
                {formatMoney(fund.usedAmount)} ₽
              </TableCell>

              <TableCell className="text-right">
                <span
                  className={cn(
                    'tabular-nums font-medium',
                    isOverused
                      ? 'text-destructive'
                      : remaining > 0
                        ? 'text-emerald-500'
                        : 'text-muted-foreground'
                  )}
                >
                  {remaining > 0 ? '+' : ''}
                  {formatMoney(remaining)} ₽
                </span>
              </TableCell>

              <TableCell>
                {isEditing ? (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleSave(fund.fundId)}
                      disabled={isPending}
                    >
                      <Check className="h-4 w-4 text-emerald-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() =>
                      handleStartEdit(fund.fundId, fund.plannedAmount)
                    }
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50 font-semibold">
          <TableCell>Итого из фондов</TableCell>
          <TableCell className="text-right tabular-nums text-muted-foreground">
            {formatMoney(totals.available)} ₽
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatMoney(totals.planned)} ₽
          </TableCell>
          <TableCell className="text-right">
            <span
              className={cn(
                'tabular-nums',
                totals.remainingInFund < 0
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
            >
              {formatMoney(totals.remainingInFund)} ₽
            </span>
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatMoney(totals.used)} ₽
          </TableCell>
          <TableCell className="text-right">
            <span
              className={cn(
                'tabular-nums',
                totals.planned - totals.used < 0
                  ? 'text-destructive'
                  : 'text-emerald-500'
              )}
            >
              {formatMoney(totals.planned - totals.used)} ₽
            </span>
          </TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )

  if (hideWrapper) {
    return <div>{tableContent}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Финансирование из фондов
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {tableContent}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Хелпер для преобразования FundBalance в FundFinancing
export function mapFundBalanceToFinancing(
  fundBalance: FundBalance,
  plannedAmount: number = 0,
  usedAmount: number = 0
): FundFinancing {
  return {
    fundId: fundBalance.fund.id,
    fundName: fundBalance.fund.name,
    fundIcon: fundBalance.fund.icon,
    fundColor: fundBalance.fund.color,
    availableAmount: fundBalance.totalRub,
    plannedAmount,
    usedAmount,
  }
}
