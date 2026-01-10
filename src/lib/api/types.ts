// === Common Types ===

export type UUID = string
export type ISODate = string

// === Account Types ===

export interface AccountType {
  id: UUID
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
  sort_order: number
  is_system: boolean
  created_at: ISODate
}

export interface CreateAccountTypeRequest {
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
  sortOrder?: number
}

export interface UpdateAccountTypeRequest {
  name?: string
  description?: string
  icon?: string
  color?: string
  sortOrder?: number
}

export interface AccountTypesListResponse {
  data: AccountType[]
  total: number
}

// === Accounts ===

export interface Account {
  id: UUID
  name: string
  account_type_id: UUID
  currency: string
  current_balance: number
  bank_name?: string
  icon?: string
  color?: string
  is_archived: boolean
  created_at: ISODate
  updated_at: ISODate
}

export interface AccountWithType extends Account {
  type_code: string
  type_name: string
}

export interface CreateAccountRequest {
  name: string
  accountTypeId: string
  currency: string
  bankName?: string
  icon?: string
  color?: string
}

export interface UpdateAccountRequest {
  name?: string
  accountTypeId?: string
  currency?: string
  bankName?: string
  icon?: string
  color?: string
  isArchived?: boolean
}

export interface AccountsListResponse {
  data: AccountWithType[]
  total: number
  totalBalance: number
}

// === Asset Types ===

export interface AssetType {
  id: UUID
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
  sort_order: number
  is_system: boolean
  created_at: ISODate
}

export interface CreateAssetTypeRequest {
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
  sortOrder?: number
}

export interface UpdateAssetTypeRequest {
  name?: string
  description?: string
  icon?: string
  color?: string
  sortOrder?: number
}

export interface AssetTypesListResponse {
  data: AssetType[]
  total: number
}

// === Assets ===

// Go sql.NullFloat64 format
export interface NullFloat64 {
  Float64: number
  Valid: boolean
}

export interface Asset {
  id: UUID
  name: string
  asset_type_id: UUID
  ticker?: string
  currency: string
  current_price?: number | NullFloat64
  account_id?: UUID
  created_at: ISODate
  updated_at: ISODate
}

export interface AssetWithType extends Asset {
  type_code: string
  type_name: string
  account_name?: string
}

export interface CreateAssetRequest {
  name: string
  assetTypeId: string
  ticker?: string
  currency: string
  currentPrice?: number
  accountId?: string
}

export interface UpdateAssetRequest {
  name?: string
  assetTypeId?: string
  ticker?: string
  currency?: string
  currentPrice?: number
  accountId?: string
}

export interface UpdateAssetPriceRequest {
  price: number
  source?: string
}

export interface AssetsListResponse {
  data: AssetWithType[]
  total: number
}

export interface AssetsListParams {
  assetTypeId?: string
  currency?: string
  [key: string]: string | number | boolean | undefined
}

// === Funds ===

export type FundStatus = 'active' | 'completed' | 'paused'
export type RuleType = 'percentage' | 'fixed'

export interface Fund {
  id: UUID
  name: string
  icon: string
  color: string
  is_virtual: boolean
  status: FundStatus
  created_at: ISODate
  updated_at: ISODate
}

export interface AssetInfo {
  id: UUID
  name: string
  ticker?: string
  currency: string
  currentPrice?: number
  assetTypeId: UUID
  typeCode: string
}

export interface FundAssetBalance {
  asset: AssetInfo
  amount: number
  valueRub: number
  valueOriginal: number
}

export interface FundBalance {
  fund: Fund
  assets: FundAssetBalance[]
  totalRub: number
  progress?: number
}

export interface FundsSummary {
  totalRub: number
  totalDistributionPercentage: number
}

export interface FundsListResponse {
  data: FundBalance[]
  total: number
  summary: FundsSummary
}

export interface FundsListParams {
  status?: FundStatus
  [key: string]: string | number | boolean | undefined
}

export interface CreateFundRequest {
  name: string
  icon: string
  color: string
  isVirtual?: boolean
}

