# Отмена подтверждённого распределения дохода

## Что изменилось на бэкенде

Добавлен новый endpoint для отмены подтверждённых распределений доходов:

**`POST /incomes/{id}/distributions/{fundId}/cancel`**

### Что делает отмена

При вызове endpoint'а выполняется полный откат всех операций подтверждения:

1. ✅ **Сбрасывается статус распределения** (`is_completed = false`, `completed_at = null`)
2. ✅ **Уменьшаются активы фонда** (отменяется увеличение)
3. ✅ **Деньги возвращаются на счёт** (отменяется списание)
4. ✅ **Удаляются записи fund_deposit** (история переводов для счёта)
5. ✅ **Удаляются записи fund_asset_transaction** (история транзакций фонда)
6. ✅ **Удаляются fund_contribution_allocations** (детали вкладов)
7. ✅ **Удаляется fund_contribution** (сам вклад)

**ВАЖНО:** Все операции выполняются атомарно в единой транзакции. Либо откатываются все изменения, либо ни одно.

---

## API

### Endpoint

```
POST /incomes/{incomeId}/distributions/{fundId}/cancel
```

### Параметры

- `incomeId` (path, UUID) - ID дохода
- `fundId` (path, UUID) - ID фонда

### Ответ

**Success (200 OK):**
```json
{
  "id": "uuid",
  "income_id": "uuid",
  "fund_id": "uuid",
  "planned_amount": 1000,
  "actual_amount": 1000,
  "is_completed": false,
  "completed_at": null,
  "created_at": "2026-01-17T10:00:00Z"
}
```

### Ошибки

**400 Bad Request** - Распределение ещё не подтверждено:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Distribution is not confirmed yet"
  }
}
```

**400 Bad Request** - Доход не привязан к счёту:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Income has no associated account"
  }
}
```

**404 Not Found** - Распределение не найдено:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Income distribution not found"
  }
}
```

---

## Что нужно изменить на фронте

### 1. API клиент

Добавьте метод в API клиент:

```typescript
// api/incomes.ts
export const incomesApi = {
  // ... существующие методы

  // Отменить подтверждённое распределение
  cancelDistribution: (incomeId: string, fundId: string) =>
    api.post(`/incomes/${incomeId}/distributions/${fundId}/cancel`)
};
```

---

### 2. UI для отмены распределения

#### Кнопка "Отменить распределение"

В карточке подтверждённого распределения добавьте кнопку отмены:

```tsx
interface DistributionCardProps {
  distribution: IncomeDistribution;
  income: Income;
  fund: Fund;
  onCancel: () => void;
}

function DistributionCard({ distribution, income, fund, onCancel }: DistributionCardProps) {
  if (!distribution.isCompleted) {
    return <PendingDistributionCard distribution={distribution} />;
  }

  return (
    <Card>
      <CardHeader>
        <StatusBadge variant="success">
          <Icon name="check-circle" />
          Подтверждено {formatDate(distribution.completedAt)}
        </StatusBadge>
      </CardHeader>

      <CardContent>
        <InfoRow>
          <Label>Фонд:</Label>
          <Value>
            <FundIcon icon={fund.icon} color={fund.color} />
            {fund.name}
          </Value>
        </InfoRow>

        <InfoRow>
          <Label>Сумма:</Label>
          <Value>{formatCurrency(distribution.actualAmount)}</Value>
        </InfoRow>

        <InfoRow>
          <Label>Счёт:</Label>
          <Value>{income.accountName}</Value>
        </InfoRow>

        <Note>
          ✅ Средства переведены в фонд
        </Note>
      </CardContent>

      <CardActions>
        <Button
          variant="ghost"
          size="sm"
          icon="x-circle"
          onClick={onCancel}
        >
          Отменить распределение
        </Button>
      </CardActions>
    </Card>
  );
}
```

---

### 3. Обработчик отмены

```typescript
const useCancelDistribution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ incomeId, fundId }: { incomeId: string; fundId: string }) =>
      incomesApi.cancelDistribution(incomeId, fundId),

    onSuccess: (_, { incomeId, fundId }) => {
      // Инвалидировать все связанные запросы
      queryClient.invalidateQueries(['income', incomeId]);
      queryClient.invalidateQueries(['income-distributions', incomeId]);
      queryClient.invalidateQueries(['account', income.accountId]);
      queryClient.invalidateQueries(['account-transactions', income.accountId]);
      queryClient.invalidateQueries(['fund', fundId]);
      queryClient.invalidateQueries(['fund-transactions', fundId]);
      queryClient.invalidateQueries(['fund-contributions', fundId]);
      queryClient.invalidateQueries(['fund-deposits']);
    }
  });
};

