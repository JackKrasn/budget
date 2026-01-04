import { useState } from 'react'
import { X, Plus, Tag } from 'lucide-react'
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

interface TagSelectorProps {
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
]

export function TagSelector({ selectedTagIds, onTagsChange }: TagSelectorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0])
  const [popoverOpen, setPopoverOpen] = useState(false)

  const { data: tagsData } = useExpenseTags()
  const createTag = useCreateExpenseTag()

  const tags = tagsData?.data ?? []
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id))
  const availableTags = tags.filter((tag) => !selectedTagIds.includes(tag.id))

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onTagsChange([...selectedTagIds, tagId])
    }
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

      // Сбрасываем форму
      setNewTagName('')
      setNewTagColor(DEFAULT_COLORS[0])
      setIsCreating(false)
    } catch {
      // Ошибка обработана в хуке
    }
  }

  return (
    <div className="space-y-2">
      <Label>Метки</Label>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1 pr-1"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              borderColor: `${tag.color}40`,
            }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className="ml-1 rounded-full hover:bg-black/10 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Add tag button */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              <Tag className="mr-1 h-3 w-3" />
              Добавить метку
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-3">
              {!isCreating ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Выберите метку</p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {availableTags.length > 0 ? (
                        availableTags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent"
                            style={{
                              borderColor: tag.color,
                              color: tag.color,
                            }}
                            onClick={() => {
                              handleToggleTag(tag.id)
                              setPopoverOpen(false)
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Все метки уже выбраны
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Создать новую метку
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tag-name">Название метки</Label>
                    <Input
                      id="tag-name"
                      placeholder="Например: Личное"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCreateTag()
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Цвет</Label>
                    <div className="grid grid-cols-8 gap-2">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`h-7 w-7 rounded-md border-2 transition-all ${
                            newTagColor === color
                              ? 'border-foreground scale-110'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewTagColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIsCreating(false)
                        setNewTagName('')
                        setNewTagColor(DEFAULT_COLORS[0])
                      }}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim() || createTag.isPending}
                    >
                      {createTag.isPending ? 'Создание...' : 'Создать'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selectedTags.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Добавьте метки для классификации расхода
        </p>
      )}
    </div>
  )
}
