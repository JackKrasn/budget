import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { FileText, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UnmappedItemsAlert } from './unmapped-items-alert'
import { DuplicatesList } from './duplicates-list'
import { OperationsSummary } from './operations-summary'
import { MappingDialog } from './mapping-dialog'
import {
  useCreateAccountMapping,
  useCreateCategoryMapping,
  useCreateTagMapping,
} from '../hooks'
import type { AnalyzeImportResponse, UnmappedItemType, ImportSource } from '@/lib/api/types'

interface AnalysisReportProps {
  data: AnalyzeImportResponse
  source: ImportSource
  onNavigateToMappings: (type?: UnmappedItemType) => void
  onMappingCreated?: () => void
}

export function AnalysisReport({ data, source, onMappingCreated }: AnalysisReportProps) {
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [mappingType, setMappingType] = useState<UnmappedItemType>('account')
  const [mappingExternalName, setMappingExternalName] = useState('')

  // Track which items have been mapped in this session
  const [mappedAccounts, setMappedAccounts] = useState<Set<string>>(new Set())
  const [mappedCategories, setMappedCategories] = useState<Set<string>>(new Set())
  const [mappedTags, setMappedTags] = useState<Set<string>>(new Set())

  const createAccountMapping = useCreateAccountMapping()
  const createCategoryMapping = useCreateCategoryMapping()
  const createTagMapping = useCreateTagMapping()

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: ru })
  }

  // Group unmapped items by type
  const unmappedAccounts = useMemo(
    () => data.unmappedItems.filter((item) => item.type === 'account'),
    [data.unmappedItems]
  )
  const unmappedCategories = useMemo(
    () => data.unmappedItems.filter((item) => item.type === 'category'),
    [data.unmappedItems]
  )
  const unmappedTags = useMemo(
    () => data.unmappedItems.filter((item) => item.type === 'tag'),
    [data.unmappedItems]
  )

  const handleConfigureClick = (externalName: string, type: UnmappedItemType) => {
    setMappingType(type)
    setMappingExternalName(externalName)
    setMappingDialogOpen(true)
  }

  const handleMappingSubmit = async (externalName: string, targetId: string) => {
    switch (mappingType) {
      case 'account':
        await createAccountMapping.mutateAsync({
          source,
          externalName,
          accountId: targetId,
        })
        setMappedAccounts((prev) => new Set(prev).add(externalName))
        break
      case 'category':
        await createCategoryMapping.mutateAsync({
          source,
          externalName,
          categoryId: targetId,
        })
        setMappedCategories((prev) => new Set(prev).add(externalName))
        break
      case 'tag':
        await createTagMapping.mutateAsync({
          source,
          externalName,
          tagId: targetId,
        })
        setMappedTags((prev) => new Set(prev).add(externalName))
        break
    }

  }

  const isMappingPending =
    createAccountMapping.isPending ||
    createCategoryMapping.isPending ||
    createTagMapping.isPending

  // Check if any mappings were added in this session
  const hasMappingsAdded = mappedAccounts.size > 0 || mappedCategories.size > 0 || mappedTags.size > 0

  return (
    <div className="space-y-4">
      {/* File Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Результаты анализа
            </CardTitle>
            {hasMappingsAdded && (
              <Button variant="outline" size="sm" onClick={() => onMappingCreated?.()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Период</p>
              <p className="font-medium">
                {formatDate(data.fullPeriod.from)} — {formatDate(data.fullPeriod.to)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Всего строк</p>
              <p className="font-medium">{data.parsedRows}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Готово к импорту</p>
              <p className="font-medium text-primary">
                {data.readyToImport.expenses + data.readyToImport.transfers + data.readyToImport.incomes}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations Summary */}
      <OperationsSummary data={data} />

      {/* Unmapped Items Alerts */}
      {(unmappedAccounts.length > 0 ||
        unmappedCategories.length > 0 ||
        unmappedTags.length > 0) && (
        <div className="space-y-3">
          <UnmappedItemsAlert
            items={unmappedAccounts}
            type="account"
            mappedNames={mappedAccounts}
            onConfigureClick={handleConfigureClick}
          />
          <UnmappedItemsAlert
            items={unmappedCategories}
            type="category"
            mappedNames={mappedCategories}
            onConfigureClick={handleConfigureClick}
          />
          <UnmappedItemsAlert
            items={unmappedTags}
            type="tag"
            mappedNames={mappedTags}
            onConfigureClick={handleConfigureClick}
          />
        </div>
      )}

      {/* Duplicates List */}
      <DuplicatesList duplicates={data.duplicates} />

      {/* Mapping Dialog */}
      <MappingDialog
        open={mappingDialogOpen}
        onOpenChange={setMappingDialogOpen}
        type={mappingType}
        defaultExternalName={mappingExternalName}
        onSubmit={handleMappingSubmit}
        isPending={isMappingPending}
      />
    </div>
  )
}
