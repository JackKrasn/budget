import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { parseISO } from 'date-fns'
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  Landmark,
  Wallet,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AccountIcon } from '@/components/ui/account-icon'
import { getIconByName } from '@/lib/icon-registry'
import type { ExpenseListRow } from '@/lib/api/types'
import { CURRENCY_SYMBOLS } from '@/types'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatExpenseAmount(expense: ExpenseListRow): { main: string; secondary?: string } {
  const currency = expense.currency || 'RUB'

  if (currency === 'RUB') {
    return { main: `-${formatMoney(expense.amount)} ₽` }
  }

  // Для валютных расходов показываем сумму в валюте и в рублях
  const currencySymbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency
  return {
    main: `-${currencySymbol}${formatMoney(expense.amount)}`,
    secondary: expense.amountBase ? `≈ ${formatMoney(expense.amountBase)} ₽` : undefined,
  }
}

function formatDate(date: string): string {
  return parseISO(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

// Компонент для отображения финансирования из фондов с тултипом
function FundingIndicator({ expense }: { expense: ExpenseListRow }) {
  const navigate = useNavigate()
  const allocations = expense.fundAllocations ?? []

  if (allocations.length === 0 && expense.fundedAmount <= 0) {
    return null
  }

  const isFullyFunded = expense.fundedAmount >= expense.amount

  const handleFundClick = (e: React.MouseEvent, fundId: string) => {
    e.stopPropagation()
    navigate(`/funds/${fundId}`)
  }

  // Если есть детализация по фондам — показываем тултип
  if (allocations.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              <Landmark className="h-3.5 w-3.5 text-emerald-600" />
              {allocations.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  ×{allocations.length}
                </span>
              )}
              {allocations.length === 1 && (
                <button
                  type="button"
                  onClick={(e) => handleFundClick(e, allocations[0].fundId)}
                  className="flex items-center gap-1 hover:underline"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: allocations[0].fundColor }}
                  />
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                    {allocations[0].fundName}
                  </span>
                </button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium text-sm">Финансирование из фондов</p>
              <p className="text-xs text-muted-foreground">Нажмите на фонд для подробностей</p>
              {allocations.map((alloc) => (
                <button
                  key={alloc.id}
                  type="button"
                  onClick={(e) => handleFundClick(e, alloc.fundId)}
                  className="flex items-center justify-between gap-4 w-full hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: alloc.fundColor }}
                    />
                    <span className="text-sm hover:underline">{alloc.fundName}</span>
                  </div>
                  <span className="font-mono text-sm">
                    {formatMoney(alloc.amount)} ₽
                  </span>
                </button>
              ))}
              <div className="border-t border-border/50 pt-2 flex justify-between text-sm">
                <span>Итого из фондов:</span>
                <span className="font-medium">
                  {formatMoney(expense.fundedAmount)} ₽
                </span>
              </div>
              {!isFullyFunded && (
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Из бюджета:</span>
                  <span>
                    {formatMoney(expense.amount - expense.fundedAmount)} ₽
                  </span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Если нет детализации, но есть fundedAmount — показываем простой бейдж
  return (
    <Badge variant="secondary" className="text-xs shrink-0 gap-1">
      <Wallet className="h-3 w-3" />
      {formatMoney(expense.fundedAmount)} ₽
    </Badge>
  )
}

interface ExpenseCardProps {
  expense: ExpenseListRow
  onEdit?: () => void
  onDelete?: () => void
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const Icon = getIconByName(expense.categoryIcon)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5">
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
          style={{
            background: `linear-gradient(135deg, ${expense.categoryColor} 0%, transparent 60%)`,
          }}
        />

        <CardContent className="relative p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Icon and Category */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${expense.categoryColor}20` }}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: expense.categoryColor }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">
                    {expense.categoryName}
                  </h3>
                  <FundingIndicator expense={expense} />
                </div>
                {(expense.description || (expense.tags && expense.tags.length > 0)) && (
                  <div className="flex items-center gap-2 mt-0.5">
                    {expense.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {expense.description}
                      </p>
                    )}
                    {expense.tags && expense.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 shrink-0">
                        {expense.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs px-2 py-0"
                            style={{
                              borderColor: tag.color,
                              color: tag.color,
                              backgroundColor: `${tag.color}10`,
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(expense.date)}
                </p>
              </div>
            </div>

            {/* Amount and Actions */}
            <div className="flex items-start gap-2">
              <div className="text-right">
                {(() => {
                  const amount = formatExpenseAmount(expense)
                  return (
                    <>
                      <p className="font-semibold tabular-nums text-lg">
                        {amount.main}
                      </p>
                      {amount.secondary && (
                        <p className="text-xs text-muted-foreground">
                          {amount.secondary}
                        </p>
                      )}
                    </>
                  )
                })()}
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Account info for display
interface AccountInfo {
  name: string
  bankName?: string | null
  typeCode?: string | null
  color?: string | null
}

// Compact row version for list view
interface ExpenseRowProps {
  expense: ExpenseListRow
  account?: AccountInfo
  onEdit?: () => void
  onDelete?: () => void
}

export function ExpenseRow({ expense, account, onEdit, onDelete }: ExpenseRowProps) {
  const Icon = getIconByName(expense.categoryIcon)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group relative flex items-center gap-4 rounded-lg border border-border/30 bg-background/50 p-3 pl-4 transition-all hover:border-border/60 hover:bg-background/80 hover:shadow-sm"
    >
      {/* Subtle left accent - red for expenses */}
      <div
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-red-500/40 group-hover:bg-red-500/60 transition-colors"
      />

      {/* Icon - red theme for expenses */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10"
      >
        <Icon className="h-4 w-4 text-red-500" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{expense.categoryName}</span>
          <FundingIndicator expense={expense} />
        </div>
        {(expense.description || (expense.tags && expense.tags.length > 0)) && (
          <div className="flex items-center gap-2 mt-0.5">
            {expense.description && (
              <p className="text-sm text-muted-foreground truncate">
                {expense.description}
              </p>
            )}
            {expense.tags && expense.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 shrink-0">
                {expense.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-xs px-1.5 py-0"
                    style={{
                      borderColor: tag.color,
                      color: tag.color,
                      backgroundColor: `${tag.color}10`,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account */}
      {account && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
          <AccountIcon
            bankName={account.bankName}
            typeCode={account.typeCode}
            color={account.color}
            size="sm"
            showBackground={false}
          />
          <span className="truncate max-w-[100px]">{account.name}</span>
        </div>
      )}

      {/* Amount */}
      <div className="shrink-0 w-32 text-right">
        {(() => {
          const amount = formatExpenseAmount(expense)
          return (
            <>
              <span className="font-semibold tabular-nums">{amount.main}</span>
              {amount.secondary && (
                <p className="text-xs text-muted-foreground">{amount.secondary}</p>
              )}
            </>
          )
        })()}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
    </motion.div>
  )
}
