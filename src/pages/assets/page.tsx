import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Coins,
  AlertCircle,
  Loader2,
  LayoutGrid,
  List,
  TrendingUp,
  Landmark,
  Bitcoin,
  Gem,
  Banknote,
  Filter,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useAssets,
  useDeleteAsset,
  AssetCard,
  CreateAssetDialog,
  EditAssetDialog,
  UpdatePriceDialog,
} from '@/features/assets'
import { cn } from '@/lib/utils'
import type { AssetWithType } from '@/lib/api/types'

// Asset type configuration with icons and colors
const ASSET_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  all: {
    label: 'Все',
    icon: Coins,
    color: '#6366f1',
  },
  currency: {
    label: 'Валюты',
    icon: Banknote,
    color: '#10b981',
  },
  deposit: {
    label: 'Депозиты',
    icon: Landmark,
    color: '#f59e0b',
  },
  stock: {
    label: 'Акции',
    icon: TrendingUp,
    color: '#3b82f6',
  },
  etf: {
    label: 'ETF',
    icon: TrendingUp,
    color: '#8b5cf6',
  },
  bond: {
    label: 'Облигации',
    icon: Landmark,
    color: '#ec4899',
  },
  crypto: {
    label: 'Крипто',
    icon: Bitcoin,
    color: '#f97316',
  },
  precious_metal: {
    label: 'Металлы',
    icon: Gem,
    color: '#eab308',
  },
}

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'currency' | 'deposit' | 'stock' | 'etf' | 'bond' | 'crypto' | 'precious_metal'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
}

// Primary filter color (same for all buttons)
const FILTER_COLOR = '#6366f1'

// Filter chip component
function FilterChip({
  type,
  isActive,
  count,
  onClick,
}: {
  type: FilterType
  isActive: boolean
  count: number
  onClick: () => void
}) {
  const config = ASSET_TYPE_CONFIG[type]
  const Icon = config.icon

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
        isActive
          ? 'text-white shadow-lg'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      style={
        isActive
          ? {
              backgroundColor: FILTER_COLOR,
              boxShadow: `0 4px 14px ${FILTER_COLOR}40`,
            }
          : undefined
      }
    >
      <Icon className="h-4 w-4" />
      <span>{config.label}</span>
      {count > 0 && (
        <span
          className={cn(
            'ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums',
            isActive ? 'bg-white/20 text-white' : 'bg-muted-foreground/10'
          )}
        >
          {count}
        </span>
      )}
    </motion.button>
  )
}

