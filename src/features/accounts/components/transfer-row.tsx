import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDeleteTransferDialog } from './confirm-delete-transfer-dialog'
import type { TransferWithAccounts } from '@/lib/api/types'

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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

function formatFullDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface TransferRowProps {
  transfer: TransferWithAccounts
  onDelete?: () => void
}

export function TransferRow({ transfer, onDelete }: TransferRowProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const fromCurrencySymbol = CURRENCY_SYMBOLS[transfer.from_currency] || transfer.from_currency
  const toCurrencySymbol = CURRENCY_SYMBOLS[transfer.to_currency] || transfer.to_currency
  const isDifferentCurrencies = transfer.from_currency !== transfer.to_currency

  // Calculate exchange rate for display
  const exchangeRate = isDifferentCurrencies && transfer.to_amount
    ? (transfer.amount / transfer.to_amount).toFixed(2)
    : null
  const reverseRate = exchangeRate
    ? (1 / parseFloat(exchangeRate) < 1
      ? (1 / parseFloat(exchangeRate)).toFixed(4)
      : (1 / parseFloat(exchangeRate)).toFixed(2))
    : null

  const handleDelete = () => {
    setDeleteDialogOpen(false)
    onDelete?.()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="group relative flex items-center gap-3 rounded-lg border border-border/30 bg-background/50 p-3 pl-4 transition-all hover:border-border/60 hover:bg-background/80 hover:shadow-sm cursor-pointer"
        onClick={() => setDetailsOpen(true)}
      >
        {/* Subtle left accent for transfers */}
        <div
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-blue-500/40 group-hover:bg-blue-500/60 transition-colors"
        />

        {/* Transfer direction indicator */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
          <ArrowRight className="h-4 w-4 text-blue-500" />
        </div>

        {/* From → To */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium truncate">{transfer.from_account_name}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="font-medium truncate">{transfer.to_account_name}</span>
          </div>
          {transfer.description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {transfer.description}
            </p>
          )}
        </div>

        {/* Date */}
        <span className="text-sm text-muted-foreground shrink-0 w-16 text-right">
          {formatDate(transfer.date)}
        </span>

        {/* Amount */}
        <div className="shrink-0 text-right">
          {isDifferentCurrencies ? (
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                −{formatMoney(transfer.amount + (transfer.fee_amount || 0))} {fromCurrencySymbol}
              </span>
              <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                +{formatMoney(transfer.to_amount || transfer.amount)} {toCurrencySymbol}
              </span>
            </div>
          ) : (
            <span className="font-semibold tabular-nums text-blue-600 dark:text-blue-400">
              {formatMoney(transfer.amount)} {fromCurrencySymbol}
              {transfer.fee_amount && transfer.fee_amount > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  (+{formatMoney(transfer.fee_amount)} комиссия)
                </span>
              )}
            </span>
          )}
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
            setDeleteDialogOpen(true)
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteTransferDialog
        transfer={transfer}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />

      {/* Transfer Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Детали перевода
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Direction */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                </div>
                <span className="font-medium">{transfer.from_account_name}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="font-medium">{transfer.to_account_name}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            </div>

            {/* Amounts */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Сумма списания</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  −{formatMoney(transfer.amount)} {fromCurrencySymbol}
                </span>
              </div>

              {isDifferentCurrencies && transfer.to_amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Сумма зачисления</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    +{formatMoney(transfer.to_amount)} {toCurrencySymbol}
                  </span>
                </div>
              )}

              {transfer.fee_amount && transfer.fee_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Комиссия</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    −{formatMoney(transfer.fee_amount)} {fromCurrencySymbol}
                  </span>
                </div>
              )}

              {transfer.fee_amount && transfer.fee_amount > 0 && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Всего списано</span>
                  <span className="font-semibold">
                    {formatMoney(transfer.amount + transfer.fee_amount)} {fromCurrencySymbol}
                  </span>
                </div>
              )}
            </div>

            {/* Exchange Rate */}
            {isDifferentCurrencies && exchangeRate && (
              <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Курс конвертации
                </div>
                <div className="text-sm">
                  <div>1 {toCurrencySymbol} = {exchangeRate} {fromCurrencySymbol}</div>
                  <div className="text-muted-foreground">
                    1 {fromCurrencySymbol} = {reverseRate} {toCurrencySymbol}
                  </div>
                </div>
              </div>
            )}

            {/* Date & Description */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Дата</span>
                <span>{formatFullDate(transfer.date)}</span>
              </div>

              {transfer.description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Описание</span>
                  <span className="text-right max-w-[200px]">{transfer.description}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
