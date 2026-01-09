import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetTypesApi } from '@/lib/api'
import type { CreateAssetTypeRequest, UpdateAssetTypeRequest } from '@/lib/api'
import { toast } from 'sonner'

// === Query Keys ===

export const assetTypeKeys = {
  all: ['asset-types'] as const,
  lists: () => [...assetTypeKeys.all, 'list'] as const,
  list: () => [...assetTypeKeys.lists()] as const,
  details: () => [...assetTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetTypeKeys.details(), id] as const,
}

// === Hooks ===

/**
 * Получить список типов активов
 */
export function useAssetTypes() {
  return useQuery({
    queryKey: assetTypeKeys.list(),
    queryFn: () => assetTypesApi.list(),
  })
}

/**
 * Получить тип актива по ID
 */
export function useAssetType(id: string) {
  return useQuery({
    queryKey: assetTypeKeys.detail(id),
    queryFn: () => assetTypesApi.get(id),
    enabled: !!id,
  })
}

/**
 * Создать новый тип актива
 */
export function useCreateAssetType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAssetTypeRequest) => assetTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetTypeKeys.lists() })
      toast.success('Тип актива создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить тип актива
 */
export function useUpdateAssetType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetTypeRequest }) =>
      assetTypesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetTypeKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: assetTypeKeys.detail(variables.id),
      })
      toast.success('Тип актива обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить тип актива
 */
export function useDeleteAssetType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => assetTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetTypeKeys.lists() })
      toast.success('Тип актива удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
