import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { TrendingDown, ArrowRightLeft, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImportOperationType } from '@/lib/api/types'

interface ImportOptionsProps {
  skipDuplicates: boolean
  onSkipDuplicatesChange: (value: boolean) => void
  createTags: boolean
  onCreateTagsChange: (value: boolean) => void
  dryRun: boolean
  onDryRunChange: (value: boolean) => void
  // Фильтры
  selectedTypes: ImportOperationType[]
  onTypesChange: (types: ImportOperationType[]) => void
  availableAccounts: string[]
  selectedAccounts: string[]
  onAccountsChange: (accounts: string[]) => void
}

const OPERATION_TYPES: { type: ImportOperationType; label: string; icon: typeof TrendingDown; color: string }[] = [
  { type: 'expense', label: 'Расходы', icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
  { type: 'transfer', label: 'Переводы', icon: ArrowRightLeft, color: 'text-blue-600 dark:text-blue-400' },
  { type: 'income', label: 'Доходы', icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
]

export function ImportOptions({
  skipDuplicates,
  onSkipDuplicatesChange,
  createTags,
  onCreateTagsChange,
  dryRun,
  onDryRunChange,
  selectedTypes,
  onTypesChange,
  availableAccounts,
  selectedAccounts,
  onAccountsChange,
}: ImportOptionsProps) {
  const [accountsOpen, setAccountsOpen] = useState(false)

  const toggleType = (type: ImportOperationType) => {
    if (selectedTypes.includes(type)) {
      // Не даём снять последний тип
      if (selectedTypes.length > 1) {
        onTypesChange(selectedTypes.filter((t) => t !== type))
      }
    } else {
      onTypesChange([...selectedTypes, type])
    }
  }

  const toggleAccount = (account: string) => {
    if (selectedAccounts.includes(account)) {
      onAccountsChange(selectedAccounts.filter((a) => a !== account))
    } else {
      onAccountsChange([...selectedAccounts, account])
    }
  }

  const removeAccount = (account: string) => {
    onAccountsChange(selectedAccounts.filter((a) => a !== account))
  }

  const selectAllAccounts = () => {
    onAccountsChange([...availableAccounts])
  }

  const clearAllAccounts = () => {
    onAccountsChange([])
  }

  return (
    <div className="space-y-6">
      {/* Operation Types Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Типы операций</Label>
        <div className="flex flex-wrap gap-2">
          {OPERATION_TYPES.map(({ type, label, icon: Icon, color }) => {
            const isSelected = selectedTypes.includes(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <Icon className={cn('h-4 w-4', isSelected ? color : 'text-muted-foreground')} />
                <span className={cn('text-sm font-medium', isSelected ? '' : 'text-muted-foreground')}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Выберите типы операций для импорта. Должен быть выбран хотя бы один тип
        </p>
      </div>

      {/* Accounts Filter */}
      {availableAccounts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Счета для импорта</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllAccounts}
                className="text-xs text-primary hover:underline"
              >
                Выбрать все
              </button>
              <span className="text-xs text-muted-foreground">|</span>
              <button
                type="button"
                onClick={clearAllAccounts}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Сбросить
              </button>
            </div>
          </div>

          <Popover open={accountsOpen} onOpenChange={setAccountsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={accountsOpen}
                className="w-full justify-between h-auto min-h-10"
              >
                <span className="text-muted-foreground">
                  {selectedAccounts.length === 0
                    ? 'Все счета'
                    : `Выбрано: ${selectedAccounts.length} из ${availableAccounts.length}`}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Поиск счёта..." />
                <CommandList>
                  <CommandEmpty>Счёт не найден</CommandEmpty>
                  <CommandGroup>
                    {availableAccounts.map((account) => {
                      const isSelected = selectedAccounts.includes(account)
                      return (
                        <CommandItem
                          key={account}
                          value={account}
                          onSelect={() => toggleAccount(account)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              isSelected ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {account}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Selected accounts as badges */}
          {selectedAccounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedAccounts.map((account) => (
                <Badge
                  key={account}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 gap-1"
                >
                  {account}
                  <button
                    type="button"
                    onClick={() => removeAccount(account)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {selectedAccounts.length === 0
              ? 'Будут импортированы операции со всех счетов'
              : `Будут импортированы только операции с выбранных счетов`}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t" />

      {/* Skip duplicates */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="skip-duplicates"
          checked={skipDuplicates}
          onCheckedChange={(checked) => onSkipDuplicatesChange(checked === true)}
        />
        <div className="space-y-1">
          <Label htmlFor="skip-duplicates" className="cursor-pointer font-medium">
            Пропускать дубликаты
          </Label>
          <p className="text-sm text-muted-foreground">
            Рекомендуется. Операции, которые уже существуют в системе, будут пропущены
          </p>
        </div>
      </div>

      {/* Create tags */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="create-tags"
          checked={createTags}
          onCheckedChange={(checked) => onCreateTagsChange(checked === true)}
        />
        <div className="space-y-1">
          <Label htmlFor="create-tags" className="cursor-pointer font-medium">
            Создавать новые теги автоматически
          </Label>
          <p className="text-sm text-muted-foreground">
            Теги из CoinKeeper, для которых нет маппинга, будут созданы в Budget
          </p>
        </div>
      </div>

      {/* Dry run */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="dry-run"
          checked={dryRun}
          onCheckedChange={(checked) => onDryRunChange(checked === true)}
        />
        <div className="space-y-1">
          <Label htmlFor="dry-run" className="cursor-pointer font-medium">
            Тестовый режим (без сохранения)
          </Label>
          <p className="text-sm text-muted-foreground">
            Проверить импорт без реального создания операций. Полезно для отладки
          </p>
        </div>
      </div>
    </div>
  )
}
