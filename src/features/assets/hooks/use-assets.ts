import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetsApi } from '@/lib/api'
import type {
  AssetsListParams,
  CreateAssetRequest,
  UpdateAssetRequest,
  UpdateAssetPriceRequest,
} from '@/lib/api'
import { toast } from 'sonner'

// === Query Keys ===

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (params?: AssetsListParams) => [...assetKeys.lists(), params] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
}

// === Hooks ===

/**
 * Получить список активов
 */
export function useAssets(params?: AssetsListParams) {
  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: () => assetsApi.list(params),
  })
}

/**
 * Получить актив по ID
 */
export function useAsset(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => assetsApi.get(id),
    enabled: !!id,
  })
}

/**
 * Создать новый актив
 */
export function useCreateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAssetRequest) => assetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      toast.success('Актив создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить актив
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetRequest }) =>
      assetsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) })
      toast.success('Актив обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить актив
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      toast.success('Актив удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить цену актива
 */
export function useUpdateAssetPrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetPriceRequest }) =>
      assetsApi.updatePrice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) })
      toast.success('Цена обновлена')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
