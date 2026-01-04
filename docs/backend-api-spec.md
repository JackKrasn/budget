# Budget Planner Backend API Specification

## Overview

REST API для приложения финансового планирования бюджета. Backend реализуется на Go.

**Base URL:** `/api/v1`

---

## Data Models

### Asset (Актив)

Базовая единица хранения средств. Активы могут быть привязаны к фондам.

```go
type AssetType string

const (
    AssetTypeCashRUB   AssetType = "cash_rub"
    AssetTypeCashUSD   AssetType = "cash_usd"
    AssetTypeCashEUR   AssetType = "cash_eur"
    AssetTypeCrypto    AssetType = "crypto"
    AssetTypeStocks    AssetType = "stocks"
    AssetTypeETF       AssetType = "etf"
    AssetTypeBonds     AssetType = "bonds"
    AssetTypeDeposit   AssetType = "deposit"
)

type Asset struct {
    ID           string    `json:"id"`
    Type         AssetType `json:"type"`
    Name         string    `json:"name"`          // "Доллары", "BTC", "Тинькофф Вклад", "SBER акции"
    Ticker       *string   `json:"ticker"`        // "BTC", "SBER", "TMOS" (для акций/крипты)
    Currency     string    `json:"currency"`      // Базовая валюта актива: RUB, USD, EUR, BTC
    CurrentPrice *float64  `json:"currentPrice"`  // Текущая цена за единицу (для акций/крипты)
    AccountID    *string   `json:"accountId"`     // Где хранится (банк, биржа)
    CreatedAt    time.Time `json:"createdAt"`
    UpdatedAt    time.Time `json:"updatedAt"`
}
```

### Fund (Фонд)

Логическая группировка средств для определённой цели. Фонд может содержать несколько активов.

```go
type DistributionType string

const (
    DistributionPercentage DistributionType = "percentage"
    DistributionFixed      DistributionType = "fixed"
    DistributionRemainder  DistributionType = "remainder"
)

type DistributionRule struct {
    Type  DistributionType `json:"type"`
    Value *float64         `json:"value,omitempty"` // % или фиксированная сумма
}

type FundStatus string

const (
    FundStatusActive    FundStatus = "active"
    FundStatusCompleted FundStatus = "completed"
    FundStatusPaused    FundStatus = "paused"
)

type Fund struct {
    ID               string           `json:"id"`
    Name             string           `json:"name"`             // "Инвестиции", "Ремонт", "Отпуск"
    Icon             string           `json:"icon"`
    Color            string           `json:"color"`
    TargetAmount     *float64         `json:"targetAmount"`     // Целевая сумма (опционально)
    TargetCurrency   string           `json:"targetCurrency"`   // Валюта цели (RUB по умолчанию)
    Deadline         *time.Time       `json:"deadline"`         // Дедлайн (опционально)
    DistributionRule DistributionRule `json:"distributionRule"`
    IsVirtual        bool             `json:"isVirtual"`        // Виртуальный (учётный) или реальный
    Status           FundStatus       `json:"status"`
    CreatedAt        time.Time        `json:"createdAt"`
    UpdatedAt        time.Time        `json:"updatedAt"`
}
```

### FundAsset (Связь Фонд-Актив)

Сколько определённого актива находится в фонде.

```go
type FundAsset struct {
    ID        string    `json:"id"`
    FundID    string    `json:"fundId"`
    AssetID   string    `json:"assetId"`
    Amount    float64   `json:"amount"`    // Количество актива в фонде
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
}
```

### FundBalance (Вычисляемый баланс фонда)

```go
type FundAssetBalance struct {
    Asset        Asset   `json:"asset"`
    Amount       float64 `json:"amount"`       // Количество
    ValueRUB     float64 `json:"valueRub"`     // Стоимость в рублях
    ValueOriginal float64 `json:"valueOriginal"` // Стоимость в валюте актива
}

type FundBalance struct {
    Fund         Fund               `json:"fund"`
    Assets       []FundAssetBalance `json:"assets"`
    TotalRUB     float64            `json:"totalRub"`     // Общая стоимость в рублях
    Progress     *float64           `json:"progress"`     // Прогресс к цели (0-100), если есть targetAmount
}
```

### Income (Доход)

