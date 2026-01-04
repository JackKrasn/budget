import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fundsApi } from '@/lib/api'
import type {
  FundsListParams,
  CreateFundRequest,
  UpdateFundRequest,
  AddFundAssetRequest,
  UpdateFundAssetAmountRequest,
  CreateContributionRequest,
  CreateWithdrawalRequest,
  FundHistoryParams,
} from '@/lib/api'
import { toast } from 'sonner'

// === Query Keys ===

export const fundKeys = {
  all: ['funds'] as const,
  lists: () => [...fundKeys.all, 'list'] as const,
  list: (params?: FundsListParams) => [...fundKeys.lists(), params] as const,
  details: () => [...fundKeys.all, 'detail'] as const,
  detail: (id: string) => [...fundKeys.details(), id] as const,
  assets: (fundId: string) => [...fundKeys.detail(fundId), 'assets'] as const,
  contributions: (fundId: string) =>
    [...fundKeys.detail(fundId), 'contributions'] as const,
  withdrawals: (fundId: string) =>
    [...fundKeys.detail(fundId), 'withdrawals'] as const,
  history: (fundId: string, params?: FundHistoryParams) =>
    [...fundKeys.detail(fundId), 'history', params] as const,
}

// === Funds Hooks ===

/**
 * Получить список всех фондов с балансами
 */
export function useFunds(params?: FundsListParams) {
  return useQuery({
    queryKey: fundKeys.list(params),
    queryFn: () => fundsApi.list(params),
  })
}

/**
 * Получить фонд по ID
 */
export function useFund(id: string) {
  return useQuery({
    queryKey: fundKeys.detail(id),
    queryFn: () => fundsApi.get(id),
    enabled: !!id,
  })
}

/**
 * Создать новый фонд
 */
export function useCreateFund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFundRequest) => fundsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Фонд создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить фонд
 */
export function useUpdateFund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFundRequest }) =>
      fundsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      queryClient.invalidateQueries({ queryKey: fundKeys.detail(variables.id) })
      toast.success('Фонд обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить фонд
 */
export function useDeleteFund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => fundsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Фонд удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

// === Fund Assets Hooks ===

/**
 * Получить список активов в фонде
 */
export function useFundAssets(fundId: string) {
  return useQuery({
    queryKey: fundKeys.assets(fundId),
    queryFn: () => fundsApi.listAssets(fundId),
    enabled: !!fundId,
  })
}

/**
 * Добавить актив в фонд
 */
export function useAddFundAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fundId, data }: { fundId: string; data: AddFundAssetRequest }) =>
      fundsApi.addAsset(fundId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fundKeys.detail(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.assets(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Актив добавлен в фонд')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить количество актива в фонде
 */
export function useUpdateFundAssetAmount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      fundId,
      assetId,
      data,
    }: {
      fundId: string
      assetId: string
      data: UpdateFundAssetAmountRequest
    }) => fundsApi.updateAssetAmount(fundId, assetId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fundKeys.detail(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.assets(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Количество актива обновлено')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить актив из фонда
 */
export function useRemoveFundAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fundId, assetId }: { fundId: string; assetId: string }) =>
      fundsApi.removeAsset(fundId, assetId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fundKeys.detail(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.assets(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Актив удалён из фонда')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

// === Fund Contributions Hooks ===

/**
 * Получить список пополнений фонда
 */
export function useFundContributions(fundId: string) {
  return useQuery({
    queryKey: fundKeys.contributions(fundId),
    queryFn: () => fundsApi.listContributions(fundId),
    enabled: !!fundId,
  })
}

/**
 * Создать пополнение фонда
 */
export function useCreateContribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      fundId,
      data,
    }: {
      fundId: string
      data: CreateContributionRequest
    }) => fundsApi.createContribution(fundId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fundKeys.detail(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.contributions(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.assets(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Пополнение создано')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

// === Fund Withdrawals Hooks ===

/**
 * Получить список списаний из фонда
 */
export function useFundWithdrawals(fundId: string) {
  return useQuery({
    queryKey: fundKeys.withdrawals(fundId),
    queryFn: () => fundsApi.listWithdrawals(fundId),
    enabled: !!fundId,
  })
}

/**
 * Создать списание из фонда
 */
export function useCreateWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      fundId,
      data,
    }: {
      fundId: string
      data: CreateWithdrawalRequest
    }) => fundsApi.createWithdrawal(fundId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fundKeys.detail(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.withdrawals(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.assets(variables.fundId) })
      queryClient.invalidateQueries({ queryKey: fundKeys.lists() })
      toast.success('Списание создано')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

// === Fund History Hooks ===

/**
 * Получить историю операций фонда
 */
export function useFundHistory(fundId: string, params?: FundHistoryParams) {
  return useQuery({
    queryKey: fundKeys.history(fundId, params),
    queryFn: () => fundsApi.getHistory(fundId, params),
    enabled: !!fundId,
  })
}
