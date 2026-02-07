import { apiClient } from './client'
import type {
  AnalyzeImportRequest,
  AnalyzeImportResponse,
  ExecuteImportRequest,
  ExecuteImportResponse,
  AccountMappingsListResponse,
  CategoryMappingsListResponse,
  TagMappingsListResponse,
  ImportAccountMapping,
  ImportCategoryMapping,
  ImportTagMapping,
  CreateAccountMappingRequest,
  CreateCategoryMappingRequest,
  CreateTagMappingRequest,
  ImportMappingsListParams,
} from './types'

const ENDPOINT = '/import'

export const importApi = {
  // === Analyze & Execute ===

  /**
   * Анализ CSV-файла перед импортом
   */
  analyze: (data: AnalyzeImportRequest) =>
    apiClient.post<AnalyzeImportResponse>(`${ENDPOINT}/analyze`, data),

  /**
   * Выполнить импорт
   */
  execute: (data: ExecuteImportRequest) =>
    apiClient.post<ExecuteImportResponse>(`${ENDPOINT}/execute`, data),

  // === Account Mappings ===

  /**
   * Получить список маппингов счетов
   */
  listAccountMappings: (params?: ImportMappingsListParams) =>
    apiClient.get<AccountMappingsListResponse>(`${ENDPOINT}/mappings/accounts`, params),

  /**
   * Создать маппинг счёта
   */
  createAccountMapping: (data: CreateAccountMappingRequest) =>
    apiClient.post<ImportAccountMapping>(`${ENDPOINT}/mappings/accounts`, data),

  /**
   * Удалить маппинг счёта
   */
  deleteAccountMapping: (id: string) =>
    apiClient.delete<void>(`${ENDPOINT}/mappings/accounts/${id}`),

  // === Category Mappings ===

  /**
   * Получить список маппингов категорий
   */
  listCategoryMappings: (params?: ImportMappingsListParams) =>
    apiClient.get<CategoryMappingsListResponse>(`${ENDPOINT}/mappings/categories`, params),

  /**
   * Создать маппинг категории
   */
  createCategoryMapping: (data: CreateCategoryMappingRequest) =>
    apiClient.post<ImportCategoryMapping>(`${ENDPOINT}/mappings/categories`, data),

  /**
   * Удалить маппинг категории
   */
  deleteCategoryMapping: (id: string) =>
    apiClient.delete<void>(`${ENDPOINT}/mappings/categories/${id}`),

  // === Tag Mappings ===

  /**
   * Получить список маппингов тегов
   */
  listTagMappings: (params?: ImportMappingsListParams) =>
    apiClient.get<TagMappingsListResponse>(`${ENDPOINT}/mappings/tags`, params),

  /**
   * Создать маппинг тега
   */
  createTagMapping: (data: CreateTagMappingRequest) =>
    apiClient.post<ImportTagMapping>(`${ENDPOINT}/mappings/tags`, data),

  /**
   * Удалить маппинг тега
   */
  deleteTagMapping: (id: string) =>
    apiClient.delete<void>(`${ENDPOINT}/mappings/tags/${id}`),
}
