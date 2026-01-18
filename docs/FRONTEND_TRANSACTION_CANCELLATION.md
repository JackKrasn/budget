# Изменения на фронтенде: Отмена транзакций из разных мест

## Что изменилось на бэкенде

Теперь система поддерживает **3 способа отмены** подтверждённого распределения дохода:

1. ✅ **Со страницы распределений дохода** → `POST /incomes/{incomeId}/distributions/{fundId}/cancel`
2. ✅ **Со страницы истории счёта** (удаление fund_deposit) → `DELETE /fund-deposits/{id}`
3. ✅ **Со страницы истории фонда** (удаление через contribution) → `DELETE /funds/{fundId}/contributions/{contributionId}`

**ВАЖНО:** Все три способа выполняют одинаковый полный откат и **автоматически отменяют статус распределения дохода** (`is_completed = false`).

---

## Ключевые изменения в API

### 1. Новые поля в транзакциях

#### `GET /funds/{id}/transactions` (fund_asset_transactions)

**Добавлено:**
```json
{
  "id": "uuid",
  "fund_id": "uuid",
  "transaction_type": "deposit",
  "asset_id": "uuid",
  "amount": 1000.00,
  // ... другие поля ...

  // ⭐ НОВОЕ
  "contribution_id": "uuid",              // ID вклада (если транзакция связана с contribution)
  "contribution_income_id": "uuid | null" // ID дохода (если это от распределения дохода)
}
```

**Как определить тип транзакции:**
- Если `contribution_income_id != null` → это транзакция от распределения дохода
- Если `contribution_id != null` но `contribution_income_id == null` → ручное пополнение
- Если оба `null` → другой тип транзакции (покупка, продажа, перевод)

#### `GET /fund-deposits` (история переводов в фонд для счёта)

**Добавлено:**
```json
{
  "id": "uuid",
  "fund_id": "uuid",
  "from_account_id": "uuid",
  "asset_id": "uuid",
  "amount": 1000.00,
  // ... другие поля ...

  // ⭐ НОВОЕ
  "contribution_id": "uuid",              // ID вклада
  "contribution_income_id": "uuid | null" // ID дохода (если это от распределения дохода)
}
```

---

### 2. Улучшенная логика удаления fund_deposit

**Endpoint:** `DELETE /fund-deposits/{id}`

**Что делает:**
1. ✅ Возвращает деньги на счёт
2. ✅ Уменьшает активы фонда
3. ✅ Удаляет связанную транзакцию фонда (`fund_asset_transaction`)
4. ✅ **ОТМЕНЯЕТ СТАТУС РАСПРЕДЕЛЕНИЯ ДОХОДА** (`is_completed = false`)
5. ✅ Удаляет саму запись `fund_deposit`

**Когда использовать:**
- Пользователь отменяет транзакцию со страницы истории счёта
- У вас есть только `fund_deposit.id`

---

## Что нужно изменить на фронте

### 1. Обновить типы TypeScript

```typescript
// types/fundAssetTransaction.ts
interface FundAssetTransaction {
  id: string;
  fundId: string;
  transactionType: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'transfer_in' | 'transfer_out';
  assetId: string;
  assetName: string;
  amount: number;
  totalValue?: number;
  currency?: string;
  sourceAccountId?: string;
  sourceAccountName?: string;
  note?: string;
  date: string;
  createdAt: string;

  // ⭐ НОВЫЕ ПОЛЯ
  contributionId?: string;        // ID вклада
  contributionIncomeId?: string;  // ID дохода (если от распределения)
}

// types/fundDeposit.ts
interface FundDeposit {
  id: string;
  fundId: string;
  fundName: string;
  fundIcon?: string;
  fundColor?: string;
  fromAccountId: string;
  accountName: string;
  assetId: string;
  assetName: string;
  amount: number;
  currency: string;
  date: string;
  note?: string;
  createdAt: string;

  // ⭐ НОВЫЕ ПОЛЯ
  contributionId?: string;        // ID вклада
  contributionIncomeId?: string;  // ID дохода (если от распределения)
}
```