```go
type IncomeSource string

const (
    IncomeSourceSalary  IncomeSource = "salary"
    IncomeSourceAdvance IncomeSource = "advance"
    IncomeSourceBonus   IncomeSource = "bonus"
    IncomeSourceOther   IncomeSource = "other"
)

type Income struct {
    ID                 string              `json:"id"`
    Source             IncomeSource        `json:"source"`
    Amount             float64             `json:"amount"`
    Currency           string              `json:"currency"`
    Date               time.Time           `json:"date"`
    Description        *string             `json:"description"`
    Distributions      []IncomeDistribution `json:"distributions"`
    RemainingForBudget float64             `json:"remainingForBudget"` // Остаток для бюджета
    CreatedAt          time.Time           `json:"createdAt"`
}
```

### IncomeDistribution (Распределение дохода по фондам)

```go
type IncomeDistribution struct {
    ID            string    `json:"id"`
    IncomeID      string    `json:"incomeId"`
    FundID        string    `json:"fundId"`
    PlannedAmount float64   `json:"plannedAmount"` // Запланированная сумма
    ActualAmount  float64   `json:"actualAmount"`  // Фактически переведённая сумма
    IsCompleted   bool      `json:"isCompleted"`   // Перевод выполнен
    CompletedAt   *time.Time `json:"completedAt"`
}
```

### FundContribution (Пополнение фонда)

Запись о пополнении фонда с разбивкой по активам.

```go
type FundContribution struct {
    ID          string                        `json:"id"`
    FundID      string                        `json:"fundId"`
    IncomeID    *string                       `json:"incomeId"`    // Связь с доходом (если есть)
    Date        time.Time                     `json:"date"`
    TotalAmount float64                       `json:"totalAmount"` // Общая сумма пополнения
    Currency    string                        `json:"currency"`
    Allocations []FundContributionAllocation  `json:"allocations"`
    Note        *string                       `json:"note"`
    CreatedAt   time.Time                     `json:"createdAt"`
}

type FundContributionAllocation struct {
    ID             string  `json:"id"`
    ContributionID string  `json:"contributionId"`
    AssetID        string  `json:"assetId"`
    Amount         float64 `json:"amount"` // Сколько единиц актива добавлено
    PricePerUnit   float64 `json:"pricePerUnit"` // Цена за единицу на момент покупки
}
```

### FundWithdrawal (Списание из фонда)

```go
type FundWithdrawal struct {
    ID          string                      `json:"id"`
    FundID      string                      `json:"fundId"`
    Date        time.Time                   `json:"date"`
    TotalAmount float64                     `json:"totalAmount"`
    Currency    string                      `json:"currency"`
    Allocations []FundWithdrawalAllocation  `json:"allocations"`
    Purpose     string                      `json:"purpose"` // На что потрачено
    Note        *string                     `json:"note"`
    CreatedAt   time.Time                   `json:"createdAt"`
}

type FundWithdrawalAllocation struct {
    ID           string  `json:"id"`
    WithdrawalID string  `json:"withdrawalId"`
    AssetID      string  `json:"assetId"`
    Amount       float64 `json:"amount"`
}
```

### Account (Счёт / Место хранения)

```go
type AccountType string

const (
    AccountTypeCard       AccountType = "card"
    AccountTypeCash       AccountType = "cash"
    AccountTypeDeposit    AccountType = "deposit"
    AccountTypeCredit     AccountType = "credit"
    AccountTypeInvestment AccountType = "investment"
    AccountTypeCrypto     AccountType = "crypto_wallet"
)

type Account struct {
    ID         string      `json:"id"`
    Name       string      `json:"name"`
    Type       AccountType `json:"type"`
    Currency   string      `json:"currency"`
    BankName   *string     `json:"bankName"`
    Icon       *string     `json:"icon"`
    Color      *string     `json:"color"`
    IsArchived bool        `json:"isArchived"`
    CreatedAt  time.Time   `json:"createdAt"`
    UpdatedAt  time.Time   `json:"updatedAt"`
}
```

### ExchangeRate (Курс валют)

```go
type ExchangeRate struct {
    ID        string    `json:"id"`
    FromCurrency string `json:"fromCurrency"`
    ToCurrency   string `json:"toCurrency"`
    Rate      float64   `json:"rate"`
    Date      time.Time `json:"date"`
    Source    string    `json:"source"` // "manual", "cbr", "binance"
    CreatedAt time.Time `json:"createdAt"`
}
```

---

## API Endpoints

### Assets

#### List Assets
```
GET /assets
```

Query Parameters:
- `type` - фильтр по типу актива
- `currency` - фильтр по валюте

