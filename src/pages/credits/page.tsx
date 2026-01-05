import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, CreditCard, TrendingUp, Wallet, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CreditCard as CreditCardComponent,
  CreateCreditDialog,
  EditCreditDialog,
} from '@/features/credits/components'
import {
  useCredits,
  useAllCreditsSummary,
  useDeleteCredit,
  useCreditSummary,
} from '@/features/credits'
import type { CreditStatus, CreditListRow } from '@/lib/api/credits'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Компонент для отображения сводки по всем кредитам
function CreditsSummaryCards() {
  const { data: summary, isLoading } = useAllCreditsSummary()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!summary) return null

  const cards = [
    {
      title: 'Всего кредитов',
      value: summary.totalCredits,
      icon: CreditCard,
      color: '#3b82f6',
      format: (v: number) => v.toString(),
    },
    {
      title: 'Общая сумма',
      value: summary.totalPrincipal,
      icon: Wallet,
      color: '#8b5cf6',
      format: (v: number) => `${formatMoney(v)} ₽`,
    },
    {
      title: 'Осталось погасить',
      value: summary.totalRemaining,
      icon: TrendingUp,
      color: '#f59e0b',
      format: (v: number) => `${formatMoney(v)} ₽`,
    },
    {
      title: 'Выплачено процентов',
      value: summary.totalInterestPaid,
      icon: TrendingUp,
      color: '#10b981',
      format: (v: number) => `${formatMoney(v)} ₽`,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: card.color }} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold tabular-nums">{card.format(card.value)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// Wrapper для получения summary каждого кредита
function CreditCardWithSummary({
  credit,
  onEdit,
  onDelete,
  onClick,
}: {
  credit: CreditListRow
  onEdit: () => void
  onDelete: () => void
  onClick: () => void
}) {
  const { data: summary } = useCreditSummary(credit.id)

  return (
    <CreditCardComponent
      credit={credit}
      summary={summary}
      onEdit={onEdit}
      onDelete={onDelete}
      onClick={onClick}
    />
  )
}

export default function CreditsPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<CreditStatus | 'all'>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingCredit, setEditingCredit] = useState<CreditListRow | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { data: creditsData, isLoading, error } = useCredits(
    statusFilter === 'all' ? undefined : statusFilter
  )
  const deleteCredit = useDeleteCredit()

  const credits = creditsData?.data ?? []

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот кредит?')) {
      await deleteCredit.mutateAsync(id)
    }
  }

  const handleCreditClick = (credit: CreditListRow) => {
    navigate(`/credits/${credit.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Кредиты</h1>
          <p className="text-muted-foreground">Управление кредитами и платежами</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить кредит
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <CreditsSummaryCards />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4"
      >
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as CreditStatus | 'all')}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="completed">Погашенные</SelectItem>
            <SelectItem value="cancelled">Отменённые</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ошибка при загрузке кредитов: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-2 w-full mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Credits List */}
      {!isLoading && credits.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <CreditCard className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет кредитов</h3>
          <p className="text-muted-foreground mb-4">
            {statusFilter === 'all'
              ? 'Создайте первый кредит для начала отслеживания платежей'
              : 'Нет кредитов с выбранным статусом'}
          </p>
          {statusFilter === 'all' && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить кредит
            </Button>
          )}
        </motion.div>
      )}

      {!isLoading && credits.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {credits.map((credit) => (
            <CreditCardWithSummary
              key={credit.id}
              credit={credit}
              onEdit={() => {
                setEditingCredit(credit)
                setEditDialogOpen(true)
              }}
              onDelete={() => handleDelete(credit.id)}
              onClick={() => handleCreditClick(credit)}
            />
          ))}
        </motion.div>
      )}

      {/* Create Credit Dialog */}
      <CreateCreditDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Edit Credit Dialog */}
      <EditCreditDialog
        credit={editingCredit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  )
}
