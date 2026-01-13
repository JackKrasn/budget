import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transfersApi } from '@/lib/api'
import type { CreateTransferRequest, TransfersListParams } from '@/lib/api'
import { toast } from 'sonner'
import { accountKeys } from './use-accounts'

// === Query Keys ===

export const transferKeys = {
  all: ['transfers'] as const,
  lists: () => [...transferKeys.all, 'list'] as const,
  list: (params?: TransfersListParams) => [...transferKeys.lists(), params] as const,
  details: () => [...transferKeys.all, 'detail'] as const,
  detail: (id: string) => [...transferKeys.details(), id] as const,
}

// === Transfers Hooks ===

/**
 * Получить список переводов
 */
export function useTransfers(params?: TransfersListParams) {
  return useQuery({
    queryKey: transferKeys.list(params),
    queryFn: () => transfersApi.list(params),
  })
}

/**
 * Получить перевод по ID
 */
export function useTransfer(id: string) {
  return useQuery({
    queryKey: transferKeys.detail(id),
    queryFn: () => transfersApi.get(id),
    enabled: !!id,
  })
}

/**
 * Создать перевод между счетами
 */
export function useCreateTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTransferRequest) => transfersApi.create(data),
    onSuccess: async () => {
      // Invalidate both transfers and accounts lists
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transferKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: accountKeys.lists() }),
      ])
      toast.success('Перевод выполнен')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить перевод
 */
export function useDeleteTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => transfersApi.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transferKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: accountKeys.lists() }),
      ])
      toast.success('Перевод удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
