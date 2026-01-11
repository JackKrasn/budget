# Депозиты: Описание для фронтенда

## Обзор

Депозиты — это банковские вклады с автоматическим начислением процентов. Депозит привязывается к фонду и отображается как актив типа "deposit".

---

## API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/deposits` | Список депозитов |
| POST | `/api/v1/deposits` | Создать депозит |
| GET | `/api/v1/deposits/summary` | Общая статистика |
| GET | `/api/v1/deposits/maturing?days=30` | Депозиты с истекающим сроком |
| GET | `/api/v1/deposits/:id` | Детали депозита |
| PATCH | `/api/v1/deposits/:id` | Обновить депозит |
| DELETE | `/api/v1/deposits/:id` | Удалить депозит |
| GET | `/api/v1/deposits/:id/accruals` | История начислений |
| POST | `/api/v1/deposits/:id/close-early` | Досрочное закрытие |
| POST | `/api/v1/deposits/process-accruals` | Начислить проценты |

---

## Типы данных

### Deposit (ответ API)

```typescript
interface Deposit {
  id: string;                    // UUID
  assetId: string;               // UUID связанного актива
  assetName: string;             // Название депозита
  currency: string;              // Валюта (RUB, USD, EUR)
  principalAmount: number;       // Начальная сумма вклада
  currentAmount: number;         // Текущая сумма (с учетом капитализации)
  interestRate: number;          // Годовая ставка (0.085 = 8.5%)
  termMonths: number;            // Срок в месяцах
  accrualPeriod: AccrualPeriod;  // Период начисления
  hasCapitalization: boolean;    // Капитализация процентов
  startDate: string;             // Дата открытия (ISO 8601)
  maturityDate: string;          // Дата погашения (ISO 8601)
  nextAccrualDate?: string;      // Следующая дата начисления
  status: DepositStatus;         // Статус депозита
  fundId?: string;               // UUID фонда
  fundName?: string;             // Название фонда
  totalInterest: number;         // Накопленные проценты
  projectedYield: number;        // Прогнозируемая доходность
  daysRemaining: number;         // Дней до погашения
  notes?: string;                // Заметки
  createdAt: string;             // Дата создания
}

type AccrualPeriod = 'monthly' | 'quarterly' | 'annually' | 'at_maturity';

type DepositStatus = 'active' | 'matured' | 'closed_early';
```

### CreateDepositRequest (запрос на создание)

```typescript
interface CreateDepositRequest {
  name: string;              // Название депозита
  fundId: string;            // UUID фонда
  currency: string;          // Валюта
  principalAmount: number;   // Сумма вклада
  interestRate: number;      // Ставка в процентах (8.5, не 0.085)
  termMonths: number;        // Срок в месяцах
  accrualPeriod: AccrualPeriod;
  hasCapitalization: boolean;
  startDate: string;         // YYYY-MM-DD
  notes?: string;
}
```

### Accrual (начисление)

```typescript
interface Accrual {
  id: string;
  depositId: string;
  accrualDate: string;       // Дата начисления
  periodStart: string;       // Начало периода
  periodEnd: string;         // Конец периода
  principalAtStart: number;  // Сумма на начало периода
  interestAccrued: number;   // Начисленные проценты
  principalAtEnd: number;    // Сумма на конец периода
  accrualType: 'regular' | 'early_closure' | 'maturity';
  isCapitalized: boolean;
  notes?: string;
  createdAt: string;
}
```

### Summary (статистика)

```typescript
interface DepositsSummary {
  totalDeposits: number;        // Количество активных депозитов
  totalPrincipal: number;       // Общая начальная сумма
  totalCurrentValue: number;    // Текущая стоимость
  totalInterestEarned: number;  // Всего заработано процентов
}
```

---

## UI Компоненты

### 1. Список депозитов

**Страница:** `/deposits`

**Функционал:**
- Таблица/карточки депозитов
- Фильтр по статусу (active, matured, closed_early)
- Фильтр по фонду
- Сортировка по дате погашения, сумме, ставке

