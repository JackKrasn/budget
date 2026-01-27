import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronDown,
  Tag,
  Wallet,
  Landmark,
  FolderOpen,
  Check,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
import { CategoryIcon } from '@/components/common/category-icon'
import { cn } from '@/lib/utils'
import type { ExpenseCategory, ExpenseTag, Account, FundBalance } from '@/lib/api/types'

export interface FiltersPanelProps {
  // Data sources (all optional)
  categories?: ExpenseCategory[]
  tags?: ExpenseTag[]
  accounts?: Account[]
  funds?: FundBalance[]
  // Selected values
  selectedCategoryId?: string | null
  selectedTagId?: string | null
  selectedAccountId?: string | null
  selectedFundId?: string | null
  // Callbacks
  onCategoryChange?: (id: string | null) => void
  onTagChange?: (id: string | null) => void
  onAccountChange?: (id: string | null) => void
  onFundChange?: (id: string | null) => void
  // Optional: additional content to render inside the panel
  children?: React.ReactNode
}

// Individual filter button with selected value display
function FilterButton({
  label,
  icon: Icon,
  selectedLabel,
  selectedColor,
  isActive,
  onClick,
  onClear,
}: {
  label: string
  icon: React.ElementType
  selectedLabel?: string
  selectedColor?: string
  isActive: boolean
  onClick: () => void
  onClear: () => void
}) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 h-10 px-3 rounded-lg border transition-all duration-200',
          'text-sm whitespace-nowrap',
          isActive
            ? [
                'bg-primary/10 border-primary/40 text-foreground',
                'shadow-sm shadow-primary/15',
                'hover:bg-primary/15 hover:border-primary/50',
              ]
            : [
                'bg-background/60 border-border/50 text-muted-foreground',
                'hover:bg-muted/50 hover:border-border hover:text-foreground',
              ]
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />

        {isActive ? (
          <div className="flex items-center gap-2 min-w-0">
            {selectedColor && (
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-white/50"
                style={{ backgroundColor: selectedColor }}
              />
            )}
            <span className="font-medium truncate max-w-[120px]">{selectedLabel}</span>
          </div>
        ) : (
          <span>{label}</span>
        )}

        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </button>

      {/* Clear button overlay */}
      {isActive && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClear()
          }}
          className={cn(
            'absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full',
            'bg-destructive/90 text-destructive-foreground',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100',
            'hover:bg-destructive hover:scale-110',
            'transition-all duration-150 shadow-sm',
            'z-10'
          )}
        >
          <X className="h-3 w-3" />
        </motion.button>
      )}
    </div>
  )
}

