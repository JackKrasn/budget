# Изменения для фронтенда

## 1. Добавление поддержки `fund_deposits` (переводы в фонды)

### Проблема
При пополнении фонда со счёта через `/funds/{id}/deposit` не отображалась транзакция в истории счёта.

### Решение на бэкенде
Создана таблица `fund_deposits` для учёта переводов со счёта в фонд. Теперь при вызове `/funds/{id}/deposit` создаётся запись о переводе, которая:
- Вычитается из баланса счёта
- Отображается в истории транзакций

---

## Изменения API

### 1. Новый endpoint: `GET /fund-deposits`

**Описание:** Получить список переводов в фонды

**Query параметры:**
- `fund_id` (optional) - фильтр по фонду
- `from_account_id` (optional) - фильтр по счёту
- `from_date` (optional) - дата начала (YYYY-MM-DD)
- `to_date` (optional) - дата окончания (YYYY-MM-DD)

**Response:**
```typescript
interface FundDeposit {
  id: string;
  fundId: string;
  fundName: string;
  fundIcon: string | null;
  fundColor: string | null;
  fromAccountId: string;
  accountName: string;
  assetId: string;
  assetName: string;
  amount: number;
  currency: string;
  date: string; // YYYY-MM-DD
  note: string | null;
  createdAt: string; // ISO 8601
}

interface ListFundDepositsResponse {
  data: FundDeposit[];
  total: number;
}
```

---

## Что нужно изменить на фронтенде

### 1. История транзакций счёта

**Файл:** Компонент отображения истории счёта (например, `AccountTransactions.tsx`)

**Задача:** Добавить отображение переводов в фонды

```typescript
// Добавить новый тип транзакции
enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  FUND_DEPOSIT = 'fund_deposit', // НОВОЕ
  BALANCE_ADJUSTMENT = 'balance_adjustment'
}

// Расширить интерфейс транзакции
interface AccountTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  // ... другие поля

  // Для fund_deposit
  fundId?: string;
  fundName?: string;
  fundIcon?: string;
  fundColor?: string;
}
```

**Отображение:**
```tsx
{transaction.type === 'fund_deposit' && (
  <TransactionRow>
    <TransactionIcon icon={transaction.fundIcon || 'trending-up'} color={transaction.fundColor} />
    <TransactionDescription>
      Пополнение фонда "{transaction.fundName}"
    </TransactionDescription>
    <TransactionAmount negative>
      -{formatCurrency(transaction.amount)}
    </TransactionAmount>
  </TransactionRow>
)}
```

---

### 2. Получение истории транзакций

**Файл:** API сервис или хук для загрузки транзакций счёта

**Задача:** Добавить загрузку `fund_deposits` вместе с другими транзакциями

```typescript
async function getAccountTransactions(accountId: string, params?: {
  fromDate?: string;
  toDate?: string;
}) {
  // Загрузить все типы транзакций параллельно
  const [incomes, expenses, transfersIn, transfersOut, fundDeposits, adjustments] =
    await Promise.all([
      api.get(`/incomes?accountId=${accountId}&...`),
      api.get(`/expenses?accountId=${accountId}&...`),
      api.get(`/transfers?toAccountId=${accountId}&...`),
      api.get(`/transfers?fromAccountId=${accountId}&...`),
      api.get(`/fund-deposits?from_account_id=${accountId}&...`), // НОВОЕ
      api.get(`/balance-adjustments?accountId=${accountId}&...`)
    ]);

  // Объединить и отсортировать по дате
  return [
    ...incomes.data.map(i => ({ ...i, type: 'income' })),
    ...expenses.data.map(e => ({ ...e, type: 'expense' })),
    ...transfersIn.data.map(t => ({ ...t, type: 'transfer_in' })),
    ...transfersOut.data.map(t => ({ ...t, type: 'transfer_out' })),
    ...fundDeposits.data.map(fd => ({ ...fd, type: 'fund_deposit' })), // НОВОЕ
    ...adjustments.data.map(a => ({ ...a, type: 'balance_adjustment' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
```