**Отображаемые поля:**
- Название (`assetName`)
- Сумма (`currentAmount` / `principalAmount`)
- Ставка (`interestRate * 100`%)
- Срок до погашения (`daysRemaining` дней)
- Статус (badge)
- Фонд (`fundName`)

**Пример карточки:**
```
┌─────────────────────────────────────────────┐
│ Альфа Депозит 8.5%                   active │
│                                             │
│ 100 000 ₽ → 102 150 ₽                       │
│ Ставка: 8.5% годовых                        │
│ Период: ежемесячно, с капитализацией        │
│                                             │
│ Погашение: 01.01.2027 (355 дней)            │
│ Следующее начисление: 01.02.2026            │
│ Фонд: Резервный фонд                        │
│                                             │
│ Заработано: 2 150 ₽                         │
│ Прогноз: +8 841 ₽                           │
└─────────────────────────────────────────────┘
```

### 2. Форма создания депозита

**Модальное окно или страница:** `/deposits/new`

**Поля формы:**

| Поле | Тип | Валидация | Описание |
|------|-----|-----------|----------|
| name | text | required, min 3 | Название депозита |
| fundId | select | required | Выбор фонда |
| currency | select | required | RUB, USD, EUR |
| principalAmount | number | required, > 0 | Сумма вклада |
| interestRate | number | required, > 0, <= 100 | Ставка (%) |
| termMonths | number | required, > 0 | Срок (месяцы) |
| accrualPeriod | select | required | Период начисления |
| hasCapitalization | checkbox | — | Капитализация |
| startDate | date | required | Дата открытия |
| notes | textarea | — | Заметки |

**Опции для accrualPeriod:**
```typescript
const accrualPeriodOptions = [
  { value: 'monthly', label: 'Ежемесячно' },
  { value: 'quarterly', label: 'Ежеквартально' },
  { value: 'annually', label: 'Ежегодно' },
  { value: 'at_maturity', label: 'В конце срока' },
];
```

**Предпросмотр расчета:**
При изменении полей показывать:
- Дата погашения (startDate + termMonths)
- Прогнозируемый доход (projectedYield)
- Первая дата начисления

### 3. Детальная страница депозита

**Страница:** `/deposits/:id`

**Секции:**

#### 3.1 Основная информация
- Название, статус
- Сумма: начальная → текущая
- Ставка, срок, период начисления
- Даты: открытия, погашения, следующего начисления
- Фонд

#### 3.2 Прогресс
```
Прогресс срока: ━━━━━━━━━━░░░░░░░░░░ 45%
                10 из 22 месяцев

Доходность:     ━━━━━━━━░░░░░░░░░░░░ 24%
                2 150 ₽ из 8 841 ₽
```

#### 3.3 История начислений
Таблица с записями из `/deposits/:id/accruals`:

| Дата | Период | Сумма до | Проценты | Сумма после | Тип |
|------|--------|----------|----------|-------------|-----|
| 01.02.2026 | 01.01 - 01.02 | 100 000 | +708.33 | 100 708.33 | regular |
| 01.03.2026 | 01.02 - 01.03 | 100 708.33 | +713.35 | 101 421.68 | regular |

#### 3.4 Действия
- **Редактировать** — изменить заметки
- **Закрыть досрочно** — POST `/deposits/:id/close-early`
- **Удалить** — DELETE `/deposits/:id`

### 4. Виджет статистики

**Для dashboard или страницы списка:**

```
┌─────────────────────────────────────────────┐
│              ДЕПОЗИТЫ                       │
├─────────────────────────────────────────────┤
│ Активных депозитов:  3                      │
│ Общая сумма:         500 000 ₽              │
│ Текущая стоимость:   512 450 ₽              │
│ Заработано:          +12 450 ₽              │
└─────────────────────────────────────────────┘
```

### 5. Уведомления о погашении

**Получить:** GET `/deposits/maturing?days=30`

