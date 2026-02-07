import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowDown, Check, ChevronsUpDown, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'
import { useAccounts } from '@/features/accounts'
import { useExpenseCategories } from '@/features/expenses'
import {
  useExpenseTags,
  useCreateExpenseTag,
} from '@/features/expenses/hooks/use-expense-tags'
import { useCreateExpenseCategory } from '@/features/expenses/hooks/use-expense-categories'
import { AccountIcon } from '@/components/ui/account-icon'
import { getIconByName } from '@/lib/icon-registry'
import type { UnmappedItemType } from '@/lib/api/types'

const formSchema = z.object({
  externalName: z.string().min(1, 'Введите название'),
  targetId: z.string().min(1, 'Выберите соответствие'),
})

type FormValues = z.infer<typeof formSchema>

interface MappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: UnmappedItemType
  defaultExternalName?: string
  onSubmit: (externalName: string, targetId: string) => Promise<void>
  isPending?: boolean
}

function getTypeLabels(type: UnmappedItemType) {
  switch (type) {
    case 'account':
      return {
        title: 'Добавить маппинг счёта',
        description: 'Укажите соответствие между названием в CoinKeeper и счётом в Budget',
        targetLabel: 'Счёт в Budget',
        searchPlaceholder: 'Поиск счёта...',
        emptyMessage: 'Счёт не найден',
        selectPlaceholder: 'Выберите счёт',
      }
    case 'category':
      return {
        title: 'Добавить маппинг категории',
        description: 'Укажите соответствие между названием в CoinKeeper и категорией в Budget',
        targetLabel: 'Категория в Budget',
        searchPlaceholder: 'Поиск категории...',
        emptyMessage: 'Категория не найдена',
        selectPlaceholder: 'Выберите категорию',
      }
    case 'tag':
      return {
        title: 'Добавить маппинг тега',
        description: 'Укажите соответствие между названием в CoinKeeper и тегом в Budget',
        targetLabel: 'Тег в Budget',
        searchPlaceholder: 'Поиск тега...',
        emptyMessage: 'Тег не найден',
        selectPlaceholder: 'Выберите тег',
      }
  }
}

