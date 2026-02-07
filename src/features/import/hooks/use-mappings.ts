import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { importApi } from '@/lib/api'
import type {
  ImportMappingsListParams,
  CreateAccountMappingRequest,
  CreateCategoryMappingRequest,
  CreateTagMappingRequest,
} from '@/lib/api/types'
import { toast } from 'sonner'

// === Query Keys ===

export const importMappingKeys = {
  all: ['import-mappings'] as const,
  accountsAll: () => [...importMappingKeys.all, 'accounts'] as const,
  accounts: (params?: ImportMappingsListParams) =>
    [...importMappingKeys.accountsAll(), params] as const,
  categoriesAll: () => [...importMappingKeys.all, 'categories'] as const,
  categories: (params?: ImportMappingsListParams) =>
    [...importMappingKeys.categoriesAll(), params] as const,
  tagsAll: () => [...importMappingKeys.all, 'tags'] as const,
  tags: (params?: ImportMappingsListParams) =>
    [...importMappingKeys.tagsAll(), params] as const,
}

// === Account Mappings ===

/**
 * Получить список маппингов счетов
 */
export function useAccountMappings(params?: ImportMappingsListParams) {
  return useQuery({
    queryKey: importMappingKeys.accounts(params),
    queryFn: () => importApi.listAccountMappings(params),
  })
}

/**
 * Создать маппинг счёта
 */
export function useCreateAccountMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAccountMappingRequest) => importApi.createAccountMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importMappingKeys.accountsAll() })
      toast.success('Маппинг счёта добавлен')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить маппинг счёта
 */
export function useDeleteAccountMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => importApi.deleteAccountMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importMappingKeys.accountsAll() })
      toast.success('Маппинг удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

// === Category Mappings ===

/**
 * Получить список маппингов категорий
 */
export function useCategoryMappings(params?: ImportMappingsListParams) {
  return useQuery({
    queryKey: importMappingKeys.categories(params),
    queryFn: () => importApi.listCategoryMappings(params),
  })
}

/**
 * Создать маппинг категории
 */
export function useCreateCategoryMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryMappingRequest) => importApi.createCategoryMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importMappingKeys.categoriesAll() })
      toast.success('Маппинг категории добавлен')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить маппинг категории
 */
export function useDeleteCategoryMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => importApi.deleteCategoryMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importMappingKeys.categoriesAll() })
      toast.success('Маппинг удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

// === Tag Mappings ===

/**
 * Получить список маппингов тегов
 */
export function useTagMappings(params?: ImportMappingsListParams) {
  return useQuery({
    queryKey: importMappingKeys.tags(params),
    queryFn: () => importApi.listTagMappings(params),
  })
}

/**
 * Создать маппинг тега
 */
export function useCreateTagMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTagMappingRequest) => importApi.createTagMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importMappingKeys.tagsAll() })
      toast.success('Маппинг тега добавлен')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}

/**
 * Удалить маппинг тега
 */
export function useDeleteTagMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => importApi.deleteTagMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importMappingKeys.tagsAll() })
      toast.success('Маппинг удалён')
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })
}