Показывать в header/sidebar/dashboard:
```
⚠️ Депозит "Альфа 8.5%" погашается через 5 дней
```

---

## Логика отображения

### Форматирование ставки

```typescript
// API возвращает 0.085, отображаем 8.5%
const formatRate = (rate: number) => `${(rate * 100).toFixed(2)}%`;
```

### Статусы и цвета

```typescript
const statusConfig = {
  active: { label: 'Активен', color: 'green' },
  matured: { label: 'Погашен', color: 'blue' },
  closed_early: { label: 'Закрыт досрочно', color: 'orange' },
};
```

### Периоды начисления

```typescript
const periodLabels = {
  monthly: 'Ежемесячно',
  quarterly: 'Ежеквартально',
  annually: 'Ежегодно',
  at_maturity: 'В конце срока',
};
```

### Расчет прогресса

```typescript
const calculateProgress = (deposit: Deposit) => {
  const start = new Date(deposit.startDate).getTime();
  const end = new Date(deposit.maturityDate).getTime();
  const now = Date.now();

  const totalDays = (end - start) / (1000 * 60 * 60 * 24);
  const passedDays = (now - start) / (1000 * 60 * 60 * 24);

  return Math.min(100, Math.max(0, (passedDays / totalDays) * 100));
};
```

---

## Примеры запросов

### Создание депозита

```typescript
const createDeposit = async (data: CreateDepositRequest) => {
  const response = await fetch('/api/v1/deposits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Пример
await createDeposit({
  name: 'Альфа Депозит 8.5%',
  fundId: 'uuid-фонда',
  currency: 'RUB',
  principalAmount: 100000,
  interestRate: 8.5,  // В процентах!
  termMonths: 12,
  accrualPeriod: 'monthly',
  hasCapitalization: true,
  startDate: '2026-01-01',
  notes: 'Альфа-банк',
});
```

### Получение списка

```typescript
const getDeposits = async (status?: string, fundId?: string) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (fundId) params.append('fundId', fundId);

  const response = await fetch(`/api/v1/deposits?${params}`);
  return response.json();
};
```

### Досрочное закрытие

```typescript
const closeEarly = async (depositId: string) => {
  const confirmed = await confirm(
    'Вы уверены? Депозит будет закрыт с текущими начислениями.'
  );
  if (!confirmed) return;

  const response = await fetch(`/api/v1/deposits/${depositId}/close-early`, {
    method: 'POST',
  });
  return response.json();
};
```

---

## Валидация формы

```typescript
const depositSchema = z.object({
  name: z.string().min(3, 'Минимум 3 символа'),
  fundId: z.string().uuid('Выберите фонд'),
  currency: z.enum(['RUB', 'USD', 'EUR']),
  principalAmount: z.number().positive('Сумма должна быть положительной'),
  interestRate: z.number()
    .positive('Ставка должна быть положительной')
    .max(100, 'Ставка не может превышать 100%'),
  termMonths: z.number()
    .int('Должно быть целым числом')
    .positive('Срок должен быть положительным'),
  accrualPeriod: z.enum(['monthly', 'quarterly', 'annually', 'at_maturity']),
  hasCapitalization: z.boolean(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат: YYYY-MM-DD'),
  notes: z.string().optional(),
});
```

---

## Интеграция с фондами

Депозит отображается в фонде как актив:
- В списке активов фонда (`/funds/:id`) депозит показывается с типом "deposit"
- `currentAmount` = `fund_assets.amount` для этого актива
- При капитализации сумма автоматически увеличивается

---

## Мобильная версия

**Адаптация карточки:**
```
┌─────────────────────────┐
│ Альфа Депозит    active │
│ 100 000 → 102 150 ₽     │
│ 8.5% • ежемесячно       │
│ до 01.01.2027 (355 дн)  │
└─────────────────────────┘
```

**Навигация:**
- Список → свайп для действий (редактировать, удалить)
- Детали → tabs (Информация | История)
