import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, CreditCard, AlertCircle, Loader2, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useAccounts,
  useDeleteAccount,
  useUpdateAccount,
  AccountCard,
  CreateAccountDialog,
  EditAccountDialog,
  SyncBalanceDialog,
  TransferDialog,
} from '@/features/accounts'
import type { AccountWithType } from '@/lib/api/types'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function AccountsPage() {
  const [editAccount, setEditAccount] = useState<AccountWithType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [syncAccount, setSyncAccount] = useState<AccountWithType | null>(null)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)

  const { data, isLoading, error } = useAccounts()
  const deleteAccount = useDeleteAccount()
  const updateAccount = useUpdateAccount()

  const accounts = data?.data ?? []
  const activeAccounts = accounts.filter((a) => !a.is_archived)
  const archivedAccounts = accounts.filter((a) => a.is_archived)
  const totalBalance = data?.totalBalance ?? 0

  const handleEdit = (account: AccountWithType) => {
    setEditAccount(account)
    setEditDialogOpen(true)
  }

  const handleArchive = (id: string, isArchived: boolean) => {
    updateAccount.mutate({
      id,
      data: { isArchived: !isArchived },
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот счёт?')) {
      deleteAccount.mutate(id)
    }
  }

  const handleSyncBalance = (account: AccountWithType) => {
    setSyncAccount(account)
    setSyncDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Счета
          </h1>
          <p className="mt-1 text-muted-foreground">
            Банковские карты, наличные и депозиты
          </p>
        </div>
        <div className="flex gap-2">
          <TransferDialog>
            <Button variant="outline">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Перевод
            </Button>
          </TransferDialog>
          <CreateAccountDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Новый счёт
            </Button>
          </CreateAccountDialog>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего счетов</p>
                <p className="text-xl font-bold tabular-nums">
                  {activeAccounts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CreditCard className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Общий баланс</p>
                <p className="text-xl font-bold tabular-nums">
                  {totalBalance.toLocaleString('ru-RU', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Ошибка загрузки: {error.message}
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Active Accounts */}
      {!isLoading && !error && (
        <>
          {activeAccounts.length > 0 ? (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {activeAccounts.map((account) => (
                <motion.div key={account.id} variants={item}>
                  <AccountCard
                    account={account}
                    onEdit={() => handleEdit(account)}
                    onArchive={() => handleArchive(account.id, account.is_archived)}
                    onDelete={() => handleDelete(account.id)}
                    onSyncBalance={() => handleSyncBalance(account)}
                  />
                </motion.div>
              ))}

              {/* Add New Account Card */}
              <motion.div variants={item}>
                <CreateAccountDialog>
                  <Card className="flex h-full min-h-[180px] cursor-pointer items-center justify-center border-dashed border-border/50 bg-card/30 transition-all hover:border-border hover:bg-card/50">
                    <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-muted-foreground">
                        Добавить счёт
                      </p>
                    </CardContent>
                  </Card>
                </CreateAccountDialog>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30"
            >
              <CreditCard className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium">Нет счетов</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Добавьте первый счёт для начала работы
                </p>
              </div>
              <CreateAccountDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить счёт
                </Button>
              </CreateAccountDialog>
            </motion.div>
          )}

          {/* Archived Accounts */}
          {archivedAccounts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-muted-foreground">
                В архиве ({archivedAccounts.length})
              </h2>
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {archivedAccounts.map((account) => (
                  <motion.div key={account.id} variants={item}>
                    <AccountCard
                      account={account}
                      onEdit={() => handleEdit(account)}
                      onArchive={() => handleArchive(account.id, account.is_archived)}
                      onDelete={() => handleDelete(account.id)}
                      onSyncBalance={() => handleSyncBalance(account)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <EditAccountDialog
        account={editAccount}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Sync Balance Dialog */}
      <SyncBalanceDialog
        account={syncAccount}
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
      />
    </div>
  )
}