// Generate a random color for new categories/tags
function generateRandomColor(): string {
  const colors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
    '#ec4899', '#06b6d4', '#ef4444', '#84cc16',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function MappingDialog({
  open,
  onOpenChange,
  type,
  defaultExternalName,
  onSubmit,
  isPending,
}: MappingDialogProps) {
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [autoMatchFailed, setAutoMatchFailed] = useState(false)

  const { data: accountsData } = useAccounts()
  const { data: categoriesData } = useExpenseCategories()
  const { data: tagsData } = useExpenseTags()

  const createCategory = useCreateExpenseCategory()
  const createTag = useCreateExpenseTag()

  const accounts = accountsData?.data ?? []
  const categories = categoriesData?.data ?? []
  const tags = tagsData?.data ?? []

  const labels = getTypeLabels(type)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      externalName: defaultExternalName ?? '',
      targetId: '',
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        externalName: defaultExternalName ?? '',
        targetId: '',
      })
      setSearchValue('')
      setAutoMatchFailed(false)
    }
  }, [open, defaultExternalName, form])

  // Auto-match category or tag by name when data is loaded
  useEffect(() => {
    if (!open || !defaultExternalName) return

    // Skip if already selected
    const currentTargetId = form.getValues('targetId')
    if (currentTargetId) return

    const normalizedName = defaultExternalName.toLowerCase().trim()

    if (type === 'category' && categories.length > 0) {
      const match = categories.find(
        (c) => c.name.toLowerCase().trim() === normalizedName
      )
      if (match) {
        form.setValue('targetId', match.id)
        setAutoMatchFailed(false)
      } else {
        setAutoMatchFailed(true)
      }
    } else if (type === 'tag' && tags.length > 0) {
      const match = tags.find(
        (t) => t.name.toLowerCase().trim() === normalizedName
      )
      if (match) {
        form.setValue('targetId', match.id)
        setAutoMatchFailed(false)
      } else {
        setAutoMatchFailed(true)
      }
    }
  }, [open, defaultExternalName, form, type, categories, tags])

  const selectedTargetId = form.watch('targetId')

  const getSelectedLabel = () => {
    switch (type) {
      case 'account': {
        const account = accounts.find((a) => a.id === selectedTargetId)
        return account?.name
      }
      case 'category': {
        const category = categories.find((c) => c.id === selectedTargetId)
        return category?.name
      }
      case 'tag': {
        const tag = tags.find((t) => t.id === selectedTargetId)
        return tag?.name
      }
    }
  }

  async function handleSubmit(values: FormValues) {
    await onSubmit(values.externalName, values.targetId)
    onOpenChange(false)
  }

  async function handleCreateCategory(name: string) {
    try {
      // Generate code from name (transliterate or use as is)
      const code = name.toLowerCase().replace(/\s+/g, '_')
      const result = await createCategory.mutateAsync({
        code,
        name,
        icon: 'tag',
        color: generateRandomColor(),
      })
      form.setValue('targetId', result.id)
      setComboboxOpen(false)
      setSearchValue('')
    } catch {
      // Error handled in mutation
    }
  }

  async function handleCreateTag(name: string) {
    try {
      const result = await createTag.mutateAsync({
        name,
        color: generateRandomColor(),
      })
      form.setValue('targetId', result.id)
      setComboboxOpen(false)
      setSearchValue('')
    } catch {
      // Error handled in mutation
    }
  }

  const isCreating = createCategory.isPending || createTag.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="externalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название в CoinKeeper</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: VTB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col items-center gap-1 py-2">
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
              {autoMatchFailed && (type === 'category' || type === 'tag') && (
                <p className="text-xs text-muted-foreground">
                  Не удалось найти совпадение — выберите или создайте
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="targetId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{labels.targetLabel}</FormLabel>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className={cn(
                            'w-full justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? getSelectedLabel() : labels.selectPlaceholder}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder={labels.searchPlaceholder}
                          value={searchValue}
                          onValueChange={setSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="py-2 text-center">
                              <p className="text-sm text-muted-foreground mb-2">
                                {labels.emptyMessage}
                              </p>
                              {type === 'category' && searchValue && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCreateCategory(searchValue)}
                                  disabled={isCreating}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  {isCreating ? 'Создание...' : `Создать "${searchValue}"`}
                                </Button>
                              )}
                              {type === 'tag' && searchValue && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCreateTag(searchValue)}
                                  disabled={isCreating}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  {isCreating ? 'Создание...' : `Создать "${searchValue}"`}
                                </Button>
                              )}
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {type === 'account' &&
                              accounts.map((account) => (
                                <CommandItem
                                  key={account.id}
                                  value={account.name}
                                  onSelect={() => {
                                    field.onChange(account.id)
                                    setComboboxOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value === account.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  <AccountIcon
                                    bankName={account.bank_name}
                                    typeCode={account.type_code}
                                    color={account.color}
                                    size="sm"
                                    showBackground={false}
                                    className="mr-2"
                                  />
                                  <span className="flex-1">{account.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {account.currency}
                                  </span>
                                </CommandItem>
                              ))}

                            {type === 'category' &&
                              categories.map((category) => {
                                const Icon = getIconByName(category.icon)
                                return (
                                  <CommandItem
                                    key={category.id}
                                    value={category.name}
                                    onSelect={() => {
                                      field.onChange(category.id)
                                      setComboboxOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        field.value === category.id ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    <div
                                      className="mr-2 flex h-6 w-6 items-center justify-center rounded-md"
                                      style={{ backgroundColor: `${category.color}20` }}
                                    >
                                      <Icon
                                        className="h-3.5 w-3.5"
                                        style={{ color: category.color }}
                                      />
                                    </div>
                                    <span>{category.name}</span>
                                  </CommandItem>
                                )
                              })}

                            {type === 'tag' &&
                              tags.map((tag) => (
                                <CommandItem
                                  key={tag.id}
                                  value={tag.name}
                                  onSelect={() => {
                                    field.onChange(tag.id)
                                    setComboboxOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value === tag.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  <div
                                    className="mr-2 h-3 w-3 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                  />
                                  <span>{tag.name}</span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
