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
  is_credit: boolean
  linked_fund_id?: UUID  // Фонд для авто-резервирования (только для кредитных карт)
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
  initialBalance?: number
  isCredit?: boolean
  linkedFundId?: string  // Фонд для авто-резервирования (только для кредитных карт)
}

export interface UpdateAccountRequest {
  name?: string
  accountTypeId?: string
  currency?: string
  bankName?: string
  icon?: string
  color?: string
  isArchived?: boolean
  currentBalance?: number
  isCredit?: boolean
  linkedFundId?: string | null  // Фонд для авто-резервирования (null для удаления привязки)
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
  valueBase: number
  valueOriginal: number
}

export interface FundBalance {
  fund: Fund
  assets: FundAssetBalance[]
  totalBase: number
  baseCurrency: string
  progress?: number
}

export interface FundsSummary {
  totalBase: number
  baseCurrency: string
  totalDistributionPercentage: number
}

export interface FundsListResponse {
  data: FundBalance[]
  total: number
  summary: FundsSummary
}

export interface FundsListParams {
  status?: FundStatus
  baseCurrency?: string
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

export interface ExchangeRatesListResponse {
  data: ExchangeRate[]
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

export interface TagStatisticsParams {
  from?: string
  to?: string
}

export interface TagStatisticsResponse {
  tag: {
    id: string
    name: string
    color: string | null
    created_at: string
  }
  total: {
    expenses_count: number
    total_amount: number
  }
  by_tags: Array<{
    tag_id: string
    tag_name: string
    tag_color: string | null
    expenses_count: number
    total_amount: number
  }>
  by_categories: Array<{
    category_id: string
    category_code: string
    category_name: string
    category_icon: string | null
    category_color: string | null
    expenses_count: number
    total_amount: number
  }>
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
  amountBase: number // сумма в RUB
  exchangeRate?: number // курс валюты на момент создания
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
  amountBase: number // сумма в RUB
  exchangeRate?: number // курс валюты на момент создания
  currency: string
  date: ISODate
  description?: string
  fundedAmount: number
  fundAllocations?: ExpenseFundAllocation[] // детализация по фондам
  tags?: ExpenseTagInfo[]
}

export interface ExpenseFundAllocation {
  id: UUID
  fundId: UUID
  fundName: string
  fundColor: string
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
  amountBase: number // сумма в RUB
  exchangeRate?: number // курс валюты на момент создания
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
  fundAllocations?: FundAllocationRequest[]  // null/undefined = не менять, [] = удалить все, [...] = заменить
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
  tagId?: string
  tagIds?: string[] // фильтр по нескольким тегам (AND логика)
  fundId?: string // фильтр по фонду (расходы, профинансированные из этого фонда)
  [key: string]: string | number | boolean | string[] | undefined
}

// === Budgets ===

export type BudgetStatus = 'draft' | 'active' | 'closed'

// Supported currencies for budget limits
export type BudgetCurrency = 'RUB' | 'USD' | 'EUR' | 'GEL' | 'TRY' | 'CNY' | 'AED' | 'USDT' | 'BTC' | 'ETH' | 'TON' | 'OTHER'

// Currency limit for a specific currency within a budget item
export interface CurrencyLimit {
  id: UUID
  currency: BudgetCurrency
  plannedAmount: number    // Auto-calculated from planned_expenses
  bufferAmount: number     // User-editable buffer for unplanned expenses
  totalLimit: number       // plannedAmount + bufferAmount
  actualAmount: number     // Actual expenses in this currency
  remaining: number        // totalLimit - actualAmount
}

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
  // Total limit = plannedExpensesSum + sum of all buffers
  totalLimit: number
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
  // Sum of planned expenses for this category (auto-calculated)
  plannedExpensesSum: number
  // Fund financing fields
  fundId?: UUID
  fundName?: string
  fundAllocation: number
  // Multi-currency limits (always present in new API)
  currencyLimits: CurrencyLimit[]
}

export interface FundDistributionSummary {
  fundId: UUID
  fundName: string
  fundIcon: string
  fundColor: string
  expectedAmount: number
  /** Расчёт от pending planned_incomes по правилам distribution_rules */
  expectedFromPlannedAmount: number
  plannedAmount: number
  actualAmount: number
}

export interface DistributionSummary {
  totalExpectedDistribution: number
  /** Общая сумма ожидаемого распределения от pending planned_incomes */
  totalExpectedFromPlannedDistribution: number
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

// Currency summary for budget
export interface BudgetCurrencySummary {
  currency: string
  totalPlanned: number
  totalBuffer: number
  totalLimit: number
  totalActual: number
  totalRemaining: number
}

// Planned expenses currency summary
export interface PlannedExpensesCurrencySummary {
  currency: string
  totalPlanned: number
  totalConfirmed: number
  totalPending: number
  totalSkipped: number
  pendingCount: number
  confirmedCount: number
  skippedCount: number
}

// Funding currency summary
export interface FundingCurrencySummary {
  currency: string
  totalPlanned: number
  totalFromFunds: number
  totalFromIncome: number
}

export interface BudgetWithItems extends Budget {
  items: BudgetItemWithCategory[]
  distributionSummary?: DistributionSummary
  fundDistributions?: FundDistributionSummary[]
  fundFinancingSummary?: FundFinancingSummary
  // Multi-currency summaries
  currencySummary?: BudgetCurrencySummary[]
  plannedExpensesCurrencySummary?: PlannedExpensesCurrencySummary[]
  fundingCurrencySummary?: FundingCurrencySummary[]
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

// Request to set buffer for a specific currency
export interface SetCurrencyBufferRequest {
  currency: BudgetCurrency
  bufferAmount: number
}

// Response for currency limits
export interface CurrencyLimitsResponse {
  data: CurrencyLimit[]
}

export interface BudgetsListParams {
  year?: number
  status?: BudgetStatus
  [key: string]: string | number | boolean | undefined
}

// === Recurring Expenses (Шаблоны повторяющихся расходов) ===

export type RecurringExpenseFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurringExpense {
  id: UUID
  category_id: UUID
  account_id?: UUID
  fund_id?: UUID
  name: string
  amount: number
  currency: string
  frequency: RecurringExpenseFrequency
  day_of_month?: number
  day_of_week?: number // 0=пн, 1=вт, 2=ср, 3=чт, 4=пт, 5=сб, 6=вс
  month_of_year?: number // 1-12
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
  frequency: RecurringExpenseFrequency
  dayOfMonth?: number
  dayOfWeek?: number // 0=пн, 1=вт, 2=ср, 3=чт, 4=пт, 5=сб, 6=вс
  monthOfYear?: number // 1-12
  isActive?: boolean
}

export interface UpdateRecurringExpenseRequest {
  categoryId?: string
  accountId?: string
  fundId?: string
  name?: string
  amount?: number
  currency?: string
  frequency?: RecurringExpenseFrequency
  dayOfMonth?: number
  dayOfWeek?: number // 0=пн, 1=вт, 2=ср, 3=чт, 4=пт, 5=сб, 6=вс
  monthOfYear?: number // 1-12
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
  planned_amount_base: number // Сумма в базовой валюте (RUB) для расчёта бюджета
  exchange_rate?: number | null // Курс конвертации на момент создания
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
  fundAssetId?: string
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
  fundAssetId?: string
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
  account_id?: UUID
  account_name?: string
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
  accountId?: string
  source: string
  expectedAmount: number
  currency: string
  expectedDate: string
  notes?: string
}

export interface UpdatePlannedIncomeRequest {
  accountId?: string
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
  accountId: string
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

export interface CreateIncomeDistributionRequest {
  fundId: string
  plannedAmount: number
}

export interface UpdateDistributionRequest {
  plannedAmount: number
  // Только для подтверждённых распределений:
  actualAmount?: number // фактическая сумма (если отличается от plannedAmount)
  actualDate?: string // фактическая дата "YYYY-MM-DD"
  allocations?: DistributionAllocation[] // ОБЯЗАТЕЛЬНО для подтверждённых
}

export interface DistributionAllocation {
  assetId: string
  amount: number
}

export interface ConfirmDistributionRequest {
  actualAmount: number
  allocations: DistributionAllocation[]
  actualDate?: string
}

export interface CancelDistributionResponse {
  message: string
  distribution: IncomeDistribution
  accountBalances: BalanceChange[]
  fundBalances: BalanceChange[]
}

export interface BalanceChange {
  assetId: string
  assetName: string
  currency?: string
  before: number
  after: number
  change: number
}

export interface DeleteTransactionResponse {
  message: string
  fundBalance: BalanceChange
  accountBalance?: BalanceChange
}

export interface DeleteContributionResponse {
  message: string
  fundBalances: BalanceChange[]
  accountBalances?: BalanceChange[]
}

// === Deposits (Банковские вклады) ===

export type AccrualPeriod = 'monthly' | 'quarterly' | 'annually' | 'at_maturity'
export type DepositStatus = 'active' | 'closed_early' | 'matured'

// Go time format can be string or { Time: string; Valid: boolean }
export type NullableDate = ISODate | { Time: string; Valid: boolean } | null

export interface Deposit {
  id: UUID
  assetId: UUID
  assetName: string
  currency: string
  principalAmount: number
  currentAmount: number
  interestRate: number // в decimal (0.08 = 8%)
  termMonths: number
  accrualPeriod: AccrualPeriod
  hasCapitalization: boolean
  startDate: NullableDate
  maturityDate: NullableDate
  nextAccrualDate?: NullableDate
  status: DepositStatus
  fundId?: UUID
  fundName?: string
  totalInterest: number
  projectedYield: number
  daysRemaining: number
  bank?: string // Название банка
  notes?: string
  createdAt: NullableDate
}

export interface CreateDepositRequest {
  name: string
  fundId: string
  currency: string
  principalAmount: number
  interestRate: number // в процентах (8.5)
  termMonths: number
  accrualPeriod: AccrualPeriod
  hasCapitalization: boolean
  startDate: string // YYYY-MM-DD
  bank?: string // Название банка
  notes?: string
}

export interface UpdateDepositRequest {
  bank?: string // Обновить название банка
  notes?: string
}

export interface DepositAccrual {
  id: UUID
  depositId: UUID
  accrualDate: NullableDate
  periodStart: NullableDate
  periodEnd: NullableDate
  principalAtStart: number
  interestAccrued: number
  principalAtEnd: number
  accrualType: 'regular' | 'early_closure' | 'maturity'
  isCapitalized: boolean
  notes?: string
  createdAt: NullableDate
}

// Валютный актив в фонде
export interface FundCurrencyAsset {
  assetId: string
  assetName: string
  currency: string
  amount: number
  fundId: string
  fundName: string
}

// Запрос на миграцию депозита (без проверки баланса)
export interface MigrateDepositRequest {
  name: string
  fundId: string
  currency: string
  currentAmount: number // Текущая сумма (вместо principalAmount)
  interestRate: number // В процентах
  termMonths: number
  accrualPeriod: AccrualPeriod
  hasCapitalization: boolean
  startDate: string // YYYY-MM-DD
  maturityDate?: string // YYYY-MM-DD (опционально)
  bank?: string // Название банка
  notes?: string
}

export interface DepositsSummary {
  totalDeposits: number
  totalPrincipal: number
  totalCurrentValue: number
  totalInterestEarned: number
}

export interface DepositsListResponse {
  data: Deposit[]
  total: number
  summary?: DepositsSummary
}

export interface DepositsListParams {
  status?: DepositStatus
  fundId?: string
  [key: string]: string | number | boolean | undefined
}

export interface DepositAccrualsResponse {
  data: DepositAccrual[]
  total: number
}

export interface MaturingDepositsParams {
  days?: number
  [key: string]: string | number | boolean | undefined
}

// === Balance Adjustments (Корректировки баланса) ===

export interface BalanceAdjustment {
  id: UUID
  account_id: UUID
  amount: number
  reason: string
  date: ISODate
  created_at: ISODate
}

export interface BalanceAdjustmentWithAccount extends BalanceAdjustment {
  account_name: string
  account_currency: string
}

export interface CreateBalanceAdjustmentRequest {
  accountId: string
  amount: number
  reason: string
  date: string
}

export interface SetBalanceRequest {
  accountId: string
  currentBalance: number
  reason?: string
  date?: string
}

export interface BalanceAdjustmentsListResponse {
  data: BalanceAdjustmentWithAccount[]
  total: number
}

export interface BalanceAdjustmentsListParams {
  accountId?: string
  from?: string
  to?: string
  [key: string]: string | number | boolean | undefined
}

export interface UpdateAdjustmentRequest {
  amount?: number
  reason?: string
  date?: string
}

// === Transfers (Переводы между счетами) ===

export interface Transfer {
  id: UUID
  from_account_id: UUID
  to_account_id: UUID
  amount: number
  to_amount?: number
  from_currency: string
  to_currency: string
  exchange_rate?: number
  fee_amount?: number
  date: ISODate
  description?: string
  created_at: ISODate
}

export interface TransferWithAccounts extends Transfer {
  from_account_name: string
  to_account_name: string
}

export interface CreateTransferRequest {
  fromAccountId: string
  toAccountId: string
  amount: number
  toAmount?: number // Сумма зачисления (обязательно если валюты разные)
  exchangeRate?: number // Курс обмена (опционально)
  feeAmount?: number // Комиссия (опционально, списывается со счёта-источника)
  date: string
  description?: string
}

export interface TransfersListResponse {
  data: TransferWithAccounts[]
  total: number
}

export interface TransfersListParams {
  from?: string
  to?: string
  accountId?: string
  [key: string]: string | number | boolean | undefined
}

export interface UpdateTransferRequest {
  fromAmount?: number
  toAmount?: number
  exchangeRate?: number
  feeAmount?: number
  date?: string
  description?: string | null
}

// === Fund Asset Operations ===

export type FundTransactionType =
  | 'buy'
  | 'sell'
  | 'transfer_in'
  | 'transfer_out'
  | 'deposit'
  | 'withdrawal'
  | 'contribution'
  | 'reserve'  // Резервирование для кредитной карты

export interface BuyAssetRequest {
  assetId: string
  amount: number
  pricePerUnit: number
  currencyAssetId: string
  date?: string
  note?: string
}

export interface BuyAssetResponse {
  success: boolean
  assetId: string
  amount: number
  pricePerUnit: number
  totalCost: number
  currencyAssetId: string
}

export interface DepositToFundRequest {
  accountId: string
  assetId: string
  amount: number
  date?: string
  note?: string
}

export interface DepositToFundResponse {
  success: boolean
  accountId: string
  accountName: string
  assetId: string
  amount: number
}

export interface TransferAssetRequest {
  toFundId: string
  assetId: string
  amount: number
  date?: string
  note?: string
}

export interface TransferAssetResponse {
  success: boolean
  fromFundId: string
  toFundId: string
  toFundName: string
  assetId: string
  amount: number
}

export interface FundTransaction {
  id: UUID
  fund_id: UUID
  transaction_type: FundTransactionType
  asset_id: UUID
  amount: number
  price_per_unit: NullFloat64
  total_value: NullFloat64
  currency: string | null
  counterpart_fund_id: string | null
  counterpart_asset_id: string | null
  source_account_id: string | null
  contribution_id: string | null
  contribution_income_id: string | null
  note: string | null
  date: ISODate
  created_at: ISODate
  // Joined fields
  asset_name: string
  asset_ticker: string | null
  asset_type: string
  counterpart_fund_name: string | null
  counterpart_asset_name: string | null
  source_account_name: string | null
}

export interface FundTransactionsListResponse {
  data: FundTransaction[]
  total: number
}

export interface FundTransactionsListParams {
  type?: FundTransactionType
  from?: string
  to?: string
  [key: string]: string | number | boolean | undefined
}

// Обновление транзакции фонда
export interface UpdateFundTransactionRequest {
  amount?: number // количество единиц актива
  pricePerUnit?: number // цена за единицу
  totalValue?: number // общая стоимость (для buy/sell)
  date?: string // формат "YYYY-MM-DD"
  note?: string // примечание
}

export interface FundCurrencyAssetsResponse {
  data: FundAssetBalance[]
}

// === Fund Deposits Types ===

export interface FundDeposit {
  id: UUID
  fund_id: UUID
  fund_name: string
  fund_icon: string | null
  fund_color: string | null
  from_account_id: UUID
  account_name: string
  asset_id: UUID
  asset_name: string
  amount: number
  currency: string
  contribution_id: string | null
  contribution_income_id: string | null
  date: ISODate
  note: string | null
  created_at: ISODate
}

export interface ListFundDepositsParams {
  fund_id?: string
  from_account_id?: string
  from_date?: string
  to_date?: string
  [key: string]: string | number | boolean | undefined
}

export interface ListFundDepositsResponse {
  data: FundDeposit[]
  total: number
}

export interface UpdateFundDepositRequest {
  amount?: number
  date?: string
  note?: string
}

export interface UpdateFundDepositResponse {
  message: string
  deposit: FundDeposit
  accountBalance?: BalanceChange
  fundBalance?: BalanceChange
}

// === Fund Deposits Grouped by Asset ===

/** Информация о фонде с количеством актива */
export interface FundAmount {
  fundId: string
  fundName: string
  fundIcon: string | null
  fundColor: string | null
  amount: number
  value: number
}

/** Актив, сгруппированный по фондам */
export interface AssetGrouped {
  assetId: string
  assetName: string
  assetTicker: string | null
  assetCurrency: string
  assetTypeName: string
  currentPrice: number
  totalAmount: number
  totalValue: number
  funds: FundAmount[]
}

/** Ответ API для группировки активов по фондам */
export interface GroupedByAssetResponse {
  data: AssetGrouped[]
  total: number
}

/** Параметры запроса для /assets/by-fund */
export interface AssetByFundParams {
  asset_id?: string
}

/** Ответ API для /assets/by-fund */
export interface AssetByFundResponse {
  data: AssetGrouped[]
  total: number
}

// === Credit Card Reserves (Резервы по кредитным картам) ===

export type ReserveStatus = 'pending' | 'used' | 'cancelled'

// Go nullable time type
export interface NullableTime {
  Time: string
  Valid: boolean
}

export interface CreditCardReserve {
  id: UUID
  fundId: UUID
  fundName?: string  // Может быть null если фонд не найден
  expenseId: UUID
  expenseDate: ISODate  // Дата расхода
  expenseDescription?: string | null
  amount: number           // Полная сумма резерва
  appliedAmount: number    // Уже погашено
  remaining: number        // Осталось погасить
  currency: string
  status: ReserveStatus
  createdAt: ISODate
}

export interface CreditCardReservesResponse {
  data: CreditCardReserve[]
  totalPending: number
}

// Ручное применение резервов (учётная операция)
export interface ApplyReservesRequest {
  reserveIds: string[]
}

export interface ApplyReservesResponse {
  appliedCount: number
  appliedAmount: number
}

// Погашение кредитной карты с авто-применением резервов
export interface RepayRequest {
  fromAccountId: string
  amount: number
  applyReserves?: boolean  // По умолчанию true
  date?: ISODate
  description?: string
}

export interface RepayResponse {
  transferId: UUID
  amount: number
  appliedReserves: number      // Количество применённых резервов
  reservedAmount: number       // Сумма применённых резервов
}

// === Import (Импорт данных из внешних источников) ===

export type ImportSource = 'coinkeeper'

export type UnmappedItemType = 'account' | 'category' | 'tag'

export interface ImportDateRange {
  from: ISODate
  to: ISODate
}

export interface ImportOperationSummary {
  count: number
  dateRange: ImportDateRange
  total: number
}

export interface ImportDuplicate {
  date: ISODate
  amount: number
  currency: string
  account: string
  category?: string
  existingId: UUID
  reason: 'exact_match' | 'similar_match'
  type: 'expense' | 'transfer' | 'income'
}

export interface ImportWarning {
  date: ISODate
  amount: number
  currency: string
  account: string
  reason: 'unmapped_account' | 'unmapped_category' | 'unmapped_tag' | 'invalid_format'
  details: string
  type: 'expense' | 'transfer' | 'income'
  lineNumber: number
}

export interface UnmappedItem {
  externalName: string
  count: number
  type: UnmappedItemType
}

export interface ImportByDateSummary {
  date: string // YYYY-MM-DD
  expenses: number
  transfers: number
  incomes: number
  corrections: number
}

export interface ImportCorrection {
  date: ISODate
  amount: number
  currency: string
  account: string
  description?: string
  lineNumber: number
}

export interface ImportRow {
  line_number: number
  date: ISODate
  type: 'expense' | 'transfer' | 'income' | 'correction'
  from_account: string
  to_account: string
  amount: number
  currency: string
  tags?: string[]
  note?: string
  is_duplicate: boolean
  has_mapping: boolean
}

export interface AnalyzeImportRequest {
  source: ImportSource
  csvData: string // base64 encoded
  fileName: string
}

export interface AnalyzeImportResponse {
  fullPeriod: ImportDateRange
  expenses: ImportOperationSummary
  transfers: ImportOperationSummary
  incomes: ImportOperationSummary
  corrections: ImportOperationSummary
  correctionsList: ImportCorrection[] // Детализация корректировок
  readyToImport: {
    expenses: number
    transfers: number
    incomes: number
  }
  duplicates: ImportDuplicate[]
  warnings: ImportWarning[]
  unmappedItems: UnmappedItem[]
  parsedRows: number
  byDate: Record<string, ImportByDateSummary>
  accounts: string[] // Список уникальных счетов из CSV
  rows: ImportRow[] // Все распарсенные строки
}

export type ImportOperationType = 'expense' | 'transfer' | 'income'

export interface ExecuteImportRequest {
  source: ImportSource
  csvData: string // base64 encoded
  fileName: string
  dateFrom: string // YYYY-MM-DD
  dateTo: string // YYYY-MM-DD
  skipDuplicates: boolean
  createTags: boolean
  dryRun: boolean
  types?: ImportOperationType[] // Фильтр по типам операций
  accounts?: string[] // Фильтр по названиям счетов из CSV
}

export interface ImportedOperation {
  id: UUID
  type: 'expense' | 'transfer' | 'income'
  date: ISODate
  amount: number
  currency: string
}

export interface SkippedOperation {
  type: 'expense' | 'transfer' | 'income'
  date: ISODate
  amount: number
  reason: 'duplicate' | 'unmapped'
  lineNumber: number
}

export interface ImportError {
  type: 'expense' | 'transfer' | 'income'
  date: ISODate
  amount: number
  error: string
  lineNumber: number
}

export interface ExecuteImportResponse {
  sessionId: UUID
  imported: {
    expenses: ImportedOperation[]
    transfers: ImportedOperation[]
    incomes: ImportedOperation[]
  }
  skipped: SkippedOperation[]
  errors: ImportError[]
  summary: {
    expensesImported: number
    transfersImported: number
    incomesImported: number
    duplicatesSkipped: number
    errorsCount: number
  }
}

// === Import Mappings (Маппинги для импорта) ===

export interface ImportAccountMapping {
  id: UUID
  source: ImportSource
  externalName: string
  accountId: UUID
  accountName?: string
  createdAt: ISODate
}

export interface ImportCategoryMapping {
  id: UUID
  source: ImportSource
  externalName: string
  categoryId: UUID
  categoryName?: string
  createdAt: ISODate
}

export interface ImportTagMapping {
  id: UUID
  source: ImportSource
  externalName: string
  tagId: UUID
  tagName?: string
  createdAt: ISODate
}

export interface CreateAccountMappingRequest {
  source: ImportSource
  externalName: string
  accountId: string
}

export interface CreateCategoryMappingRequest {
  source: ImportSource
  externalName: string
  categoryId: string
}

export interface CreateTagMappingRequest {
  source: ImportSource
  externalName: string
  tagId: string
}

export interface AccountMappingsListResponse {
  data: ImportAccountMapping[]
  total: number
}

export interface CategoryMappingsListResponse {
  data: ImportCategoryMapping[]
  total: number
}

export interface TagMappingsListResponse {
  data: ImportTagMapping[]
  total: number
}

export interface ImportMappingsListParams {
  source?: ImportSource
  [key: string]: string | number | boolean | undefined
}