---

### 2. Отображение транзакций в истории фонда

```typescript
// components/FundTransactionsList.tsx

{transactions.map(tx => {
  // Определяем тип транзакции
  const isIncomeDistribution = tx.transactionType === 'deposit' && tx.contributionIncomeId;
  const isManualDeposit = tx.transactionType === 'deposit' && tx.contributionId && !tx.contributionIncomeId;

  if (isIncomeDistribution) {
    return (
      <TransactionRow key={tx.id}>
        <Badge variant="success">Распределение дохода</Badge>
        <TransactionDescription>
          {tx.assetName} • {tx.sourceAccountName}
        </TransactionDescription>
        <Amount positive>+{formatCurrency(tx.amount)} {tx.currency}</Amount>

        {/* ⭐ Кнопка удаления с правильным endpoint */}
        <DeleteButton
          onClick={() => handleDeleteByContribution(tx.contributionId, tx.fundId)}
          title="Отменить распределение"
        />
      </TransactionRow>
    );
  }

  if (isManualDeposit) {
    return (
      <TransactionRow key={tx.id}>
        <Badge variant="info">Ручное пополнение</Badge>
        <TransactionDescription>
          {tx.assetName} • {tx.sourceAccountName}
        </TransactionDescription>
        <Amount positive>+{formatCurrency(tx.amount)} {tx.currency}</Amount>

        {/* Обычное удаление contribution */}
        <DeleteButton
          onClick={() => handleDeleteByContribution(tx.contributionId, tx.fundId)}
          title="Удалить пополнение"
        />
      </TransactionRow>
    );
  }

  // ... другие типы транзакций
})}
```

---

### 3. Отображение транзакций в истории счёта

```typescript
// components/AccountTransactionsList.tsx

{deposits.map(deposit => {
  const isIncomeDistribution = deposit.contributionIncomeId != null;

  return (
    <TransactionRow key={deposit.id}>
      <TransactionIcon icon="arrow-up" color={isIncomeDistribution ? "green" : "blue"} />

      <TransactionDescription>
        <Title>Перевод в фонд {deposit.fundName}</Title>
        <Subtitle>
          {deposit.assetName}
          {isIncomeDistribution && (
            <Badge variant="success" size="sm">
              Распределение дохода
            </Badge>
          )}
        </Subtitle>
      </TransactionDescription>

      <Amount negative>-{formatCurrency(deposit.amount)} {deposit.currency}</Amount>
      <Date>{formatDate(deposit.date)}</Date>

      {/* ⭐ Кнопка отмены */}
      <DeleteButton
        onClick={() => handleCancelDeposit(deposit.id)}
        title={isIncomeDistribution ? "Отменить распределение" : "Отменить перевод"}
        variant={isIncomeDistribution ? "warning" : "default"}
      />
    </TransactionRow>
  );
})}
```

---

### 4. API методы для удаления

```typescript
// api/funds.ts
export const fundsApi = {
  // ... существующие методы

  // Удалить contribution (работает для обычных и income distribution)
  deleteContribution: async (fundId: string, contributionId: string) => {
    return api.delete(`/funds/${fundId}/contributions/${contributionId}`);
  },
};

// api/fundDeposits.ts
export const fundDepositsApi = {
  // ... существующие методы

  // Удалить fund_deposit (теперь отменяет статус распределения!)
  delete: async (depositId: string) => {
    return api.delete(`/fund-deposits/${depositId}`);
  },
};

// api/incomes.ts
export const incomesApi = {
  // ... существующие методы

  // Отменить распределение (основной способ)
  cancelDistribution: async (incomeId: string, fundId: string) => {
    return api.post(`/incomes/${incomeId}/distributions/${fundId}/cancel`);
  },
};
```

---

### 5. Обработчики удаления