export interface UpdateFundRequest {
  name?: string
  icon?: string
  color?: string
  isVirtual?: boolean
  status?: FundStatus
}

// === Fund Assets ===

export interface FundAsset {
  id: UUID
  fund_id: UUID
  asset_id: UUID
  amount: number
  created_at: ISODate
  updated_at: ISODate
}

export interface AddFundAssetRequest {
  assetId: string
  amount: number
}

export interface UpdateFundAssetAmountRequest {
  amount: number
}

export interface FundAssetsListResponse {
  data: FundAssetBalance[]
}

// === Fund Contributions ===

export interface ContributionAllocation {
  assetId: string
  amount: number
  pricePerUnit?: number
}

export interface FundContribution {
  id: UUID
  fund_id: UUID
  income_id?: UUID
  date: ISODate
  total_amount: number
  currency: string
  note?: string
  created_at: ISODate
}

export interface CreateContributionRequest {
  date: string
  totalAmount: number
  currency: string
  incomeId?: string
  allocations?: ContributionAllocation[]
  note?: string
}

export interface FundContributionsListResponse {
  data: FundContribution[]
  total: number
}

// === Fund Withdrawals ===

export interface FundWithdrawal {
  id: UUID
  fund_id: UUID
  date: ISODate
  total_amount: number
  currency: string
  purpose: string
  note?: string
  created_at: ISODate
}

export interface CreateWithdrawalRequest {
  date: string
  totalAmount: number
  currency: string
  purpose: string
  allocations: ContributionAllocation[]
  note?: string
}

export interface FundWithdrawalsListResponse {
  data: FundWithdrawal[]
  total: number
}

// === Fund History ===

export interface FundHistoryResponse {
  contributions: FundContribution[]
  withdrawals: FundWithdrawal[]
}

export interface FundHistoryParams {
  from?: string
  to?: string
  [key: string]: string | number | boolean | undefined
}

// === Distribution Rules ===

export interface DistributionRule {
  id: UUID
  fund_id: UUID
  rule_type: RuleType
  value?: number
  priority: number
  is_active: boolean
  created_at: ISODate
  updated_at: ISODate
}

export interface DistributionRuleWithFund extends DistributionRule {
  fund_name: string
  fund_icon: string
  fund_color: string
}

export interface CreateDistributionRuleRequest {
  fundId: string
  ruleType: RuleType
  value?: number
  priority?: number
  isActive?: boolean
}

export interface UpdateDistributionRuleRequest {
  ruleType?: RuleType
  value?: number
  priority?: number
  isActive?: boolean
}

export interface DistributionRulesListResponse {
  data: DistributionRule[]
  total: number
}

export interface DistributionRulesListParams {
  fundId?: string
  active?: boolean
  [key: string]: string | number | boolean | undefined
}

// === Exchange Rates ===

export interface ExchangeRate {
  id: UUID
  from_currency: string
  to_currency: string
  rate: number
  date: ISODate
  source: string
  created_at: ISODate
}

export interface CreateExchangeRateRequest {
  fromCurrency: string
  toCurrency: string
  rate: number
  source?: string
}

export interface ExchangeRatesResponse {
  rates: Record<string, number>
  updatedAt: ISODate
}

// === Expense Tags ===

export interface ExpenseTag {
  id: UUID
  name: string
  color: string
  created_at: ISODate
}

export interface CreateExpenseTagRequest {
  name: string
  color: string
}

export interface UpdateExpenseTagRequest {
  name?: string
  color?: string
}

export interface ExpenseTagsListResponse {
  data: ExpenseTag[]
  total: number
}

// === Expense Categories ===

export interface ExpenseCategory {
  id: UUID
  code: string
  name: string
  icon: string
  color: string
  sort_order: number
  is_system: boolean
  created_at: ISODate
}

export interface ExpenseCategoryWithTags extends ExpenseCategory {
  tags: ExpenseTag[]
}

export interface CreateExpenseCategoryRequest {
  code: string
  name: string
  icon: string
  color: string
  sortOrder?: number
}

