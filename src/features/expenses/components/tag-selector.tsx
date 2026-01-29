import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Plus, Tag, Search, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useExpenseTags, useCreateExpenseTag } from '../hooks'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
}

const TAG_COLORS = [
  { value: '#ef4444', name: 'Красный' },
  { value: '#f97316', name: 'Оранжевый' },
  { value: '#f59e0b', name: 'Янтарный' },
  { value: '#eab308', name: 'Жёлтый' },
  { value: '#84cc16', name: 'Лайм' },
  { value: '#22c55e', name: 'Зелёный' },
  { value: '#10b981', name: 'Изумруд' },
  { value: '#14b8a6', name: 'Бирюза' },
  { value: '#06b6d4', name: 'Циан' },
  { value: '#0ea5e9', name: 'Небо' },
  { value: '#3b82f6', name: 'Синий' },
  { value: '#6366f1', name: 'Индиго' },
  { value: '#8b5cf6', name: 'Фиолет' },
  { value: '#a855f7', name: 'Пурпур' },
  { value: '#d946ef', name: 'Фуксия' },
  { value: '#ec4899', name: 'Розовый' },
]

export function TagSelector({ selectedTagIds, onTagsChange }: TagSelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[10].value)

  const { data: tagsData } = useExpenseTags()
  const createTag = useCreateExpenseTag()

  const tags = tagsData?.data ?? []
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id))

  // Фильтруем метки по поисковому запросу
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return tags
    }
    const query = searchQuery.toLowerCase()
    return tags.filter((tag) => tag.name.toLowerCase().includes(query))
  }, [tags, searchQuery])

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onTagsChange([...selectedTagIds, tagId])
    }
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter((id) => id !== tagId))
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const newTag = await createTag.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor,
      })

      // Добавляем новый тег в выбранные
      onTagsChange([...selectedTagIds, newTag.id])

      // Сбрасываем форму создания
      setNewTagName('')
      setNewTagColor(TAG_COLORS[10].value)
      setIsCreating(false)
    } catch {
      // Ошибка обработана в хуке
    }
  }

  const handleOpenChange = (open: boolean) => {
    setPopoverOpen(open)
    if (!open) {
      // Сбрасываем состояние при закрытии
      setIsCreating(false)
      setSearchQuery('')
      setNewTagName('')
      setNewTagColor(TAG_COLORS[10].value)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">Метки</Label>

      {/* Selected tags display */}
      <div className="flex flex-wrap items-center gap-1.5">
        <AnimatePresence mode="popLayout">
          {selectedTags.map((tag) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              layout
            >
              <Badge
                variant="secondary"
                className="gap-1 pr-1 h-6 text-xs font-medium border transition-all hover:shadow-sm"
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  borderColor: `${tag.color}30`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add tag trigger */}
        <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-6 px-2 text-xs gap-1 border-dashed transition-all',
                'hover:border-solid hover:bg-accent/50',
                selectedTags.length === 0 && 'border-muted-foreground/30'
              )}
            >
              <Tag className="h-3 w-3" />
              {selectedTags.length === 0 ? 'Добавить метку' : 'Ещё'}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-72 p-0 overflow-hidden"
            align="start"
            sideOffset={8}
          >
            {/* Search header */}
            <div className="p-2.5 border-b bg-muted/30">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  placeholder="Поиск меток..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-sm bg-background border-border/50 focus-visible:ring-1"
                />
              </div>
            </div>

            {/* Tags list with checkboxes */}
            <ScrollArea className="h-48">
              <div className="p-1.5">
                {filteredTags.length > 0 ? (
                  <div className="space-y-0.5">
                    {filteredTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleToggleTag(tag.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-all',
                            'hover:bg-accent/60',
                            isSelected && 'bg-accent/40'
                          )}
                        >
                          {/* Custom checkbox indicator */}
                          <div
                            className={cn(
                              'flex items-center justify-center h-4 w-4 rounded border-2 transition-all flex-shrink-0',
                              isSelected
                                ? 'border-transparent'
                                : 'border-muted-foreground/30 bg-background'
                            )}
                            style={{
                              backgroundColor: isSelected ? tag.color : undefined,
                            }}
                          >
                            {isSelected && (
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            )}
                          </div>

                          {/* Tag color dot */}
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: tag.color,
                              boxShadow: `0 0 0 2px ${tag.color}40`,
                            }}
                          />

                          {/* Tag name */}
                          <span className="text-sm flex-1 truncate font-medium">
                            {tag.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Tag className="h-6 w-6 text-muted-foreground/30 mb-1.5" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'Метки не найдены' : 'Нет доступных меток'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Create new tag section - expands below the list */}
            <div className="border-t bg-muted/20">
              {!isCreating ? (
                <div className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 text-sm font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      // Переносим поисковый запрос в название новой метки
                      setNewTagName(searchQuery.trim())
                      setSearchQuery('')
                      setIsCreating(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {searchQuery.trim()
                      ? `Создать "${searchQuery.trim()}"`
                      : 'Создать новую метку'}
                  </Button>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Новая метка
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false)
                        setNewTagName('')
                        setNewTagColor(TAG_COLORS[10].value)
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Отмена
                    </button>
                  </div>

                  {/* Name input with inline button */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Название метки"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTagName.trim()) {
                          e.preventDefault()
                          handleCreateTag()
                        }
                        if (e.key === 'Escape') {
                          setIsCreating(false)
                          setNewTagName('')
                          setNewTagColor(TAG_COLORS[10].value)
                        }
                      }}
                      className="h-8 text-sm flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 px-3 text-white shrink-0"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim() || createTag.isPending}
                      style={{
                        backgroundColor: newTagColor,
                        borderColor: newTagColor,
                      }}
                    >
                      {createTag.isPending ? '...' : 'OK'}
                    </Button>
                  </div>

                  {/* Color picker - grid layout */}
                  <div className="grid grid-cols-8 gap-1.5">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        title={color.name}
                        onClick={() => setNewTagColor(color.value)}
                        className={cn(
                          'h-6 w-6 rounded-full relative flex-shrink-0',
                          'focus:outline-none',
                          newTagColor === color.value && 'ring-2 ring-offset-2 ring-offset-background'
                        )}
                        style={{
                          backgroundColor: color.value,
                          ['--tw-ring-color' as string]: color.value,
                        }}
                      >
                        {newTagColor === color.value && (
                          <Check className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow-sm" strokeWidth={3} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Preview */}
                  {newTagName.trim() && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Превью:</span>
                      <Badge
                        variant="secondary"
                        className="h-5 text-xs font-medium border"
                        style={{
                          backgroundColor: `${newTagColor}15`,
                          color: newTagColor,
                          borderColor: `${newTagColor}30`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full mr-1"
                          style={{ backgroundColor: newTagColor }}
                        />
                        {newTagName.trim()}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
