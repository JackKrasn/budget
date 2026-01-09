import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Coins, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useAssets,
  useDeleteAsset,
  AssetCard,
  CreateAssetDialog,
  EditAssetDialog,
  UpdatePriceDialog,
} from '@/features/assets'
import type { AssetWithType } from '@/lib/api/types'

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
  const [editAsset, setEditAsset] = useState<AssetWithType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [priceAsset, setPriceAsset] = useState<AssetWithType | null>(null)
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)

  const { data, isLoading, error } = useAssets()
  const deleteAsset = useDeleteAsset()

  const assets = data?.data ?? []

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
            Валюты, акции, криптовалюты и другие активы
          </p>
        </div>
        <CreateAssetDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Новый актив
          </Button>
        </CreateAssetDialog>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Assets by Type */}
      {!isLoading && !error && (
        <>
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
          ) : (
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
              <CreateAssetDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить актив
                </Button>
              </CreateAssetDialog>
            </motion.div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <EditAssetDialog
        asset={editAsset}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Update Price Dialog */}
      <UpdatePriceDialog
        asset={priceAsset}
        open={priceDialogOpen}
        onOpenChange={setPriceDialogOpen}
      />
    </div>
  )
}