export interface UpdateExpenseCategoryRequest {
  name?: string
  icon?: string
  color?: string
  sortOrder?: number
}

export interface ExpenseCategoriesListResponse {
  data: ExpenseCategoryWithTags[]
  total: number
}

export interface ExpenseCategoriesListParams {
  tagId?: string
  [key: string]: string | number | boolean | undefined
}

// === Expenses ===

export interface Expense {
  id: UUID
  category_id: UUID
  account_id: UUID
  amount: number
  currency: string
  date: ISODate
  description?: string
  created_at: ISODate
  updated_at: ISODate
}

export interface ExpenseTagInfo {
  id: UUID
  name: string
  color: string
}

export interface ExpenseListRow {
  id: UUID
  categoryId: UUID
  categoryName: string
  categoryCode: string
  categoryIcon: string
  categoryColor: string
  accountId: UUID
  amount: number
  currency: string
  date: ISODate
  description?: string
  fundedAmount: number
  tags?: ExpenseTagInfo[]
}

export interface ExpenseFundAllocation {
  id: UUID
  fundId: UUID
  fundName: string
  amount: number
}

export interface ExpenseWithCategory {
  id: UUID
  category_id: UUID
  category_name: string
  category_code: string
  category_icon: string
  category_color: string
  account_id: UUID
  amount: number
  currency: string
  date: ISODate
  description?: string
  fundAllocations: ExpenseFundAllocation[]
  created_at: ISODate
  updated_at: ISODate
}

export interface FundAllocationRequest {
  fundId: string
  amount: number
}

export interface CreateExpenseRequest {
  categoryId: string
  accountId: string
  amount: number
  currency: string
  date: string
  description?: string
  tagIds?: string[]
  fundAllocations?: FundAllocationRequest[]
}

export interface UpdateExpenseRequest {
  categoryId?: string
  accountId?: string
  amount?: number
  currency?: string
  date?: string
  description?: string
  tagIds?: string[]
}

export interface ExpensesSummary {
  totalAmount: number
  totalFromFunds: number
}

export interface ExpensesListResponse {
  data: ExpenseListRow[]
  total: number
  summary: ExpensesSummary
}

export interface ExpensesListParams {
  from?: string
  to?: string
  categoryId?: string
  accountId?: string
  [key: string]: string | number | boolean | undefined
}

// === Budgets ===

export type BudgetStatus = 'draft' | 'active' | 'closed'

export interface Budget {
  id: UUID
  year: number
  month: number
  status: BudgetStatus
  total_planned: number
  notes?: string
  created_at: ISODate
  updated_at: ISODate
}

export interface BudgetItem {
  id: UUID
  budgetId: UUID
  categoryId: UUID
  plannedAmount: number
  bufferAmount?: number
  notes?: string | null
  createdAt: ISODate
  updatedAt: ISODate
}

export interface BudgetItemWithCategory extends BudgetItem {
  categoryName: string
  categoryCode: string
  categoryIcon: string
  categoryColor: string
  actualAmount: number
  fundedAmount: number
  remaining: number
  plannedExpensesSum: number
  // Fund financing fields
  fundId?: UUID
  fundName?: string
  fundAllocation: number
}

export interface FundDistributionSummary {
  fundId: UUID
  fundName: string
  fundIcon: string
  fundColor: string
  expectedAmount: number
  plannedAmount: number
  actualAmount: number
}

export interface DistributionSummary {
  totalExpectedDistribution: number
  totalPlannedDistribution: number
  totalActualDistribution: number
  expectedRemainingForBudget: number
  actualRemainingForBudget: number
  distributionDifference: number
}

// Fund Financing Summary (expenses funded from funds)
export interface FundingSource {
  fundId: UUID
  fundName: string
  plannedAmount: number
  actualAmount: number
}

export interface FundFinancingSummary {
  totalPlanned: number
  plannedFromIncome: number
  plannedFromFunds: number
  fundBreakdown: FundingSource[]
}

export interface BudgetWithItems extends Budget {
  items: BudgetItemWithCategory[]
  distributionSummary?: DistributionSummary
  fundDistributions?: FundDistributionSummary[]
  fundFinancingSummary?: FundFinancingSummary
}