Response:
```json
{
  "data": [Asset],
  "total": 10
}
```

#### Get Asset
```
GET /assets/{id}
```

#### Create Asset
```
POST /assets
```

Request Body:
```json
{
  "type": "stocks",
  "name": "Сбербанк акции",
  "ticker": "SBER",
  "currency": "RUB",
  "currentPrice": 250.50,
  "accountId": "uuid"
}
```

#### Update Asset
```
PATCH /assets/{id}
```

#### Delete Asset
```
DELETE /assets/{id}
```

#### Update Asset Price
```
POST /assets/{id}/price
```

Request Body:
```json
{
  "price": 255.30,
  "source": "manual"
}
```

---

### Funds

#### List Funds
```
GET /funds
```

Query Parameters:
- `status` - фильтр по статусу (active, completed, paused)
- `includeBalances` - включить расчёт балансов (default: true)

Response:
```json
{
  "data": [FundBalance],
  "total": 5,
  "summary": {
    "totalRub": 1500000,
    "totalDistributionPercentage": 50
  }
}
```

#### Get Fund
```
GET /funds/{id}
```

Response: `FundBalance`

#### Create Fund
```
POST /funds
```

Request Body:
```json
{
  "name": "Отпуск 2025",
  "icon": "plane",
  "color": "#06b6d4",
  "targetAmount": 300000,
  "targetCurrency": "RUB",
  "deadline": "2025-07-01",
  "distributionRule": {
    "type": "percentage",
    "value": 7
  },
  "isVirtual": true
}
```

#### Update Fund
```
PATCH /funds/{id}
```

#### Delete Fund
```
DELETE /funds/{id}
```

#### Get Fund History
```
GET /funds/{id}/history
```

Query Parameters:
- `from` - дата начала
- `to` - дата окончания
- `type` - тип операции (contribution, withdrawal, all)

Response:
```json
{
  "contributions": [FundContribution],
  "withdrawals": [FundWithdrawal]
}
```

---

### Fund Assets (Активы в фонде)

#### List Fund Assets
```
GET /funds/{fundId}/assets
```

Response:
```json
{
  "data": [FundAssetBalance]
}
```

#### Add Asset to Fund
```
POST /funds/{fundId}/assets
```

Request Body:
```json
{
  "assetId": "uuid",
  "amount": 100
}
```

#### Update Asset Amount in Fund
```
PATCH /funds/{fundId}/assets/{assetId}
```

Request Body:
```json
{
  "amount": 150
}
```

#### Remove Asset from Fund
```
DELETE /funds/{fundId}/assets/{assetId}
```

---

### Fund Contributions (Пополнения)

#### Create Contribution
```
POST /funds/{fundId}/contributions
```

Request Body:
```json
{
  "date": "2025-01-15",
  "totalAmount": 21000,
  "currency": "RUB",
  "incomeId": "uuid",
  "allocations": [
    {
      "assetId": "uuid-rub-cash",
      "amount": 15000,
      "pricePerUnit": 1
    },
    {
      "assetId": "uuid-usd-cash",
      "amount": 60,
      "pricePerUnit": 100
    }
  ],
  "note": "Зарплата январь"
}
```

#### List Contributions
```
GET /funds/{fundId}/contributions
```

---

### Fund Withdrawals (Списания)

#### Create Withdrawal
```
POST /funds/{fundId}/withdrawals
```

Request Body:
```json
{
  "date": "2025-01-20",
  "totalAmount": 50000,
  "currency": "RUB",
  "allocations": [
    {
      "assetId": "uuid-rub",
      "amount": 50000
    }
  ],
  "purpose": "Покупка телевизора",
  "note": null
}
```

---

### Incomes

#### List Incomes
```
GET /incomes
```

Query Parameters:
- `from` - дата начала
- `to` - дата окончания
- `source` - фильтр по источнику

Response:
```json
{
  "data": [Income],
  "total": 24,
  "summary": {
    "totalAmount": 3600000,
    "bySource": {
      "salary": 2400000,
      "advance": 1200000
    }
  }
}
```

#### Get Income
```
GET /incomes/{id}
```

#### Create Income
```
POST /incomes
```

Request Body:
```json
{
  "source": "salary",
  "amount": 300000,
  "currency": "RUB",
  "date": "2025-01-05",
  "description": "Зарплата за декабрь"
}
```

Response: Income с автоматически рассчитанными `distributions` на основе правил фондов.

