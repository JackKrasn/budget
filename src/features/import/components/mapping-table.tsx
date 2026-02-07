import { Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAccounts } from '@/features/accounts'
import { useExpenseCategories } from '@/features/expenses'
import { useExpenseTags } from '@/features/expenses/hooks/use-expense-tags'
import type {
  ImportAccountMapping,
  ImportCategoryMapping,
  ImportTagMapping,
  UnmappedItemType,
} from '@/lib/api/types'

type MappingItem = ImportAccountMapping | ImportCategoryMapping | ImportTagMapping

interface MappingTableProps {
  mappings: MappingItem[]
  type: UnmappedItemType
  onDelete: (id: string) => void
  isLoading?: boolean
  isDeleting?: boolean
}

function getTypeLabel(type: UnmappedItemType): string {
  switch (type) {
    case 'account':
      return 'счёта'
    case 'category':
      return 'категории'
    case 'tag':
      return 'тега'
  }
}

export function MappingTable({
  mappings,
  type,
  onDelete,
  isLoading,
  isDeleting,
}: MappingTableProps) {
  const { data: accountsData } = useAccounts()
  const { data: categoriesData } = useExpenseCategories()
  const { data: tagsData } = useExpenseTags()

  const accounts = accountsData?.data ?? []
  const categories = categoriesData?.data ?? []
  const tags = tagsData?.data ?? []

  const getTargetName = (mapping: MappingItem): string => {
    switch (type) {
      case 'account': {
        const accountMapping = mapping as ImportAccountMapping
        if (accountMapping.accountName) return accountMapping.accountName
        const account = accounts.find((a) => a.id === accountMapping.accountId)
        return account?.name ?? '—'
      }
      case 'category': {
        const categoryMapping = mapping as ImportCategoryMapping
        if (categoryMapping.categoryName) return categoryMapping.categoryName
        const category = categories.find((c) => c.id === categoryMapping.categoryId)
        return category?.name ?? '—'
      }
      case 'tag': {
        const tagMapping = mapping as ImportTagMapping
        if (tagMapping.tagName) return tagMapping.tagName
        const tag = tags.find((t) => t.id === tagMapping.tagId)
        return tag?.name ?? '—'
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (mappings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Маппинги не настроены</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Добавьте соответствия для импорта данных
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Название в CoinKeeper</TableHead>
            <TableHead>Соответствие</TableHead>
            <TableHead className="w-[60px] pr-4"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.map((mapping) => (
            <TableRow key={mapping.id}>
              <TableCell className="pl-4 font-medium">{mapping.externalName}</TableCell>
              <TableCell>{getTargetName(mapping)}</TableCell>
              <TableCell className="pr-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить маппинг?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Маппинг <strong>"{mapping.externalName}"</strong> будет удалён.
                        Операции с этим названием не будут импортироваться до создания
                        нового маппинга {getTypeLabel(type)}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(mapping.id)}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Удаление...' : 'Удалить'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