// Filter dropdown with search
function FilterDropdown<T extends { id: string }>({
  open,
  onOpenChange,
  items,
  selectedId,
  onSelect,
  renderItem,
  searchPlaceholder,
  emptyText,
  trigger,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: T[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  renderItem: (item: T, isSelected: boolean) => React.ReactNode
  searchPlaceholder: string
  emptyText: string
  trigger: React.ReactNode
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-10" />
          <CommandList className="max-h-64">
            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {/* "All" option */}
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onSelect(null)
                  onOpenChange(false)
                }}
                className="flex items-center gap-3 py-2.5 cursor-pointer"
              >
                <div className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border',
                  !selectedId
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/30'
                )}>
                  {!selectedId && <Check className="h-3.5 w-3.5" />}
                </div>
                <span className={cn(!selectedId && 'font-medium')}>Все</span>
              </CommandItem>

              {/* Items */}
              {items.map((item) => {
                const isSelected = selectedId === item.id
                return (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onSelect(item.id)
                      onOpenChange(false)
                    }}
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                  >
                    <div className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border shrink-0',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                    )}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    {renderItem(item, isSelected)}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function FiltersPanel({
  categories = [],
  tags = [],
  accounts = [],
  funds = [],
  selectedCategoryId = null,
  selectedTagId = null,
  selectedAccountId = null,
  selectedFundId = null,
  onCategoryChange,
  onTagChange,
  onAccountChange,
  onFundChange,
  children,
}: FiltersPanelProps) {
  // Dropdown open states
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [fundOpen, setFundOpen] = useState(false)

  // Selected items
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const selectedTag = tags.find((t) => t.id === selectedTagId)
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
  const selectedFund = funds.find((f) => f.fund.id === selectedFundId)

  // Count active filters
  const activeCount = [
    selectedCategoryId,
    selectedTagId,
    selectedAccountId,
    selectedFundId,
  ].filter(Boolean).length

  const clearAllFilters = useCallback(() => {
    onCategoryChange?.(null)
    onTagChange?.(null)
    onAccountChange?.(null)
    onFundChange?.(null)
  }, [onCategoryChange, onTagChange, onAccountChange, onFundChange])

  // Check which filters are available
  const hasCategories = categories.length > 0 && onCategoryChange
  const hasTags = tags.length > 0 && onTagChange
  const hasAccounts = accounts.length > 0 && onAccountChange
  const hasFunds = funds.length > 0 && onFundChange
  const hasAnyFilter = hasCategories || hasTags || hasAccounts || hasFunds

  if (!hasAnyFilter && !children) {
    return null
  }

  return (
    <Card className="border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3 p-3">
        {/* Filter Label */}
        <div className="flex items-center gap-2 pr-2 border-r border-border/50">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            activeCount > 0 ? 'bg-primary/15' : 'bg-muted/50'
          )}>
            <SlidersHorizontal className={cn(
              'h-4 w-4',
              activeCount > 0 ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-xs font-semibold bg-primary/15 text-primary border-0"
            >
              {activeCount}
            </Badge>
          )}
        </div>

        {/* Additional children (e.g., custom filters) */}
        {children}

        {/* Category Filter */}
        {hasCategories && (
          <FilterDropdown
            open={categoryOpen}
            onOpenChange={setCategoryOpen}
            items={categories}
            selectedId={selectedCategoryId}
            onSelect={onCategoryChange}
            searchPlaceholder="Найти категорию..."
            emptyText="Категории не найдены"
            renderItem={(category, isSelected) => (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CategoryIcon
                  code={category.code}
                  iconName={category.icon}
                  color={category.color}
                  size="sm"
                />
                <span className={cn('truncate', isSelected && 'font-medium')}>
                  {category.name}
                </span>
              </div>
            )}
            trigger={
              <div>
                <FilterButton
                  label="Категория"
                  icon={FolderOpen}
                  selectedLabel={selectedCategory?.name}
                  selectedColor={selectedCategory?.color}
                  isActive={!!selectedCategoryId}
                  onClick={() => setCategoryOpen(true)}
                  onClear={() => onCategoryChange(null)}
                />
              </div>
            }
          />
        )}

        {/* Tag Filter */}
        {hasTags && (
          <FilterDropdown
            open={tagOpen}
            onOpenChange={setTagOpen}
            items={tags}
            selectedId={selectedTagId}
            onSelect={onTagChange}
            searchPlaceholder="Найти метку..."
            emptyText="Метки не найдены"
            renderItem={(tag, isSelected) => (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className={cn('truncate', isSelected && 'font-medium')}>
                  {tag.name}
                </span>
              </div>
            )}
            trigger={
              <div>
                <FilterButton
                  label="Метка"
                  icon={Tag}
                  selectedLabel={selectedTag?.name}
                  selectedColor={selectedTag?.color}
                  isActive={!!selectedTagId}
                  onClick={() => setTagOpen(true)}
                  onClear={() => onTagChange(null)}
                />
              </div>
            }
          />
        )}

        {/* Account Filter */}
        {hasAccounts && (
          <FilterDropdown
            open={accountOpen}
            onOpenChange={setAccountOpen}
            items={accounts}
            selectedId={selectedAccountId}
            onSelect={onAccountChange}
            searchPlaceholder="Найти счёт..."
            emptyText="Счета не найдены"
            renderItem={(account, isSelected) => (
              <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                <span className={cn('truncate', isSelected && 'font-medium')}>
                  {account.name}
                </span>
                <Badge variant="outline" className="text-xs shrink-0 font-mono">
                  {account.currency}
                </Badge>
              </div>
            )}
            trigger={
              <div>
                <FilterButton
                  label="Счёт"
                  icon={Wallet}
                  selectedLabel={selectedAccount ? `${selectedAccount.name} (${selectedAccount.currency})` : undefined}
                  isActive={!!selectedAccountId}
                  onClick={() => setAccountOpen(true)}
                  onClear={() => onAccountChange(null)}
                />
              </div>
            }
          />
        )}

        {/* Fund Filter */}
        {hasFunds && (
          <FilterDropdown
            open={fundOpen}
            onOpenChange={setFundOpen}
            items={funds.map((f) => ({ ...f.fund, id: f.fund.id }))}
            selectedId={selectedFundId}
            onSelect={onFundChange}
            searchPlaceholder="Найти фонд..."
            emptyText="Фонды не найдены"
            renderItem={(fund, isSelected) => (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: (fund as { color: string }).color }}
                />
                <span className={cn('truncate', isSelected && 'font-medium')}>
                  {(fund as { name: string }).name}
                </span>
              </div>
            )}
            trigger={
              <div>
                <FilterButton
                  label="Фонд"
                  icon={Landmark}
                  selectedLabel={selectedFund?.fund.name}
                  selectedColor={selectedFund?.fund.color}
                  isActive={!!selectedFundId}
                  onClick={() => setFundOpen(true)}
                  onClear={() => onFundChange(null)}
                />
              </div>
            }
          />
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear All */}
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-3.5 w-3.5" />
                Сбросить все
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}
