import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { depositsApi } from '@/lib/api'
import type {
  DepositsListParams,
  CreateDepositRequest,
  UpdateDepositRequest,
  MaturingDepositsParams,
  MigrateDepositRequest,
} from '@/lib/api'
import { toast } from 'sonner'
import { fundKeys } from '@/features/funds/hooks'

// === Query Keys ===

export const depositKeys = {
  all: ['deposits'] as const,
  lists: () => [...depositKeys.all, 'list'] as const,
  list: (params?: DepositsListParams) => [...depositKeys.lists(), params] as const,
  details: () => [...depositKeys.all, 'detail'] as const,
  detail: (id: string) => [...depositKeys.details(), id] as const,
  byAssetId: (assetId: string) => [...depositKeys.all, 'byAsset', assetId] as const,
  accruals: (id: string) => [...depositKeys.detail(id), 'accruals'] as const,
  summary: () => [...depositKeys.all, 'summary'] as const,
  maturing: (params?: MaturingDepositsParams) => [...depositKeys.all, 'maturing', params] as const,
}

// === Hooks ===

/**
 * Получить список депозитов
 */
export function useDeposits(params?: DepositsListParams) {
  return useQuery({
    queryKey: depositKeys.list(params),
    queryFn: () => depositsApi.list(params),
  })
}

/**
 * Получить депозит по ID
 */
export function useDeposit(id: string) {
  return useQuery({
    queryKey: depositKeys.detail(id),
    queryFn: () => depositsApi.get(id),
    enabled: !!id,
  })
}

/**
 * Найти депозит по ID актива
 */
export function useDepositByAssetId(assetId: string) {
  return useQuery({
    queryKey: depositKeys.byAssetId(assetId),
    queryFn: async () => {
      const response = await depositsApi.list()
      const deposit = response.data.find((d) => d.assetId === assetId)
      return deposit || null
    },
    enabled: !!assetId,
  })
}

/**
 * Получить историю начислений депозита
 */
export function useDepositAccruals(id: string) {
  return useQuery({
    queryKey: depositKeys.accruals(id),
    queryFn: () => depositsApi.getAccruals(id),
    enabled: !!id,
  })
}

/**
 * Получить статистику по депозитам
 */
export function useDepositsSummary() {
  return useQuery({
    queryKey: depositKeys.summary(),
    queryFn: () => depositsApi.getSummary(),
  })
}

/**
 * Получить депозиты с истекающим сроком
 */
export function useMaturingDeposits(params?: MaturingDepositsParams) {
  return useQuery({
    queryKey: depositKeys.maturing(params),
    queryFn: () => depositsApi.getMaturing(params),
  })
}

/**
 * Создать новый депозит
 */
export function useCreateDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDepositRequest) => depositsApi.create(data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: depositKeys.lists() })
      queryClient.invalidateQueries({ queryKey: depositKeys.summary() })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Депозит создан')
    },
    onError: (error: { message: string; response?: { data?: { error?: string } } }) => {
      const errorMessage = error.response?.data?.error || error.message

      if (errorMessage.includes('does not have currency asset')) {
        const currencyMatch = errorMessage.match(/currency asset (\w+)/)
        const currency = currencyMatch ? currencyMatch[1] : ''
        toast.error(
          `В фонде нет валютного актива ${currency}. Сначала пополните фонд через перевод со счёта.`
        )
      } else if (errorMessage.includes('Insufficient funds')) {
        toast.error('Недостаточно средств в валютном активе.')
      } else {
        toast.error(`Ошибка: ${errorMessage}`)
      }
    },
  })
}

/**
 * Обновить депозит
 */
export function useUpdateDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepositRequest }) =>
      depositsApi.update(id, data),
    onSuccess: async (_, variables) => {
      // Refetch чтобы данные точно обновились
      await queryClient.refetchQueries({ queryKey: depositKeys.lists() })
      await queryClient.refetchQueries({ queryKey: depositKeys.detail(variables.id) })
      // Также обновляем данные фондов, т.к. депозиты отображаются там
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Депозит обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить депозит
 */
export function useDeleteDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => depositsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: depositKeys.lists() })
      queryClient.invalidateQueries({ queryKey: depositKeys.summary() })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Депозит удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Досрочно закрыть депозит
 */
export function useCloseDepositEarly() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => depositsApi.closeEarly(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: depositKeys.lists() })
      queryClient.invalidateQueries({ queryKey: depositKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: depositKeys.summary() })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Депозит закрыт досрочно')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Начислить проценты (административная функция)
 */
export function useProcessAccruals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => depositsApi.processAccruals(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: depositKeys.all })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Проценты начислены')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Мигрировать существующий депозит (без проверки баланса)
 */
export function useMigrateDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MigrateDepositRequest) => depositsApi.migrate(data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: depositKeys.lists() })
      queryClient.invalidateQueries({ queryKey: depositKeys.summary() })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Депозит успешно мигрирован')
    },
    onError: (error) => {
      toast.error(`Ошибка миграции: ${error.message}`)
    },
  })
}