export interface BudgetsListResponse {
  data: Budget[]
  total: number
}

export interface BudgetItemsListResponse {
  data: BudgetItemWithCategory[]
  total: number
}

export interface CreateBudgetRequest {
  year: number
  month: number
  notes?: string
}

export interface UpdateBudgetRequest {
  status?: BudgetStatus
  notes?: string
}

export interface UpsertBudgetItemRequest {
  categoryId: string
  plannedAmount: number
  bufferAmount?: number
  notes?: string
  // Fund financing fields
  fundId?: string
  fundAllocation?: number
}

export interface BudgetsListParams {
  year?: number
  status?: BudgetStatus
  [key: string]: string | number | boolean | undefined
}

// === Recurring Expenses (Шаблоны повторяющихся расходов) ===

export interface RecurringExpense {
  id: UUID
  category_id: UUID
  account_id?: UUID
  fund_id?: UUID
  name: string
  amount: number
  currency: string
  day_of_month: number
  is_active: boolean
  created_at: ISODate
  updated_at: ISODate
}

export interface RecurringExpenseWithCategory extends RecurringExpense {
  category_name: string
  category_code: string
  category_icon: string
  category_color: string
  account_name?: string
  fund_name?: string
}

export interface CreateRecurringExpenseRequest {
  categoryId: string
  accountId?: string
  fundId?: string
  name: string
  amount: number
  currency: string
  dayOfMonth: number
  isActive?: boolean
}

export interface UpdateRecurringExpenseRequest {
  categoryId?: string
  accountId?: string
  fundId?: string
  name?: string
  amount?: number
  currency?: string
  dayOfMonth?: number
  isActive?: boolean
}

export interface RecurringExpensesListResponse {
  data: RecurringExpenseWithCategory[]
  total: number
}

export interface RecurringExpensesListParams {
  isActive?: boolean
  [key: string]: string | number | boolean | undefined
}

export interface RecurringExpensesSummary {
  totalAmount: number
  count: number
}

// === Planned Expenses (Запланированные расходы на месяц) ===

export type PlannedExpenseStatus = 'pending' | 'confirmed' | 'skipped'

export interface PlannedExpense {
  id: UUID
  budget_id: UUID
  recurring_expense_id?: UUID
  category_id: UUID
  account_id?: UUID
  fund_id?: UUID
  funded_amount?: number | NullFloat64
  name: string
  planned_amount: number
  currency: string
  planned_date: ISODate | { Time: string; Valid: boolean }
  status: PlannedExpenseStatus
  actual_expense_id?: UUID
  notes?: string
  created_at: ISODate
  updated_at: ISODate
}

export interface PlannedExpenseWithDetails extends PlannedExpense {
  category_name: string
  category_code: string
  category_icon: string
  category_color: string
  account_name?: string
  fund_name?: string
  actual_amount?: number | NullFloat64
}

export interface PlannedExpensesSummary {
  totalPlanned: number
  totalConfirmed: number
  totalPending: number
  totalSavings: number
}

export interface CreatePlannedExpenseRequest {
  budgetId: string
  categoryId: string
  accountId?: string
  fundId?: string
  fundedAmount?: number
  name: string
  plannedAmount: number
  currency: string
  plannedDate: string
  notes?: string
}

export interface UpdatePlannedExpenseRequest {
  categoryId?: string
  accountId?: string
  fundId?: string
  fundedAmount?: number
  name?: string
  plannedAmount?: number
  currency?: string
  plannedDate?: string
  notes?: string
}

export interface ConfirmPlannedExpenseRequest {
  actualExpenseId: string
}

export interface PlannedExpensesListResponse {
  data: PlannedExpenseWithDetails[]
  total: number
  summary?: PlannedExpensesSummary
}

export interface PlannedExpensesListParams {
  budgetId?: string
  status?: PlannedExpenseStatus
  from?: string
  to?: string
  [key: string]: string | number | boolean | undefined
}

// === Recurring Incomes (Шаблоны повторяющихся доходов) ===

