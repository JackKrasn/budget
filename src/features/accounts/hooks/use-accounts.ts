import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi, accountTypesApi } from '@/lib/api'
import type { CreateAccountRequest, UpdateAccountRequest } from '@/lib/api'
import { toast } from 'sonner'

// === Query Keys ===

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: () => [...accountKeys.lists()] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
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
