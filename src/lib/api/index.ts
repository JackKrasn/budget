// Client
export { apiClient, ApiError } from './client'
export type { ErrorCode, FieldError, ErrorDetail, ApiErrorResponse } from './client'

// Types
export * from './types'

// API modules
export { accountsApi } from './accounts'
export { accountTypesApi } from './account-types'
export { assetsApi } from './assets'
export { assetTypesApi } from './asset-types'
export { fundsApi } from './funds'
export { fundDepositsApi } from './fund-deposits'
export { distributionRulesApi } from './distribution-rules'
export { exchangeRatesApi } from './exchange-rates'
export { expenseTagsApi } from './expense-tags'
export { expenseCategoriesApi } from './expense-categories'
export { expensesApi } from './expenses'
export { budgetsApi } from './budgets'
export { recurringExpensesApi } from './recurring-expenses'
export { plannedExpensesApi } from './planned-expenses'
export { recurringIncomesApi } from './recurring-incomes'
export { plannedIncomesApi } from './planned-incomes'
export { incomesApi } from './incomes'
export { depositsApi } from './deposits'
export { balanceAdjustmentsApi } from './balance-adjustments'
export { transfersApi } from './transfers'
