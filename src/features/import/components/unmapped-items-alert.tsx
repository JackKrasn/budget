import { AlertTriangle, Check, Info, Settings } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UnmappedItem, UnmappedItemType } from '@/lib/api/types'

interface UnmappedItemsAlertProps {
  items: UnmappedItem[]
  type: UnmappedItemType
  mappedNames?: Set<string>
  onConfigureClick: (externalName: string, type: UnmappedItemType) => void
}

function getTypeLabel(type: UnmappedItemType): string {
  switch (type) {
    case 'account':
      return 'Немапленные счета'
    case 'category':
      return 'Немапленные категории'
    case 'tag':
      return 'Немапленные теги'
  }
}

function getItemLabel(type: UnmappedItemType): string {
  switch (type) {
    case 'account':
      return 'счёт'
    case 'category':
      return 'категорию'
    case 'tag':
      return 'тег'
  }
}

export function UnmappedItemsAlert({
  items,
  type,
  mappedNames = new Set(),
  onConfigureClick,
}: UnmappedItemsAlertProps) {
  if (items.length === 0) return null

  // Count how many are still unmapped
  const unmappedCount = items.filter((item) => !mappedNames.has(item.externalName)).length
  const allMapped = unmappedCount === 0

  // Tags are info level, accounts and categories are warning (unless all mapped)
  const isWarning = (type === 'account' || type === 'category') && !allMapped
  const Icon = allMapped ? Check : isWarning ? AlertTriangle : Info

  return (
    <Alert
      variant={allMapped ? 'default' : isWarning ? 'destructive' : 'default'}
      className={
        allMapped
          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
          : isWarning
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
            : ''
      }
    >
      <Icon
        className={`h-4 w-4 ${allMapped ? 'text-green-600' : isWarning ? 'text-amber-600' : ''}`}
      />
      <AlertTitle
        className={
          allMapped
            ? 'text-green-800 dark:text-green-200'
            : isWarning
              ? 'text-amber-800 dark:text-amber-200'
              : ''
        }
      >
        {allMapped
          ? `Все ${type === 'account' ? 'счета' : type === 'category' ? 'категории' : 'теги'} настроены`
          : `${getTypeLabel(type)} (${unmappedCount})`}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          {items.map((item) => {
            const isMapped = mappedNames.has(item.externalName)
            return (
              <div
                key={item.externalName}
                className={`flex items-center justify-between gap-2 py-1 ${isMapped ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {isMapped && <Check className="h-4 w-4 text-green-600" />}
                  <span className={`font-medium ${isMapped ? 'line-through' : ''}`}>
                    "{item.externalName}"
                  </span>
                  <Badge variant={isMapped ? 'outline' : 'secondary'} className="text-xs">
                    {item.count} {item.count === 1 ? 'операция' : item.count < 5 ? 'операции' : 'операций'}
                  </Badge>
                </div>
                {isMapped ? (
                  <span className="text-xs text-green-600 font-medium">Настроено</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onConfigureClick(item.externalName, type)}
                    className="h-7 text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Настроить {getItemLabel(type)}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </AlertDescription>
    </Alert>
  )
}