export interface RecurringIncome {
  id: UUID
  source: string
  expected_amount: number
  currency: string
  day_of_month: number
  is_active: boolean
  notes?: string
  created_at: ISODate
  updated_at: ISODate
}

export interface CreateRecurringIncomeRequest {
  source: string
  expectedAmount: number
  currency: string
  dayOfMonth: number
  isActive?: boolean
  notes?: string
}

export interface UpdateRecurringIncomeRequest {
  source?: string
  expectedAmount?: number
  currency?: string
  dayOfMonth?: number
  isActive?: boolean
  notes?: string
}

export interface RecurringIncomesListResponse {
  data: RecurringIncome[]
  total: number
}

export interface RecurringIncomesSummary {
  totalAmount: number
  count: number
}

// === Planned Incomes (Запланированные доходы на месяц) ===

export type PlannedIncomeStatus = 'pending' | 'received' | 'skipped'

export interface PlannedIncome {
  id: UUID
  budget_id: UUID
  recurring_income_id?: UUID
  source: string
  expected_amount: number
  currency: string
  expected_date: ISODate | { Time: string; Valid: boolean } | null
  status: PlannedIncomeStatus
  actual_income_id?: UUID
  actual_amount?: number | { Float64: number; Valid: boolean } | null
  actual_date?: ISODate | null
  notes?: string
  created_at: ISODate
  updated_at: ISODate
}

export interface CreatePlannedIncomeRequest {
  budgetId: string
  source: string
  expectedAmount: number
  currency: string
  expectedDate: string
  notes?: string
}

export interface UpdatePlannedIncomeRequest {
  source?: string
  expectedAmount?: number
  currency?: string
  expectedDate?: string
  notes?: string
  status?: PlannedIncomeStatus
  actualAmount?: number
  actualDate?: string
}

export interface ReceivePlannedIncomeRequest {
  actualIncomeId: string
}

export interface PlannedIncomesListResponse {
  data: PlannedIncome[]
  total: number
}

export interface PlannedIncomesListParams {
  budgetId?: string
  status?: PlannedIncomeStatus
  from?: string
  to?: string
  [key: string]: string | number | boolean | undefined
}

export interface PlannedIncomesSummary {
  totalExpected: number
  totalReceived: number
  totalActual: number
  totalPending: number
  totalSkipped: number
  pendingCount: number
  receivedCount: number
  skippedCount: number
}

// === Incomes (Фактические доходы) ===

export interface Income {
  id: UUID
  source: string
  amount: number
  currency: string
  date: ISODate
  description?: string
  account_id?: UUID
  remaining_for_budget: number
  created_at: ISODate
}

export interface IncomeWithAccount extends Income {
  account_name?: string
}

export interface IncomeDistribution {
  id: UUID
  income_id: UUID
  fund_id: UUID
  fund_name: string
  fund_icon: string
  fund_color: string
  planned_amount: number
  actual_amount?: number
  is_completed: boolean
  completed_at?: ISODate
}

export interface IncomeWithDistributions extends IncomeWithAccount {
  distributions: IncomeDistribution[]
  remainingForBudget: number
}

export interface CreateIncomeRequest {
  source: string
  amount: number
  currency: string
  date: string
  description?: string
  accountId?: string
}

export interface UpdateIncomeRequest {
  source?: string
  amount?: number
  currency?: string
  date?: string
  description?: string
  accountId?: string
}

export interface IncomesSummary {
  totalAmount: number
  bySource: Record<string, number>
}

export interface IncomesListResponse {
  data: IncomeWithAccount[]
  total: number
  summary: IncomesSummary
}

export interface IncomesListParams {
  from?: string
  to?: string
  source?: string
  accountId?: string
  [key: string]: string | number | boolean | undefined
}

// === Income Distribution Operations ===

export interface UpdateDistributionRequest {
  plannedAmount: number
}

export interface DistributionAllocation {
  assetId: string
  amount: number
}

export interface ConfirmDistributionRequest {
  actualAmount: number
  allocations: DistributionAllocation[]
}