#### Update Income
```
PATCH /incomes/{id}
```

#### Delete Income
```
DELETE /incomes/{id}
```

---

### Income Distributions

#### Update Distribution
```
PATCH /incomes/{incomeId}/distributions/{fundId}
```

Request Body:
```json
{
  "plannedAmount": 25000
}
```

#### Confirm Distribution
```
POST /incomes/{incomeId}/distributions/{fundId}/confirm
```

Request Body:
```json
{
  "actualAmount": 21000,
  "allocations": [
    {
      "assetId": "uuid-rub",
      "amount": 15000
    },
    {
      "assetId": "uuid-usd",
      "amount": 60
    }
  ]
}
```

Этот endpoint:
1. Помечает распределение как выполненное
2. Создаёт `FundContribution` с указанными allocations
3. Обновляет балансы активов в фонде

---

### Accounts

#### List Accounts
```
GET /accounts
```

#### Create Account
```
POST /accounts
```

#### Update Account
```
PATCH /accounts/{id}
```

#### Delete Account
```
DELETE /accounts/{id}
```

---

### Exchange Rates

#### Get Current Rates
```
GET /exchange-rates
```

Response:
```json
{
  "rates": {
    "USD_RUB": 100.50,
    "EUR_RUB": 105.30,
    "BTC_USD": 98000
  },
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

#### Update Rate
```
POST /exchange-rates
```

Request Body:
```json
{
  "fromCurrency": "USD",
  "toCurrency": "RUB",
  "rate": 100.50,
  "source": "manual"
}
```

---

### Dashboard / Analytics

#### Get Dashboard Summary
```
GET /dashboard
```

Response:
```json
{
  "totalInFunds": 1500000,
  "totalDistributionPercentage": 50,
  "activeFundsCount": 5,
  "currentMonth": {
    "income": 300000,
    "distributed": 150000,
    "remaining": 150000
  },
  "fundsProgress": [
    {
      "fundId": "uuid",
      "name": "Отпуск",
      "current": 95000,
      "target": 300000,
      "progress": 31.67,
      "deadline": "2025-07-01"
    }
  ],
  "recentIncomes": [Income]
}
```

#### Get Analytics
```
GET /analytics
```

Query Parameters:
- `period` - month, quarter, year
- `year` - год
- `month` - месяц (для period=month)

Response:
```json
{
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  },
  "income": {
    "total": 300000,
    "bySource": {...}
  },
  "distribution": {
    "total": 150000,
    "byFund": {...}
  },
  "fundsGrowth": [
    {
      "fundId": "uuid",
      "name": "Инвестиции",
      "startBalance": 400000,
      "endBalance": 450000,
      "change": 50000,
      "changePercent": 12.5
    }
  ]
}
```

---

## Database Schema (PostgreSQL)

```sql
-- Счета/места хранения
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
    bank_name VARCHAR(255),
    icon VARCHAR(100),
    color VARCHAR(20),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Активы
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    ticker VARCHAR(20),
    currency VARCHAR(10) NOT NULL,
    current_price DECIMAL(20, 8),
    account_id UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Фонды
CREATE TABLE funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL,
    target_amount DECIMAL(20, 2),
    target_currency VARCHAR(10) DEFAULT 'RUB',
    deadline DATE,
    distribution_type VARCHAR(20) NOT NULL,
    distribution_value DECIMAL(10, 2),
    is_virtual BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Связь фондов и активов
CREATE TABLE fund_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(fund_id, asset_id)
);

-- Доходы
CREATE TABLE incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
    date DATE NOT NULL,
    description TEXT,
    remaining_for_budget DECIMAL(20, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Распределение дохода по фондам
CREATE TABLE income_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    income_id UUID NOT NULL REFERENCES incomes(id) ON DELETE CASCADE,
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    planned_amount DECIMAL(20, 2) NOT NULL,
    actual_amount DECIMAL(20, 2) NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    UNIQUE(income_id, fund_id)
);

-- Пополнения фондов
CREATE TABLE fund_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    income_id UUID REFERENCES incomes(id),
    date DATE NOT NULL,
    total_amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Аллокации пополнений по активам
CREATE TABLE fund_contribution_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_id UUID NOT NULL REFERENCES fund_contributions(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id),
    amount DECIMAL(20, 8) NOT NULL,
    price_per_unit DECIMAL(20, 8) NOT NULL DEFAULT 1
);

-- Списания из фондов
CREATE TABLE fund_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
    purpose VARCHAR(500) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Аллокации списаний по активам
