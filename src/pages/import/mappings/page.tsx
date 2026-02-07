import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MappingTable, MappingDialog } from '@/features/import'
import {
  useAccountMappings,
  useCreateAccountMapping,
  useDeleteAccountMapping,
  useCategoryMappings,
  useCreateCategoryMapping,
  useDeleteCategoryMapping,
  useTagMappings,
  useCreateTagMapping,
  useDeleteTagMapping,
} from '@/features/import'
import type { UnmappedItemType, ImportSource } from '@/lib/api/types'

const SOURCE: ImportSource = 'coinkeeper'

export default function ImportMappingsPage() {
  const [activeTab, setActiveTab] = useState<UnmappedItemType>('account')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogExternalName, setDialogExternalName] = useState<string>()

  // Account mappings
  const {
    data: accountMappingsData,
    isLoading: isLoadingAccounts,
  } = useAccountMappings({ source: SOURCE })
  const createAccountMapping = useCreateAccountMapping()
  const deleteAccountMapping = useDeleteAccountMapping()

  // Category mappings
  const {
    data: categoryMappingsData,
    isLoading: isLoadingCategories,
  } = useCategoryMappings({ source: SOURCE })
  const createCategoryMapping = useCreateCategoryMapping()
  const deleteCategoryMapping = useDeleteCategoryMapping()

  // Tag mappings
  const {
    data: tagMappingsData,
    isLoading: isLoadingTags,
  } = useTagMappings({ source: SOURCE })
  const createTagMapping = useCreateTagMapping()
  const deleteTagMapping = useDeleteTagMapping()

  const accountMappings = accountMappingsData?.data ?? []
  const categoryMappings = categoryMappingsData?.data ?? []
  const tagMappings = tagMappingsData?.data ?? []

  const handleAddMapping = (externalName?: string) => {
    setDialogExternalName(externalName)
    setDialogOpen(true)
  }

  const handleSubmitMapping = async (externalName: string, targetId: string) => {
    switch (activeTab) {
      case 'account':
        await createAccountMapping.mutateAsync({
          source: SOURCE,
          externalName,
          accountId: targetId,
        })
        break
      case 'category':
        await createCategoryMapping.mutateAsync({
          source: SOURCE,
          externalName,
          categoryId: targetId,
        })
        break
      case 'tag':
        await createTagMapping.mutateAsync({
          source: SOURCE,
          externalName,
          tagId: targetId,
        })
        break
    }
  }

  const handleDeleteMapping = (id: string) => {
    switch (activeTab) {
      case 'account':
        deleteAccountMapping.mutate(id)
        break
      case 'category':
        deleteCategoryMapping.mutate(id)
        break
      case 'tag':
        deleteTagMapping.mutate(id)
        break
    }
  }

  const isCreating =
    createAccountMapping.isPending ||
    createCategoryMapping.isPending ||
    createTagMapping.isPending

  const isDeleting =
    deleteAccountMapping.isPending ||
    deleteCategoryMapping.isPending ||
    deleteTagMapping.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/import">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Настройка маппингов
            </h1>
            <p className="text-sm text-muted-foreground">
              Соответствия между названиями в CoinKeeper и элементами Budget
            </p>
          </div>
        </div>

        <Button onClick={() => handleAddMapping()} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as UnmappedItemType)}
      >
        <TabsList>
          <TabsTrigger value="account">
            Счета {accountMappings.length > 0 && `(${accountMappings.length})`}
          </TabsTrigger>
          <TabsTrigger value="category">
            Категории {categoryMappings.length > 0 && `(${categoryMappings.length})`}
          </TabsTrigger>
          <TabsTrigger value="tag">
            Теги {tagMappings.length > 0 && `(${tagMappings.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <MappingTable
            mappings={accountMappings}
            type="account"
            onDelete={handleDeleteMapping}
            isLoading={isLoadingAccounts}
            isDeleting={isDeleting}
          />
        </TabsContent>

        <TabsContent value="category" className="mt-4">
          <MappingTable
            mappings={categoryMappings}
            type="category"
            onDelete={handleDeleteMapping}
            isLoading={isLoadingCategories}
            isDeleting={isDeleting}
          />
        </TabsContent>

        <TabsContent value="tag" className="mt-4">
          <MappingTable
            mappings={tagMappings}
            type="tag"
            onDelete={handleDeleteMapping}
            isLoading={isLoadingTags}
            isDeleting={isDeleting}
          />
        </TabsContent>
      </Tabs>

      {/* Mapping Dialog */}
      <MappingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={activeTab}
        defaultExternalName={dialogExternalName}
        onSubmit={handleSubmitMapping}
        isPending={isCreating}
      />
    </div>
  )
}