export default function AssetsPage() {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [editAsset, setEditAsset] = useState<AssetWithType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [priceAsset, setPriceAsset] = useState<AssetWithType | null>(null)
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)

  // Fetch data
  const { data: assetsData, isLoading, error } = useAssets()
  const deleteAsset = useDeleteAsset()

  const assets = assetsData?.data ?? []

  // Calculate counts for each type
  const typeCounts = useMemo(() => {
    const counts: Record<FilterType, number> = {
      all: assets.length,
      currency: assets.filter((a) => a.type_code === 'currency').length,
      deposit: assets.filter((a) => a.type_code === 'deposit').length,
      stock: assets.filter((a) => a.type_code === 'stock').length,
      etf: assets.filter((a) => a.type_code === 'etf').length,
      bond: assets.filter((a) => a.type_code === 'bond').length,
      crypto: assets.filter((a) => a.type_code === 'crypto').length,
      precious_metal: assets.filter((a) => a.type_code === 'precious_metal').length,
    }
    return counts
  }, [assets])

  // Filter assets based on active filter
  const filteredAssets = useMemo(() => {
    if (activeFilter === 'all') {
      return assets
    }
    return assets.filter((a) => a.type_code === activeFilter)
  }, [assets, activeFilter])

  // Group assets by type (sorted by asset_type_id)
  const groupedAssets = useMemo(() => {
    const groups: Record<string, AssetWithType[]> = {}

    // Sort assets by asset_type_id first
    const sortedAssets = [...filteredAssets].sort((a, b) => {
      const typeIdA = a.asset_type_id || ''
      const typeIdB = b.asset_type_id || ''
      return typeIdA.localeCompare(typeIdB)
    })

    for (const asset of sortedAssets) {
      const typeCode = asset.type_code || 'other'
      if (!groups[typeCode]) {
        groups[typeCode] = []
      }
      groups[typeCode].push(asset)
    }

    return groups
  }, [filteredAssets])

  // Order for displaying groups
  const typeOrder = ['currency', 'deposit', 'stock', 'etf', 'bond', 'crypto', 'precious_metal', 'other']

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

  // Get available filter types (only those with items)
  const availableFilters: FilterType[] = ['all', 'currency', 'deposit', 'stock', 'etf', 'bond', 'crypto', 'precious_metal'].filter(
    (type) => type === 'all' || typeCounts[type as FilterType] > 0
  ) as FilterType[]

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
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Активы
          </h1>
          <p className="mt-1 text-muted-foreground">
            Валюты, акции и другие финансовые инструменты
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <TooltipProvider>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
              className="rounded-lg border border-border/50 bg-muted/30 p-1"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="grid"
                    aria-label="Сетка"
                    className="h-8 w-8 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Сетка</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="list"
                    aria-label="Список"
                    className="h-8 w-8 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
                  >
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Список</TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </TooltipProvider>

          <CreateAssetDialog>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Новый актив</span>
            </Button>
          </CreateAssetDialog>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">
                <Coins className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего активов</p>
                <p className="text-2xl font-bold tabular-nums">{assets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <Banknote className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Валют</p>
                <p className="text-2xl font-bold tabular-nums">{typeCounts.currency}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Акций и ETF</p>
                <p className="text-2xl font-bold tabular-nums">
                  {typeCounts.stock + typeCounts.etf}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10">
                <Bitcoin className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Крипто</p>
                <p className="text-2xl font-bold tabular-nums">{typeCounts.crypto}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      {availableFilters.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Фильтр:</span>
          </div>
          {availableFilters.map((type) => (
            <FilterChip
              key={type}
              type={type}
              isActive={activeFilter === type}
              count={typeCounts[type]}
              onClick={() => setActiveFilter(type)}
            />
          ))}
          {activeFilter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setActiveFilter('all')}
            >
              <X className="h-3.5 w-3.5" />
              Сбросить
            </Button>
          )}
        </motion.div>
      )}

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

      {/* Content */}
      {!isLoading && !error && (
        <AnimatePresence mode="wait">
          {filteredAssets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card/30"
            >
              <Coins className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium">
                  {activeFilter === 'all'
                    ? 'Нет активов'
                    : `Нет активов типа "${ASSET_TYPE_CONFIG[activeFilter].label}"`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeFilter === 'all'
                    ? 'Добавьте первый актив для начала работы'
                    : 'Попробуйте другой фильтр'}
                </p>
              </div>
              {activeFilter === 'all' && (
                <CreateAssetDialog>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить актив
                  </Button>
                </CreateAssetDialog>
              )}
            </motion.div>
          ) : (
            <div className="space-y-8">
              {typeOrder
                .filter((typeCode) => groupedAssets[typeCode]?.length > 0)
                .map((typeCode) => {
                  const typeConfig = ASSET_TYPE_CONFIG[typeCode as FilterType]
                  const typeAssets = groupedAssets[typeCode]
                  const Icon = typeConfig?.icon || Coins

                  return (
                    <motion.section
                      key={typeCode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Show section header only when viewing all */}
                      {activeFilter === 'all' && (
                        <div className="mb-4 flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${typeConfig?.color || '#6366f1'}15` }}
                          >
                            <Icon
                              className="h-4 w-4"
                              style={{ color: typeConfig?.color || '#6366f1' }}
                            />
                          </div>
                          <h2 className="text-lg font-semibold">
                            {typeConfig?.label || 'Другое'}
                          </h2>
                          <Badge variant="secondary">{typeAssets.length}</Badge>
                        </div>
                      )}

                      <motion.div
                        className={
                          viewMode === 'grid'
                            ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                            : 'space-y-2'
                        }
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
                    </motion.section>
                  )
                })}
            </div>
          )}
        </AnimatePresence>
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
    </div>
  )
}
