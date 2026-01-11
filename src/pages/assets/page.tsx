import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Coins, AlertCircle, Loader2, Landmark, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useAssets,
  useDeleteAsset,
  AssetCard,
  CreateAssetDialog,
  EditAssetDialog,
  UpdatePriceDialog,
} from '@/features/assets'
import {
  useDeposits,
  useMaturingDeposits,
  DepositCard,
  CreateDepositDialog,
  EditDepositDialog,
  DepositDetailsSheet,
  CloseDepositDialog,
  DeleteDepositDialog,
  DepositsSummaryCard,
} from '@/features/deposits'
import type { AssetWithType } from '@/lib/api/types'
import type { Deposit } from '@/lib/api'

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

export default function AssetsPage() {
  // Asset states
  const [editAsset, setEditAsset] = useState<AssetWithType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [priceAsset, setPriceAsset] = useState<AssetWithType | null>(null)
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)

  // Deposit states
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [isDepositDetailsOpen, setIsDepositDetailsOpen] = useState(false)
  const [isDepositEditOpen, setIsDepositEditOpen] = useState(false)
  const [isDepositCloseOpen, setIsDepositCloseOpen] = useState(false)
  const [isDepositDeleteOpen, setIsDepositDeleteOpen] = useState(false)

  // Fetch data
  const { data, isLoading, error } = useAssets()
  const deleteAsset = useDeleteAsset()
  const { data: depositsData, isLoading: isLoadingDeposits } = useDeposits({ status: 'active' })
  const { data: maturingData } = useMaturingDeposits({ days: 30 })

  const assets = data?.data ?? []
  const deposits = depositsData?.data ?? []
  const depositsSummary = depositsData?.summary
  const maturingDeposits = maturingData?.data ?? []

  // Asset handlers
  const handleEdit = (asset: AssetWithType) => {
    setEditAsset(asset)
    setEditDialogOpen(true)
  }

  const handleUpdatePrice = (asset: AssetWithType) => {
    setPriceAsset(asset)
    setPriceDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот актив?')) {
      deleteAsset.mutate(id)
    }
  }

  // Deposit handlers
  const handleDepositClick = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setIsDepositDetailsOpen(true)
  }

  const handleDepositEdit = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setIsDepositEditOpen(true)
    setIsDepositDetailsOpen(false)
  }

  const handleDepositCloseEarly = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setIsDepositCloseOpen(true)
    setIsDepositDetailsOpen(false)
  }

  const handleDepositDelete = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setIsDepositDeleteOpen(true)
    setIsDepositDetailsOpen(false)
  }

  // Group assets by type
  const assetsByType = assets.reduce(
    (acc, asset) => {
      const typeName = asset.type_name || 'Другое'
      if (!acc[typeName]) {
        acc[typeName] = []
      }
      acc[typeName].push(asset)
      return acc
    },
    {} as Record<string, AssetWithType[]>
  )

  const isPageLoading = isLoading || isLoadingDeposits

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
            Активы
          </h1>
          <p className="mt-1 text-muted-foreground">
            Валюты, акции, депозиты и другие активы
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Новый актив
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <CreateAssetDialog>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Coins className="mr-2 h-4 w-4" />
                Валюта / Ценная бумага
              </DropdownMenuItem>
            </CreateAssetDialog>
            <CreateDepositDialog>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Landmark className="mr-2 h-4 w-4" />
                Банковский депозит
              </DropdownMenuItem>
            </CreateDepositDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Maturing Deposits Alert */}
      <AnimatePresence>
        {maturingDeposits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 ring-1 ring-amber-500/20"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {maturingDeposits.length === 1
                    ? 'Депозит погашается в ближайшие 30 дней'
                    : `${maturingDeposits.length} депозитов погашаются в ближайшие 30 дней`}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {maturingDeposits.slice(0, 3).map((deposit) => (
                    <Badge
                      key={deposit.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-amber-500/10"
                      onClick={() => handleDepositClick(deposit)}
                    >
                      {deposit.assetName} ({deposit.daysRemaining} дн.)
                    </Badge>
                  ))}
                  {maturingDeposits.length > 3 && (
                    <Badge variant="outline">+{maturingDeposits.length - 3} ещё</Badge>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего активов</p>
                <p className="text-xl font-bold tabular-nums">
                  {assets.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Coins className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Типов активов</p>
                <p className="text-xl font-bold tabular-nums">
                  {Object.keys(assetsByType).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Landmark className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Активных депозитов</p>
                <p className="text-xl font-bold tabular-nums">
                  {deposits.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {depositsSummary && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Landmark className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Сумма депозитов</p>
                  <p className="text-xl font-bold tabular-nums">
                    {depositsSummary.totalCurrentValue?.toLocaleString('ru-RU', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }) || '0'} ₽
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Loading State */}
      {isPageLoading && (
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Content */}
      {!isPageLoading && !error && (
        <>
          {/* Deposits Section */}
          {deposits.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Депозиты</h2>
                    <p className="text-sm text-muted-foreground">
                      Банковские вклады с начислением процентов
                    </p>
                  </div>
                </div>
                <CreateDepositDialog>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Новый депозит
                  </Button>
                </CreateDepositDialog>
              </div>

              {/* Deposits Summary */}
              {depositsSummary && <DepositsSummaryCard summary={depositsSummary} />}

              {/* Deposits Grid */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {deposits.map((deposit) => (
                  <motion.div key={deposit.id} variants={item}>
                    <DepositCard
                      deposit={deposit}
                      onClick={() => handleDepositClick(deposit)}
                      onEdit={() => handleDepositEdit(deposit)}
                      onDelete={() => handleDepositDelete(deposit)}
                      onCloseEarly={
                        deposit.status === 'active'
                          ? () => handleDepositCloseEarly(deposit)
                          : undefined
                      }
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Assets by Type */}
          {assets.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(assetsByType).map(([typeName, typeAssets]) => (
                <div key={typeName} className="space-y-4">
                  <h2 className="text-lg font-medium">{typeName}</h2>
                  <motion.div
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    {typeAssets.map((asset) => (
                      <motion.div key={asset.id} variants={item}>
                        <AssetCard
                          asset={asset}
                          onEdit={() => handleEdit(asset)}
                          onDelete={() => handleDelete(asset.id)}
                          onUpdatePrice={() => handleUpdatePrice(asset)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              ))}

              {/* Add New Asset Card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <CreateAssetDialog>
                  <Card className="flex h-[180px] cursor-pointer items-center justify-center border-dashed border-border/50 bg-card/30 transition-all hover:border-border hover:bg-card/50">
                    <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-muted-foreground">
                        Добавить актив
                      </p>
                    </CardContent>
                  </Card>
                </CreateAssetDialog>
              </motion.div>
            </div>
          ) : deposits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30"
            >
              <Coins className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium">Нет активов</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Добавьте первый актив для начала работы
                </p>
              </div>
              <div className="flex gap-3">
                <CreateAssetDialog>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить актив
                  </Button>
                </CreateAssetDialog>
                <CreateDepositDialog>
                  <Button>
                    <Landmark className="mr-2 h-4 w-4" />
                    Открыть депозит
                  </Button>
                </CreateDepositDialog>
              </div>
            </motion.div>
          ) : null}
        </>
      )}

      {/* Asset Dialogs */}
      <EditAssetDialog
        asset={editAsset}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <UpdatePriceDialog
        asset={priceAsset}
        open={priceDialogOpen}
        onOpenChange={setPriceDialogOpen}
      />

      {/* Deposit Dialogs */}
      <DepositDetailsSheet
        deposit={selectedDeposit}
        open={isDepositDetailsOpen}
        onOpenChange={setIsDepositDetailsOpen}
        onEdit={() => selectedDeposit && handleDepositEdit(selectedDeposit)}
        onDelete={() => selectedDeposit && handleDepositDelete(selectedDeposit)}
        onCloseEarly={
          selectedDeposit?.status === 'active'
            ? () => handleDepositCloseEarly(selectedDeposit)
            : undefined
        }
      />

      <EditDepositDialog
        deposit={selectedDeposit}
        open={isDepositEditOpen}
        onOpenChange={setIsDepositEditOpen}
      />

      <CloseDepositDialog
        deposit={selectedDeposit}
        open={isDepositCloseOpen}
        onOpenChange={setIsDepositCloseOpen}
      />

      <DeleteDepositDialog
        deposit={selectedDeposit}
        open={isDepositDeleteOpen}
        onOpenChange={setIsDepositDeleteOpen}
      />
    </div>
  )
}
