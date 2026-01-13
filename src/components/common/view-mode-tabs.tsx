import {
  LayoutGrid,
  List,
  Tag,
  ArrowLeftRight,
  RefreshCw,
  ListOrdered,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type ViewMode = 'all' | 'categories' | 'tags' | 'list' | 'transfers' | 'adjustments'

type GroupMode = 'categories' | 'tags'
type OperationMode = 'all' | 'list' | 'transfers' | 'adjustments'

interface ViewModeTabsProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  allCount?: number
  expenseCount?: number
  transferCount?: number
  adjustmentCount?: number
  categoryCount?: number
  tagCount?: number
}

const groupOptions: { value: GroupMode; label: string; icon: React.ElementType }[] = [
  { value: 'categories', label: 'Категории', icon: LayoutGrid },
  { value: 'tags', label: 'Метки', icon: Tag },
]

const operationOptions: { value: OperationMode; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'Все операции', icon: ListOrdered },
  { value: 'list', label: 'Расходы', icon: List },
  { value: 'transfers', label: 'Переводы', icon: ArrowLeftRight },
  { value: 'adjustments', label: 'Корректировки', icon: RefreshCw },
]

export function ViewModeTabs({
  value,
  onChange,
  allCount = 0,
  expenseCount = 0,
  transferCount = 0,
  adjustmentCount = 0,
  categoryCount = 0,
  tagCount = 0,
}: ViewModeTabsProps) {
  const isGroupMode = value === 'categories' || value === 'tags'
  const isOperationMode = value === 'all' || value === 'list' || value === 'transfers' || value === 'adjustments'

  const getCount = (mode: ViewMode) => {
    switch (mode) {
      case 'categories': return categoryCount
      case 'tags': return tagCount
      case 'all': return allCount
      case 'list': return expenseCount
      case 'transfers': return transferCount
      case 'adjustments': return adjustmentCount
      default: return 0
    }
  }

  const handleGroupChange = (newValue: string) => {
    onChange(newValue as GroupMode)
  }

  const handleOperationChange = (newValue: string) => {
    onChange(newValue as OperationMode)
  }

  const currentGroupValue = isGroupMode ? value : 'categories'
  const currentOperationValue = isOperationMode ? value : 'all'

  return (
    <div className="flex items-center gap-2">
      <Select
        value={isGroupMode ? currentGroupValue : ''}
        onValueChange={handleGroupChange}
      >
        <SelectTrigger className={`w-[150px] ${isGroupMode ? '' : 'text-muted-foreground'}`}>
          <SelectValue placeholder="Группировка" />
        </SelectTrigger>
        <SelectContent>
          {groupOptions.map((option) => {
            const Icon = option.icon
            const count = getCount(option.value)
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                  {count > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {count}
                    </span>
                  )}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      <Select
        value={isOperationMode ? currentOperationValue : ''}
        onValueChange={handleOperationChange}
      >
        <SelectTrigger className={`w-[170px] ${isOperationMode ? '' : 'text-muted-foreground'}`}>
          <SelectValue placeholder="Операции" />
        </SelectTrigger>
        <SelectContent>
          {operationOptions.map((option) => {
            const Icon = option.icon
            const count = getCount(option.value)
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                  {count > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {count}
                    </span>
                  )}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
