import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi, accountTypesApi } from '@/lib/api'
import type { CreateAccountRequest, UpdateAccountRequest, ApplyReservesRequest, RepayRequest } from '@/lib/api'
import { toast } from 'sonner'

// === Query Keys ===

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: () => [...accountKeys.lists()] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
  reserves: (id: string) => [...accountKeys.all, 'reserves', id] as const,
}

export const accountTypeKeys = {
  all: ['accountTypes'] as const,
  lists: () => [...accountTypeKeys.all, 'list'] as const,
  list: () => [...accountTypeKeys.lists()] as const,
  details: () => [...accountTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountTypeKeys.details(), id] as const,
}

// === Accounts Hooks ===

/**
 * Получить список всех счетов
 */
export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: () => accountsApi.list(),
  })
}

/**
 * Получить счёт по ID
 */
export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountsApi.get(id),
    enabled: !!id,
  })
}

/**
 * Создать новый счёт
 */
export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAccountRequest) => accountsApi.create(data),
    onSuccess: async () => {
      // Reset and refetch to force fresh data
      await queryClient.resetQueries({ queryKey: accountKeys.list(), exact: true })
      toast.success('Счёт создан')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Обновить счёт
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountRequest }) =>
      accountsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(variables.id) })
      toast.success('Счёт обновлён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить счёт
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Счёт удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

// === Credit Card Reserves Hooks ===

/**
 * Получить pending резервы кредитной карты
 */
export function useCreditCardReserves(creditCardId: string) {
  return useQuery({
    queryKey: accountKeys.reserves(creditCardId),
    queryFn: () => accountsApi.getReserves(creditCardId),
    enabled: !!creditCardId,
  })
}

/**
 * Применить резервы (учётная операция)
 */
export function useApplyReserves() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ creditCardId, data }: { creditCardId: string; data: ApplyReservesRequest }) =>
      accountsApi.applyReserves(creditCardId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.reserves(variables.creditCardId) })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success(`Применено резервов: ${result.appliedCount} на сумму ${result.appliedAmount.toLocaleString('ru-RU')} ₽`)
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Погасить кредитную карту с авто-применением резервов
 */
export function useRepayCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ creditCardId, data }: { creditCardId: string; data: RepayRequest }) =>
      accountsApi.repay(creditCardId, data),
    onSuccess: (result, variables) => {
      // Инвалидируем резервы кредитной карты
      queryClient.invalidateQueries({ queryKey: accountKeys.reserves(variables.creditCardId) })
      // Инвалидируем список счетов (для обновления балансов в списке)
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      // Инвалидируем детальную страницу кредитной карты
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(variables.creditCardId) })
      // Инвалидируем детальную страницу счёта-источника
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(variables.data.fromAccountId) })
      const reservesInfo = result.appliedReserves > 0
        ? ` (применено резервов: ${result.reservedAmount.toLocaleString('ru-RU')} ₽)`
        : ''
      toast.success(`Кредитная карта погашена${reservesInfo}`)
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

// === Account Types Hooks ===

/**
 * Получить список типов счетов
 */
export function useAccountTypes() {
  return useQuery({
    queryKey: accountTypeKeys.list(),
    queryFn: () => accountTypesApi.list(),
  })
}

/**
 * Получить тип счёта по ID
 */
export function useAccountType(id: string) {
  return useQuery({
    queryKey: accountTypeKeys.detail(id),
    queryFn: () => accountTypesApi.get(id),
    enabled: !!id,
  })
}
