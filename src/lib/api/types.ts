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
  initialBalance?: number
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
  assetId: string // ID валютного актива фонда для списания
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
  tagId?: string
  fundId?: string // фильтр по фонду (расходы, профинансированные из этого фонда)
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
export type DepositStatus = 'active' | 'matured' | 'closed_early'

// Go time format can be string or { Time: string; Valid: boolean }
export type NullableDate = ISODate | { Time: string; Valid: boolean } | null

export interface Deposit {
  id: UUID
  assetId: UUID
  assetName: string
  currency: string
  principalAmount: number
  currentAmount: number
  interestRate: number
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
  notes?: string
  createdAt: NullableDate
}

export interface CreateDepositRequest {
  name: string
  fundId: string
  currency: string
  principalAmount: number
  interestRate: number
  termMonths: number
  accrualPeriod: AccrualPeriod
  hasCapitalization: boolean
  startDate: string
  notes?: string
}

export interface UpdateDepositRequest {
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

// === Transfers (Переводы между счетами) ===

export interface Transfer {
  id: UUID
  from_account_id: UUID
  to_account_id: UUID
  amount: number
  currency: string
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
  currency: string
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

// === Fund Asset Operations ===

export type FundTransactionType =
  | 'buy'
  | 'sell'
  | 'transfer_in'
  | 'transfer_out'
  | 'deposit'
  | 'withdrawal'
  | 'contribution'

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
