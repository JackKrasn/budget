import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertCircle,
  Pencil,
  MoreVertical,
  Archive,
  Trash2,
  CreditCard,
  Receipt,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AccountIcon } from '@/components/ui/account-icon'
import {
  useAccount,
  useUpdateAccount,
  useDeleteAccount,
  EditAccountDialog,
  CreditCardReservesList,
  RepayCreditCardDialog,
} from '@/features/accounts'
import { useExpenses, ExpenseRow } from '@/features/expenses'

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


export default function AccountDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [repayDialogOpen, setRepayDialogOpen] = useState(false)

  const { data: account, isLoading, error } = useAccount(id!)
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  // Загружаем последние расходы по счёту
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({
    account_id: id,
  })

  const handleArchive = () => {
    if (!account) return
    updateAccount.mutate({
      id: account.id,
      data: { isArchived: !account.is_archived },
    })
  }

  const handleDelete = () => {
    if (!account) return
    if (confirm('Вы уверены, что хотите удалить этот счёт?')) {
      deleteAccount.mutate(account.id, {
        onSuccess: () => navigate('/accounts'),
      })
    }
  }

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>ID счёта не указан</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ошибка при загрузке счёта: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading || !account) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  const currencySymbol = CURRENCY_SYMBOLS[account.currency] || account.currency

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Button variant="ghost" onClick={() => navigate('/accounts')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к счетам
        </Button>

        {/* Hero Section with gradient */}
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-8"
          style={{
            background: `linear-gradient(135deg, ${account.color || '#10b981'}15 0%, ${account.color || '#10b981'}05 50%, transparent 100%)`,
          }}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
              style={{ backgroundColor: `${account.color || '#10b981'}30` }}
            />
            <div
              className="absolute -left-16 bottom-0 h-40 w-40 rounded-full blur-3xl"
              style={{ backgroundColor: `${account.color || '#10b981'}20` }}
            />
          </div>

          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              >
                <AccountIcon
                  bankName={account.bank_name}
                  typeCode={account.type_code}
                  color={account.color}
                  size="lg"
                  showBackground
                />
              </motion.div>
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 mb-1"
                >
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    {account.name}
                  </h1>
                  {account.is_credit && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10">
                      Кредитная карта
                    </Badge>
                  )}
                  {account.is_archived && (
                    <Badge variant="secondary">В архиве</Badge>
                  )}
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-muted-foreground"
                >
                  {account.bank_name || account.type_name} · {account.currency}
                </motion.p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-end gap-3"
            >
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Текущий баланс</p>
                <div className="flex items-baseline gap-2">
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                    className={`text-4xl font-bold tabular-nums tracking-tight ${
                      account.current_balance < 0 ? 'text-destructive' : ''
                    }`}
                  >
                    {formatMoney(account.current_balance)}
                  </motion.span>
                  <span className="text-2xl font-medium text-muted-foreground">
                    {currencySymbol}
                  </span>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2"
              >
                {account.is_credit && account.current_balance < 0 && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setRepayDialogOpen(true)}
                  >
                    <CreditCard className="h-4 w-4" />
                    Погасить
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 bg-background/50 backdrop-blur-sm"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Редактировать
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-background/50 backdrop-blur-sm"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleArchive}>
                      <Archive className="mr-2 h-4 w-4" />
                      {account.is_archived ? 'Разархивировать' : 'В архив'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid gap-6 md:grid-cols-2"
      >
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Тип счёта</span>
              <span className="font-medium">
                {account.is_credit ? 'Кредитная карта' : account.type_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Валюта</span>
              <span className="font-medium">{account.currency}</span>
            </div>
            {account.bank_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Банк</span>
                <span className="font-medium">{account.bank_name}</span>
              </div>
            )}
            {account.linked_fund_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Фонд для резервирования</span>
                <Badge variant="outline">Привязан</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-24 flex-col items-center justify-center rounded-xl bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                Здесь будет статистика по счёту
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Credit Card Reserves Section */}
      {account.is_credit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <CreditCardReservesList account={account} />
        </motion.div>
      )}

      {/* Account Expenses Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Расходы по счёту
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/expenses?accountId=${account.id}`}>
                  Все расходы
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : !expensesData?.data?.length ? (
              <div className="flex h-24 flex-col items-center justify-center rounded-xl bg-muted/30 text-center">
                <Receipt className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Нет расходов по этому счёту
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {expensesData.data.slice(0, 10).map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    account={{
                      name: account.name,
                      bankName: account.bank_name,
                      typeCode: account.type_code,
                      color: account.color,
                    }}
                  />
                ))}
                {expensesData.data.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    И ещё {expensesData.data.length - 10} расходов...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <EditAccountDialog
        account={account}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Repay Dialog */}
      {account.is_credit && (
        <RepayCreditCardDialog
          creditCard={account}
          open={repayDialogOpen}
          onOpenChange={setRepayDialogOpen}
        />
      )}
    </div>
  )
}