```typescript
// hooks/useFundTransactions.ts

// 1. Удаление со страницы истории фонда (через contribution)
const handleDeleteByContribution = async (contributionId: string, fundId: string) => {
  if (!confirm('Отменить эту транзакцию? Все связанные операции будут откатаны.')) {
    return;
  }

  try {
    await fundsApi.deleteContribution(fundId, contributionId);

    // Обновить данные
    queryClient.invalidateQueries(['fund-transactions', fundId]);
    queryClient.invalidateQueries(['fund-contributions', fundId]);
    queryClient.invalidateQueries(['income-distributions']); // ⭐ ВАЖНО!

    toast.success('Транзакция отменена');
  } catch (error) {
    toast.error('Не удалось отменить транзакцию');
  }
};

// 2. Удаление со страницы истории счёта (fund_deposit)
const handleCancelDeposit = async (depositId: string) => {
  if (!confirm('Отменить этот перевод? Деньги вернутся на счёт.')) {
    return;
  }

  try {
    await fundDepositsApi.delete(depositId);

    // Обновить данные
    queryClient.invalidateQueries(['fund-deposits']);
    queryClient.invalidateQueries(['account-transactions']);
    queryClient.invalidateQueries(['fund-transactions']);
    queryClient.invalidateQueries(['income-distributions']); // ⭐ ВАЖНО!

    toast.success('Перевод отменён, деньги возвращены на счёт');
  } catch (error) {
    toast.error('Не удалось отменить перевод');
  }
};

// 3. Удаление со страницы распределений дохода
const handleCancelDistribution = async (incomeId: string, fundId: string) => {
  if (!confirm('Отменить распределение? Деньги вернутся на счёт.')) {
    return;
  }

  try {
    await incomesApi.cancelDistribution(incomeId, fundId);

    // Обновить данные
    queryClient.invalidateQueries(['income', incomeId]);
    queryClient.invalidateQueries(['income-distributions', incomeId]);
    queryClient.invalidateQueries(['account-transactions']);
    queryClient.invalidateQueries(['fund-transactions']);

    toast.success('Распределение отменено');
  } catch (error) {
    toast.error('Не удалось отменить распределение');
  }
};
```

---

### 6. Диалог подтверждения с деталями

```typescript
// components/CancelTransactionDialog.tsx

interface CancelTransactionDialogProps {
  transaction: FundAssetTransaction;
  onConfirm: () => void;
  onCancel: () => void;
}

const CancelTransactionDialog: React.FC<CancelTransactionDialogProps> = ({
  transaction,
  onConfirm,
  onCancel
}) => {
  const isIncomeDistribution = transaction.contributionIncomeId != null;

  return (
    <Dialog open>
      <DialogHeader>
        <DialogTitle>
          {isIncomeDistribution
            ? 'Отменить распределение дохода?'
            : 'Отменить транзакцию?'}
        </DialogTitle>
      </DialogHeader>

      <DialogBody>
        <Alert variant={isIncomeDistribution ? "warning" : "info"}>
          <AlertTitle>Что произойдёт:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              <li>Деньги вернутся на счёт "{transaction.sourceAccountName}"</li>
              <li>Активы фонда уменьшатся на {formatCurrency(transaction.amount)} {transaction.currency}</li>
              <li>Транзакция исчезнет из истории счёта и фонда</li>
              {isIncomeDistribution && (
                <li className="font-semibold text-orange-600">
                  Статус распределения дохода изменится на "Не исполнено"
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>

        <div className="mt-4 p-4 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Детали транзакции:</div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Актив:</span>
              <span className="font-medium">{transaction.assetName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Сумма:</span>
              <span className="font-medium">{formatCurrency(transaction.amount)} {transaction.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Дата:</span>
              <span className="font-medium">{formatDate(transaction.date)}</span>
            </div>
          </div>
        </div>
      </DialogBody>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Да, отменить транзакцию
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
```

---

## Фильтрация транзакций по типу