// В компоненте
const cancelMutation = useCancelDistribution();

const handleCancelDistribution = async (
  incomeId: string,
  fundId: string,
  distributionAmount: number,
  fundName: string,
  accountName: string
) => {
  // 1. Показать диалог подтверждения
  const confirmed = await showConfirmDialog({
    title: 'Отменить распределение?',
    message: (
      <>
        <p>
          Будет выполнен откат подтверждённого распределения дохода в фонд "{fundName}".
        </p>
        <Warning>
          <strong>Последствия отмены:</strong>
          <ul>
            <li>✅ Деньги вернутся на счёт "{accountName}"</li>
            <li>✅ Активы фонда "{fundName}" уменьшатся на {formatCurrency(distributionAmount)}</li>
            <li>✅ Распределение вернётся в статус "Не подтверждено"</li>
            <li>✅ Удалятся все связанные транзакции</li>
          </ul>
        </Warning>
        <p>
          Это действие безопасно откатывает все изменения.
          <br />
          Вы сможете заново подтвердить распределение позже.
        </p>
      </>
    ),
    confirmText: 'Отменить распределение',
    cancelText: 'Оставить как есть',
    variant: 'warning'
  });

  if (!confirmed) return;

  // 2. Выполнить отмену
  try {
    await cancelMutation.mutateAsync({ incomeId, fundId });

    // 3. Показать уведомление об успехе
    showNotification({
      type: 'success',
      title: 'Распределение отменено',
      message: `Деньги возвращены на счёт "${accountName}". Распределение можно подтвердить заново.`,
      actions: [
        {
          label: 'Посмотреть историю счёта',
          onClick: () => navigate(`/accounts/${income.accountId}/transactions`)
        }
      ]
    });

  } catch (error) {
    // 4. Обработать ошибки
    if (error.response?.data?.error?.code === 'VALIDATION_ERROR') {
      const message = error.response.data.error.message;

      if (message.includes('not confirmed')) {
        showNotification({
          type: 'error',
          message: 'Распределение ещё не было подтверждено'
        });
      } else if (message.includes('no associated account')) {
        showNotification({
          type: 'error',
          message: 'Невозможно отменить: доход не привязан к счёту'
        });
      } else {
        showNotification({
          type: 'error',
          message: 'Не удалось отменить распределение'
        });
      }
    } else {
      showNotification({
        type: 'error',
        message: 'Произошла ошибка при отмене распределения'
      });
    }
  }
};
```

---

### 4. Диалог подтверждения с деталями

Детальный диалог с полной информацией:

```tsx
interface CancelDistributionDialogProps {
  distribution: IncomeDistribution;
  income: Income;
  fund: Fund;
  allocations: FundContributionAllocation[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

function CancelDistributionDialog({
  distribution,
  income,
  fund,
  allocations,
  onConfirm,
  onCancel
}: CancelDistributionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTitle>
        <Icon name="alert-triangle" color="warning" />
        Отменить распределение дохода?
      </DialogTitle>

      <DialogContent>
        <Section>
          <SectionTitle>Детали распределения</SectionTitle>

          <InfoGrid>
            <InfoRow>
              <Label>Доход:</Label>
              <Value>{income.source} • {formatDate(income.date)}</Value>
            </InfoRow>

            <InfoRow>
              <Label>Фонд:</Label>
              <Value>
                <FundIcon icon={fund.icon} color={fund.color} />
                {fund.name}
              </Value>
            </InfoRow>

            <InfoRow>
              <Label>Счёт:</Label>
              <Value>{income.accountName}</Value>
            </InfoRow>

            <InfoRow>
              <Label>Сумма:</Label>
              <Value>{formatCurrency(distribution.actualAmount)}</Value>
            </InfoRow>

            <InfoRow>
              <Label>Подтверждено:</Label>
              <Value>{formatDateTime(distribution.completedAt)}</Value>
            </InfoRow>
          </InfoGrid>
        </Section>

        <Section>
          <SectionTitle>Активы, которые будут откачены</SectionTitle>

          <AllocationsList>
            {allocations.map(alloc => (
              <AllocationItem key={alloc.id}>
                <AssetIcon>{alloc.assetName}</AssetIcon>
                <Amount>{formatCurrency(alloc.amount)} {alloc.currency}</Amount>
              </AllocationItem>
            ))}
          </AllocationsList>
        </Section>

        <Warning>
          <WarningTitle>
            <Icon name="info" />
            Что произойдёт при отмене:
          </WarningTitle>

          <WarningList>
            <WarningItem variant="success">
              <Icon name="arrow-up" />
              Деньги вернутся на счёт "{income.accountName}"
            </WarningItem>

            <WarningItem variant="info">
              <Icon name="arrow-down" />
              Активы фонда "{fund.name}" уменьшатся
            </WarningItem>

            <WarningItem variant="neutral">
              <Icon name="refresh-cw" />
              Распределение вернётся в статус "Не подтверждено"
            </WarningItem>

            <WarningItem variant="neutral">
              <Icon name="trash-2" />
              Удалятся записи из истории транзакций
            </WarningItem>
          </WarningList>

          <Note>
            Все операции выполняются атомарно. Вы сможете заново подтвердить
            распределение в любой момент.
          </Note>
        </Warning>
      </DialogContent>

      <DialogActions>
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Оставить как есть
        </Button>

        <Button
          variant="warning"
          onClick={handleConfirm}
          loading={isLoading}
          icon="x-circle"
        >
          Отменить распределение
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

### 5. Индикация в списке распределений

После отмены распределение должно отображаться как неподтверждённое:

```tsx
{distributions.map(dist => (
  <DistributionRow key={dist.id}>
    <FundInfo>
      <FundIcon icon={dist.fundIcon} color={dist.fundColor} />
      <FundName>{dist.fundName}</FundName>
    </FundInfo>

    <DistributionAmount>
      {dist.isCompleted ? (
        <CompletedAmount>
          <StatusIcon name="check-circle" color="success" />
          {formatCurrency(dist.actualAmount)}
          <Timestamp>
            {formatRelativeTime(dist.completedAt)}
          </Timestamp>
        </CompletedAmount>
      ) : (
        <PendingAmount>
          <StatusIcon name="clock" color="warning" />
          {formatCurrency(dist.plannedAmount)}
          <Label>Ожидает подтверждения</Label>
        </PendingAmount>
      )}
    </DistributionAmount>

    <Actions>
      {dist.isCompleted ? (
        <Tooltip content="Отменить распределение">
          <IconButton
            icon="x-circle"
            size="sm"
            variant="ghost"
            onClick={() => handleCancel(dist)}
          />
        </Tooltip>
      ) : (
        <Button
          size="sm"
          onClick={() => handleConfirm(dist)}
        >
          Подтвердить
        </Button>
      )}
    </Actions>
  </DistributionRow>
))}
```

---

### 6. Обновление состояния после отмены

```typescript
const handleCancelComplete = async () => {
  // 1. Обновить баланс счёта (он увеличился!)
  const newBalance = await fetchAccountBalance(accountId);
  setAccountBalance(newBalance);

  // 2. Обновить историю транзакций счёта (fund_deposit удалён)
  const accountTransactions = await fetchAccountTransactions(accountId);
  setAccountTransactions(accountTransactions);

  // 3. Обновить историю транзакций фонда (fund_asset_transaction удалён)
  const fundTransactions = await fetchFundTransactions(fundId);
  setFundTransactions(fundTransactions);

  // 4. Обновить статус распределения
  const distributions = await fetchDistributions(incomeId);
  setDistributions(distributions);

  // 5. Обновить баланс фонда
  const fundBalance = await fetchFundBalance(fundId);
  setFundBalance(fundBalance);
};
```

---

### 7. Ограничения на отмену (опционально)

Можно добавить ограничения, например разрешить отмену только недавних распределений:

```typescript
function canCancelDistribution(distribution: IncomeDistribution): boolean {
  if (!distribution.isCompleted) {
    return false; // Не подтверждено
  }

  const completedDate = new Date(distribution.completedAt);
  const daysSince = Math.floor((Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24));

  return daysSince <= 30; // Можно отменить только за последние 30 дней
}

// В UI
{distribution.isCompleted && canCancelDistribution(distribution) && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleCancel(distribution)}
  >
    Отменить распределение
  </Button>
)}

{distribution.isCompleted && !canCancelDistribution(distribution) && (
  <Tooltip content="Прошло более 30 дней с подтверждения">
    <Button variant="ghost" size="sm" disabled>
      Отменить распределение
    </Button>
  </Tooltip>
)}
```

---

## Чеклист изменений

- [ ] Добавить метод `cancelDistribution` в API клиент
- [ ] Реализовать обработчик отмены с подтверждением
- [ ] Создать диалог подтверждения отмены с деталями
- [ ] Добавить кнопку "Отменить" для подтверждённых распределений
- [ ] Обновить индикацию статуса распределения после отмены
- [ ] Обновить баланс счёта после отмены (он увеличивается)
- [ ] Обновить историю транзакций счёта (fund_deposit удаляется)
- [ ] Обновить историю транзакций фонда (fund_asset_transaction удаляется)
- [ ] Обновить баланс фонда после отмены (активы уменьшаются)
- [ ] Добавить обработку ошибок валидации
- [ ] Добавить уведомления об успешной отмене
- [ ] (Опционально) Добавить ограничения по времени на отмену
- [ ] Протестировать: отменить распределение и проверить восстановление баланса
- [ ] Протестировать: проверить удаление транзакций из истории
- [ ] Протестировать: попробовать отменить неподтверждённое распределение (должна быть ошибка)

---

## Пример полного flow

```typescript
// 1. Пользователь нажимает "Отменить распределение"
const handleCancelClick = async (distribution: IncomeDistribution) => {
  // 2. Загружаем дополнительные данные для диалога
  const allocations = await fetchContributionAllocations(distribution.contributionId);
  const income = await fetchIncome(distribution.incomeId);
  const fund = await fetchFund(distribution.fundId);

  // 3. Показываем диалог подтверждения
  const confirmed = await showCancelDialog({
    distribution,
    income,
    fund,
    allocations
  });

  if (!confirmed) return;

  // 4. Выполняем отмену
  try {
    await incomesApi.cancelDistribution(distribution.incomeId, distribution.fundId);

    // 5. Обновляем все связанные данные
    await Promise.all([
      queryClient.invalidateQueries(['income', distribution.incomeId]),
      queryClient.invalidateQueries(['income-distributions', distribution.incomeId]),
      queryClient.invalidateQueries(['account', income.accountId]),
      queryClient.invalidateQueries(['account-transactions', income.accountId]),
      queryClient.invalidateQueries(['fund', distribution.fundId]),
      queryClient.invalidateQueries(['fund-transactions', distribution.fundId]),
      queryClient.invalidateQueries(['fund-contributions', distribution.fundId])
    ]);

    // 6. Показываем уведомление
    showNotification({
      type: 'success',
      title: 'Распределение отменено',
      message: `Деньги возвращены на счёт. Баланс счёта увеличился на ${formatCurrency(distribution.actualAmount)}`
    });

  } catch (error) {
    handleCancelError(error);
  }
};
```

---

## Связь с другими документами

- **FRONTEND_CHANGES_INCOME_DISTRIBUTION.md** - описывает подтверждение распределения
- **Этот файл** - описывает отмену подтверждённого распределения
- **FRONTEND_CHANGES.md** - общая работа с fund_deposits

---

**Вопросы?** Обращайтесь к бэкенд-разработчику для уточнения деталей API.