CREATE TABLE fund_withdrawal_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdrawal_id UUID NOT NULL REFERENCES fund_withdrawals(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id),
    amount DECIMAL(20, 8) NOT NULL
);

-- Курсы валют
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(20, 8) NOT NULL,
    date DATE NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(from_currency, to_currency, date)
);

-- История цен активов (для аналитики)
CREATE TABLE asset_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    price DECIMAL(20, 8) NOT NULL,
    date DATE NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(asset_id, date)
);

-- Индексы
CREATE INDEX idx_fund_assets_fund_id ON fund_assets(fund_id);
CREATE INDEX idx_fund_assets_asset_id ON fund_assets(asset_id);
CREATE INDEX idx_incomes_date ON incomes(date);
CREATE INDEX idx_income_distributions_income_id ON income_distributions(income_id);
CREATE INDEX idx_income_distributions_fund_id ON income_distributions(fund_id);
CREATE INDEX idx_fund_contributions_fund_id ON fund_contributions(fund_id);
CREATE INDEX idx_fund_contributions_date ON fund_contributions(date);
CREATE INDEX idx_fund_withdrawals_fund_id ON fund_withdrawals(fund_id);
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
```

---

## Examples

### Пример: Фонд "Инвестиции" с несколькими активами

```json
{
  "fund": {
    "id": "fund-investments",
    "name": "Инвестиции",
    "icon": "trending-up",
    "color": "#10b981",
    "distributionRule": {
      "type": "percentage",
      "value": 20
    },
    "isVirtual": false,
    "status": "active"
  },
  "assets": [
    {
      "asset": {
        "id": "asset-sber",
        "type": "stocks",
        "name": "Сбербанк",
        "ticker": "SBER",
        "currency": "RUB",
        "currentPrice": 250.50
      },
      "amount": 100,
      "valueRub": 25050,
      "valueOriginal": 25050
    },
    {
      "asset": {
        "id": "asset-btc",
        "type": "crypto",
        "name": "Bitcoin",
        "ticker": "BTC",
        "currency": "USD",
        "currentPrice": 98000
      },
      "amount": 0.05,
      "valueRub": 490000,
      "valueOriginal": 4900
    },
    {
      "asset": {
        "id": "asset-tmos",
        "type": "etf",
        "name": "Тинькофф iMOEX",
        "ticker": "TMOS",
        "currency": "RUB",
        "currentPrice": 5.50
      },
      "amount": 1000,
      "valueRub": 5500,
      "valueOriginal": 5500
    }
  ],
  "totalRub": 520550
}
```

### Пример: Распределение зарплаты

1. Создаём доход:
```json
POST /incomes
{
  "source": "salary",
  "amount": 300000,
  "currency": "RUB",
  "date": "2025-01-05"
}
```

2. Ответ с автоматическим распределением:
```json
{
  "id": "income-123",
  "source": "salary",
  "amount": 300000,
  "distributions": [
    { "fundId": "fund-investments", "plannedAmount": 60000, "actualAmount": 0, "isCompleted": false },
    { "fundId": "fund-repair", "plannedAmount": 30000, "actualAmount": 0, "isCompleted": false },
    { "fundId": "fund-vacation", "plannedAmount": 21000, "actualAmount": 0, "isCompleted": false }
  ],
  "remainingForBudget": 189000
}
```

3. Подтверждаем распределение в фонд инвестиций:
```json
POST /incomes/income-123/distributions/fund-investments/confirm
{
  "actualAmount": 60000,
  "allocations": [
    { "assetId": "asset-sber", "amount": 40, "pricePerUnit": 250 },
    { "assetId": "asset-tmos", "amount": 9000, "pricePerUnit": 5.55 }
  ]
}
```

---

## Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "field": "amount", "message": "must be positive" }
    ]
  }
}
```

Error codes:
- `VALIDATION_ERROR` - ошибка валидации
- `NOT_FOUND` - ресурс не найден
- `CONFLICT` - конфликт (например, удаление актива, который используется в фонде)
- `INTERNAL_ERROR` - внутренняя ошибка сервера

---

## Authentication (TODO)

В будущем планируется добавить:
- JWT токены
- Refresh tokens
- OAuth (Google, Yandex)

---

## Sync (TODO)

Для синхронизации между устройствами:
- WebSocket для real-time обновлений
- Conflict resolution при офлайн-изменениях
- Версионирование данных