```typescript
// components/FundTransactionsFilters.tsx

const [filter, setFilter] = useState<'all' | 'income_dist' | 'manual' | 'other'>('all');

const filteredTransactions = transactions.filter(tx => {
  if (filter === 'income_dist') {
    return tx.transactionType === 'deposit' && tx.contributionIncomeId != null;
  }
  if (filter === 'manual') {
    return tx.transactionType === 'deposit' && tx.contributionId != null && tx.contributionIncomeId == null;
  }
  if (filter === 'other') {
    return tx.transactionType !== 'deposit';
  }
  return true;
});

return (
  <>
    <FilterButtons>
      <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
        Все транзакции
      </FilterButton>
      <FilterButton active={filter === 'income_dist'} onClick={() => setFilter('income_dist')}>
        Распределения доходов
      </FilterButton>
      <FilterButton active={filter === 'manual'} onClick={() => setFilter('manual')}>
        Ручные пополнения
      </FilterButton>
      <FilterButton active={filter === 'other'} onClick={() => setFilter('other')}>
        Покупки/Продажи/Переводы
      </FilterButton>
    </FilterButtons>

    <TransactionsList transactions={filteredTransactions} />
  </>
);
```

---

## Чеклист изменений

### Типы и интерфейсы
- [ ] Добавить `contributionId` в тип `FundAssetTransaction`
- [ ] Добавить `contributionIncomeId` в тип `FundAssetTransaction`
- [ ] Добавить `contributionId` в тип `FundDeposit`
- [ ] Добавить `contributionIncomeId` в тип `FundDeposit`

### API методы
- [ ] Обновить `fundsApi.deleteContribution` (уже есть, ничего менять не нужно)
- [ ] Обновить `fundDepositsApi.delete` (уже есть, ничего менять не нужно)
- [ ] Убедиться, что `incomesApi.cancelDistribution` существует

### UI компоненты
- [ ] Обновить отображение транзакций фонда с учётом `contributionIncomeId`
- [ ] Добавить бейдж "Распределение дохода" для транзакций с `contributionIncomeId`
- [ ] Обновить отображение fund_deposits с учётом `contributionIncomeId`
- [ ] Добавить кнопки удаления с правильными endpoint'ами
- [ ] Реализовать диалог подтверждения с деталями отката
- [ ] Добавить фильтры по типу транзакций

### Обработчики и логика
- [ ] Реализовать `handleDeleteByContribution` для истории фонда
- [ ] Реализовать `handleCancelDeposit` для истории счёта
- [ ] Реализовать `handleCancelDistribution` для страницы распределений
- [ ] Добавить инвалидацию `income-distributions` во всех трёх обработчиках
- [ ] Обработать ошибки с понятными сообщениями

### Уведомления и UX
- [ ] Показывать разные сообщения для распределений дохода и ручных пополнений
- [ ] Добавить предупреждение об отмене статуса распределения
- [ ] Обновить тосты с информацией о возврате денег

### Тестирование
- [ ] Протестировать отмену через страницу истории фонда
- [ ] Протестировать отмену через страницу истории счёта
- [ ] Протестировать отмену через страницу распределений дохода
- [ ] Проверить, что статус распределения обновляется во всех случаях
- [ ] Проверить, что баланс счёта и активы фонда корректно обновляются
- [ ] Протестировать фильтрацию транзакций

---

## Важные замечания

1. **Инвалидация кэша**: При удалении транзакции **обязательно** инвалидируйте запрос `income-distributions`, иначе статус не обновится на UI.

2. **Универсальность**: Все три endpoint'а выполняют одинаковый откат. Выбор зависит только от контекста:
   - Если пользователь на странице фонда → используйте `DELETE /funds/{id}/contributions/{contributionId}`
   - Если на странице счёта → используйте `DELETE /fund-deposits/{id}`
   - Если на странице распределений → используйте `POST /incomes/{id}/distributions/{fundId}/cancel`

3. **Типобезопасность**: TypeScript должен помогать определить тип транзакции через `contributionIncomeId`.

4. **UX**: Показывайте пользователю разные сообщения и предупреждения в зависимости от того, отменяется ли распределение дохода или обычная транзакция.