---

### 3. Расчёт баланса счёта (если есть на фронте)

**Внимание:** Баланс должен рассчитываться на бэкенде, но если есть клиентская логика для отображения:

```typescript
function calculateAccountBalance(transactions: AccountTransaction[]): number {
  return transactions.reduce((balance, tx) => {
    switch (tx.type) {
      case 'income':
      case 'transfer_in':
      case 'balance_adjustment': // если положительная
        return balance + tx.amount;

      case 'expense':
      case 'transfer_out':
      case 'fund_deposit': // НОВОЕ - вычитаем
        return balance - tx.amount;

      default:
        return balance;
    }
  }, 0);
}
```

---

### 4. Отображение иконок и цветов

**Рекомендации:**

```tsx
const transactionTypeConfig = {
  income: {
    icon: 'arrow-down-circle',
    color: 'green',
    label: 'Доход'
  },
  expense: {
    icon: 'arrow-up-circle',
    color: 'red',
    label: 'Расход'
  },
  transfer_in: {
    icon: 'arrow-right-circle',
    color: 'blue',
    label: 'Перевод на счёт'
  },
  transfer_out: {
    icon: 'arrow-left-circle',
    color: 'blue',
    label: 'Перевод со счёта'
  },
  fund_deposit: { // НОВОЕ
    icon: 'trending-up',
    color: 'purple',
    label: 'Пополнение фонда'
  },
  balance_adjustment: {
    icon: 'edit',
    color: 'gray',
    label: 'Корректировка'
  }
};
```

---

## 5. История фонда

**Файл:** Компонент истории фонда (например, `FundHistory.tsx`)

**Задача:** Добавить отображение пополнений со счёта

Если у вас есть компонент, показывающий историю операций фонда, добавьте туда `fund_deposits`:

```typescript
async function getFundHistory(fundId: string) {
  const [contributions, withdrawals, deposits, transactions] = await Promise.all([
    api.get(`/funds/${fundId}/contributions`),
    api.get(`/funds/${fundId}/withdrawals`),
    api.get(`/fund-deposits?fund_id=${fundId}`), // НОВОЕ
    api.get(`/funds/${fundId}/transactions`)
  ]);

  return {
    contributions: contributions.data,
    withdrawals: withdrawals.data,
    deposits: deposits.data, // НОВОЕ
    transactions: transactions.data
  };
}
```

---

## Обновление типов TypeScript

### Новые типы

```typescript
// types/fund-deposits.ts

export interface FundDeposit {
  id: string;
  fundId: string;
  fundName: string;
  fundIcon: string | null;
  fundColor: string | null;
  fromAccountId: string;
  accountName: string;
  assetId: string;
  assetName: string;
  amount: number;
  currency: string;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface ListFundDepositsParams {
  fund_id?: string;
  from_account_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface ListFundDepositsResponse {
  data: FundDeposit[];
  total: number;
}
```

### API клиент

```typescript
// api/fund-deposits.ts

export const fundDepositsApi = {
  list: (params?: ListFundDepositsParams) =>
    api.get<ListFundDepositsResponse>('/fund-deposits', { params }),

  get: (id: string) =>
    api.get<FundDeposit>(`/fund-deposits/${id}`),

  delete: (id: string) =>
    api.delete(`/fund-deposits/${id}`)
};
```

---

## Изменения в существующих компонентах

### 1. Дашборд / Обзор счёта

Если показываются "последние транзакции", добавьте `fund_deposits` в список.

### 2. Графики и аналитика

Если есть графики расходов по категориям или аналитика счёта, убедитесь что `fund_deposits` учитываются как списания.

### 3. Фильтры транзакций

Добавьте "Пополнение фонда" в фильтры типов транзакций:

```tsx
<Select>
  <option value="all">Все транзакции</option>
  <option value="income">Доходы</option>
  <option value="expense">Расходы</option>
  <option value="transfer">Переводы</option>
  <option value="fund_deposit">Пополнения фондов</option> {/* НОВОЕ */}
  <option value="adjustment">Корректировки</option>
</Select>
```

