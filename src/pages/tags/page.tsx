import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Tag,
  Check,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useExpenseTags,
  useCreateExpenseTag,
  useUpdateExpenseTag,
  useDeleteExpenseTag,
} from '@/features/expenses/hooks'
import type { ExpenseTag } from '@/lib/api/types'
import { cn } from '@/lib/utils'

// Палитра цветов для меток
const TAG_COLORS = [
  { name: 'Красный', value: '#ef4444' },
  { name: 'Оранжевый', value: '#f97316' },
  { name: 'Янтарный', value: '#f59e0b' },
  { name: 'Жёлтый', value: '#eab308' },
  { name: 'Лайм', value: '#84cc16' },
  { name: 'Зелёный', value: '#22c55e' },
  { name: 'Изумрудный', value: '#10b981' },
  { name: 'Бирюзовый', value: '#14b8a6' },
  { name: 'Циан', value: '#06b6d4' },
  { name: 'Голубой', value: '#0ea5e9' },
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Индиго', value: '#6366f1' },
  { name: 'Фиолетовый', value: '#8b5cf6' },
  { name: 'Пурпурный', value: '#a855f7' },
  { name: 'Фуксия', value: '#d946ef' },
  { name: 'Розовый', value: '#ec4899' },
]

interface TagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag?: ExpenseTag
  onSubmit: (data: { name: string; color: string }) => Promise<void>
  isPending: boolean
}

function TagDialog({ open, onOpenChange, tag, onSubmit, isPending }: TagDialogProps) {
  const [name, setName] = useState(tag?.name ?? '')
  const [color, setColor] = useState(tag?.color ?? TAG_COLORS[10].value)

  // Reset form when dialog opens/closes or tag changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(tag?.name ?? '')
      setColor(tag?.color ?? TAG_COLORS[10].value)
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onSubmit({ name: name.trim(), color })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tag ? 'Редактировать метку' : 'Новая метка'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Название</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название метки"
              autoFocus
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Цвет</label>
            <div className="grid grid-cols-8 gap-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'h-8 w-8 rounded-full relative flex-shrink-0 transition-transform hover:scale-110',
                    'focus:outline-none',
                    color === c.value && 'ring-2 ring-offset-2 ring-offset-background'
                  )}
                  style={{
                    backgroundColor: c.value,
                    ['--tw-ring-color' as string]: c.value,
                  }}
                >
                  {color === c.value && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {name.trim() && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Превью:</span>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${color}15`,
                  color: color,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {name.trim()}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isPending}
            >
              {isPending ? 'Сохранение...' : tag ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function TagsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<ExpenseTag | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTag, setDeletingTag] = useState<ExpenseTag | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  const { data: tagsData, isLoading, error, refetch } = useExpenseTags()
  const createTag = useCreateExpenseTag()
  const updateTag = useUpdateExpenseTag()
  const deleteTag = useDeleteExpenseTag()

  const tags = tagsData?.data ?? []

  // Filter tags by search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags
    const query = searchQuery.toLowerCase()
    return tags.filter(tag => tag.name.toLowerCase().includes(query))
  }, [tags, searchQuery])

  const handleCreate = () => {
    setEditingTag(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (tag: ExpenseTag) => {
    setEditingTag(tag)
    setDialogOpen(true)
  }

  const handleDelete = (tag: ExpenseTag) => {
    setDeletingTag(tag)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingTag) return

    try {
      await deleteTag.mutateAsync(deletingTag.id)
      setDeleteDialogOpen(false)
      setDeletingTag(null)
    } catch {
      // Error handled in mutation
    }
  }

  const handleSubmit = async (data: { name: string; color: string }) => {
    if (editingTag) {
      await updateTag.mutateAsync({
        id: editingTag.id,
        data,
      })
    } else {
      await createTag.mutateAsync(data)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Метки
          </h1>
          <p className="mt-1 text-muted-foreground">
            Управление метками для дополнительной классификации расходов
          </p>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Новая метка
        </Button>
      </motion.div>

      {/* Search */}
      {!isLoading && !error && tags.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск меток..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Ошибка загрузки: {error.message}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Tags as badges */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {filteredTags.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {filteredTags.map((tag) => {
                  const isSelected = selectedTagId === tag.id
                  return (
                    <motion.button
                      key={tag.id}
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedTagId(isSelected ? null : tag.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                        'border-2',
                        isSelected
                          ? 'shadow-md'
                          : 'hover:shadow-sm'
                      )}
                      style={{
                        backgroundColor: `${tag.color}${isSelected ? '25' : '15'}`,
                        color: tag.color,
                        borderColor: isSelected ? tag.color : 'transparent',
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </motion.button>
                  )
                })}
              </div>

              {/* Actions panel for selected tag */}
              {selectedTagId && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm"
                >
                  {(() => {
                    const tag = tags.find(t => t.id === selectedTagId)
                    if (!tag) return null
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${tag.color}20` }}
                          >
                            <Tag className="h-5 w-5" style={{ color: tag.color }} />
                          </div>
                          <div>
                            <p className="font-medium">{tag.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Нажмите ещё раз чтобы снять выделение
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(tag)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Редактировать
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(tag)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Удалить
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Удаление снимет метку со всех расходов</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    )
                  })()}
                </motion.div>
              )}

              <div className="mt-4 text-sm text-muted-foreground">
                {searchQuery ? (
                  <>Найдено: {filteredTags.length} из {tags.length}</>
                ) : (
                  <>Всего меток: {tags.length}</>
                )}
              </div>
            </>
          ) : searchQuery ? (
            <div className="py-12 text-center text-muted-foreground rounded-lg border border-dashed border-border/50">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Ничего не найдено</p>
              <p className="text-sm mt-1">Попробуйте изменить поисковый запрос</p>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground rounded-lg border border-dashed border-border/50">
              <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Нет меток</p>
              <p className="text-sm mt-1">Создайте метку для классификации расходов</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Tag Dialog */}
      <TagDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tag={editingTag}
        onSubmit={handleSubmit}
        isPending={createTag.isPending || updateTag.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить метку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить метку &quot;{deletingTag?.name}&quot;?
              <br />
              <span className="text-amber-500">
                Метка будет снята со всех расходов, где она была использована.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
