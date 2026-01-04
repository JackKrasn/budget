import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
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
import { CategoryIcon } from '@/components/common'
import { cn } from '@/lib/utils'
import type { ExpenseCategoryWithTags } from '@/lib/api/types'

interface CategoryFilterProps {
  categories: ExpenseCategoryWithTags[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function CategoryFilter({
  categories,
  selectedId,
  onSelect,
}: CategoryFilterProps) {
  const [open, setOpen] = useState(false)

  const selectedCategory = categories.find((c) => c.id === selectedId)

  const handleSelect = (categoryId: string) => {
    // Toggle: если уже выбрана — сбросить
    if (selectedId === categoryId) {
      onSelect(null)
    } else {
      onSelect(categoryId)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between min-w-[180px]"
        >
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              <CategoryIcon
                code={selectedCategory.code}
                iconName={selectedCategory.icon}
                color={selectedCategory.color}
                size="sm"
              />
              {selectedCategory.name}
            </div>
          ) : (
            'Все категории'
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск категории..." />
          <CommandList>
            <CommandEmpty>Категория не найдена</CommandEmpty>
            <CommandGroup>
              {/* Опция "Все категории" */}
              <CommandItem
                value="all"
                onSelect={() => {
                  onSelect(null)
                  setOpen(false)
                }}
                className="cursor-pointer"
              >
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-full border',
                    !selectedId
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {!selectedId && <Check className="h-3 w-3" />}
                </div>
                <span className="flex-1">Все категории</span>
              </CommandItem>

              {categories.map((category) => {
                const isSelected = selectedId === category.id
                return (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleSelect(category.id)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-full border',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <CategoryIcon
                      code={category.code}
                      iconName={category.icon}
                      color={category.color}
                      size="sm"
                      className="mr-2"
                    />
                    <span className="flex-1">{category.name}</span>
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