---

## Дополнительно: Новые поля в Budget API

### Обновление типов для бюджета

В ответе `/budgets/{id}` добавлены новые поля:

```typescript
interface DistributionSummary {
  totalExpectedDistribution: number;
  totalExpectedFromPlannedDistribution: number; // НОВОЕ
  totalPlannedDistribution: number;
  totalActualDistribution: number;
  expectedRemainingForBudget: number;
  actualRemainingForBudget: number;
  distributionDifference: number;
}

interface FundDistributionItem {
  fundId: string;
  fundName: string;
  fundIcon: string | null;
  fundColor: string | null;
  expectedAmount: number;
  expectedFromPlannedAmount: number; // НОВОЕ
  plannedAmount: number;
  actualAmount: number;
}
```

**Что это означает:**

- `totalExpectedFromPlannedDistribution` - ожидаемое распределение от **ещё не полученных** доходов (planned_incomes со статусом "pending")
- `expectedFromPlannedAmount` - то же самое, но для каждого фонда отдельно

**Где использовать:**

В компоненте отображения бюджета можно показать пользователю, сколько денег пойдёт в фонды от ожидаемых (но ещё не полученных) доходов:

```tsx
<BudgetSummary>
  <SummaryItem>
    <Label>Ожидается в фонды (всего):</Label>
    <Value>{formatCurrency(distributionSummary.totalExpectedDistribution)}</Value>
  </SummaryItem>

  <SummaryItem>
    <Label>Из них от ожидаемых доходов:</Label>
    <Value highlight>{formatCurrency(distributionSummary.totalExpectedFromPlannedDistribution)}</Value>
  </SummaryItem>
</BudgetSummary>
```

---

## Чеклист для фронтенд-разработчика

- [ ] Добавить API endpoint `/fund-deposits` в API клиент
- [ ] Создать TypeScript типы для `FundDeposit`
- [ ] Добавить тип транзакции `fund_deposit` в enum
- [ ] Обновить компонент истории счёта для отображения переводов в фонды
- [ ] Обновить функцию загрузки транзакций счёта (добавить `fund_deposits`)
- [ ] Добавить иконку и стиль для "Пополнение фонда"
- [ ] Обновить фильтры транзакций (добавить "Пополнения фондов")
- [ ] Проверить расчёт баланса (если есть на фронте)
- [ ] Обновить типы для `DistributionSummary` и `FundDistributionItem`
- [ ] Добавить отображение `expectedFromPlannedAmount` в компоненте бюджета
- [ ] Протестировать: создать перевод в фонд и проверить, что он отображается в истории счёта

---

## Примеры использования

### Получение переводов в фонды для счёта

```typescript
const deposits = await fundDepositsApi.list({
  from_account_id: accountId,
  from_date: '2024-01-01',
  to_date: '2024-01-31'
});

console.log(deposits.data);
// [
//   {
//     id: "uuid",
//     fundId: "fund-uuid",
//     fundName: "Фонд отпуска",
//     fundIcon: "🏖️",
//     fundColor: "#4CAF50",
//     fromAccountId: "account-uuid",
//     accountName: "Сбербанк",
//     assetId: "asset-uuid",
//     assetName: "Российский рубль",
//     amount: 50000,
//     currency: "RUB",
//     date: "2024-01-15",
//     note: "Ежемесячное пополнение",
//     createdAt: "2024-01-15T12:00:00Z"
//   }
// ]
```

### Объединение всех транзакций

```typescript
const allTransactions = await getAccountTransactions(accountId);

// Отсортированы по дате, включая fund_deposits
allTransactions.forEach(tx => {
  if (tx.type === 'fund_deposit') {
    console.log(`Пополнение фонда "${tx.fundName}" на ${tx.amount}`);
  }
});
```

---

**Вопросы?** Обращайтесь к бэкенд-разработчику для уточнения деталей API.
