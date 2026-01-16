# Операции с активами фондов — Спецификация для фронтенда

## Обзор

Добавлены новые API endpoints для работы с активами внутри фондов:
- Покупка активов за валюту фонда
- Пополнение фонда с банковского счёта
- Перевод активов между фондами
- История всех операций

---

## API Endpoints

### 1. Покупка актива за валюту фонда

**Endpoint:** `POST /api/v1/funds/{fundId}/buy-asset`

Списывает валюту из фонда и зачисляет купленный актив.

**Request Body:**
```typescript
interface BuyAssetRequest {
  assetId: string;         // UUID актива для покупки
  amount: number;          // количество единиц
  pricePerUnit: number;    // цена за единицу
  currencyAssetId: string; // UUID валютного актива для списания
  date?: string;           // дата в формате YYYY-MM-DD
  note?: string;           // комментарий
}
```

**Response:**
```typescript
interface BuyAssetResponse {
  success: boolean;
  assetId: string;
  amount: number;
  pricePerUnit: number;
  totalCost: number;
  currencyAssetId: string;
}
```

**Пример:**
```bash
POST /api/v1/funds/65a86db4-3125-408d-8d45-c6b868ee1353/buy-asset
{
  "assetId": "67a4d6d3-b636-4c27-bdfc-a8bcdc682c8f",
  "amount": 100,
  "pricePerUnit": 1.82,
  "currencyAssetId": "43d02dc8-f5ff-4a3e-a37c-2c360e53a62f",
  "date": "2026-01-15"
}
```

**Ошибки:**
- `400` — недостаточно средств на валютном активе
- `400` — неверный формат данных
- `404` — фонд или актив не найден

---

### 2. Пополнение валюты фонда с банковского счёта

**Endpoint:** `POST /api/v1/funds/{fundId}/deposit`

Списывает средства с банковского счёта и зачисляет на валютный актив фонда.

**Request Body:**
```typescript
interface DepositToFundRequest {
  accountId: string;  // UUID банковского счёта
  assetId: string;    // UUID валютного актива фонда
  amount: number;     // сумма
  date?: string;      // дата в формате YYYY-MM-DD
  note?: string;      // комментарий
}
```

**Response:**
```typescript
interface DepositToFundResponse {
  success: boolean;
  accountId: string;
  accountName: string;
  assetId: string;
  amount: number;
}
```

**Пример:**
```bash
POST /api/v1/funds/65a86db4-3125-408d-8d45-c6b868ee1353/deposit
{
  "accountId": "3f23e4b2-018a-43f9-9eaa-b25973e1880a",
  "assetId": "43d02dc8-f5ff-4a3e-a37c-2c360e53a62f",
  "amount": 50000,
  "date": "2026-01-15"
}
```

**Ошибки:**
- `400` — недостаточно средств на счёте
- `404` — счёт или фонд не найден

---

### 3. Перевод актива между фондами

**Endpoint:** `POST /api/v1/funds/{fundId}/transfer-asset`

Переводит часть актива из одного фонда в другой (1:1, без комиссий).

**Request Body:**
```typescript
interface TransferAssetRequest {
  toFundId: string;  // UUID целевого фонда
  assetId: string;   // UUID актива для перевода
  amount: number;    // количество единиц
  date?: string;     // дата в формате YYYY-MM-DD
  note?: string;     // комментарий
}
```

**Response:**
```typescript
interface TransferAssetResponse {
  success: boolean;
  fromFundId: string;
  toFundId: string;
  toFundName: string;
  assetId: string;
  amount: number;
}
```

**Пример:**
```bash
POST /api/v1/funds/65a86db4-3125-408d-8d45-c6b868ee1353/transfer-asset
{
  "toFundId": "b1648dd9-988f-4427-aad7-c07687a781a2",
  "assetId": "67a4d6d3-b636-4c27-bdfc-a8bcdc682c8f",
  "amount": 50,
  "date": "2026-01-15"
}
```

**Ошибки:**
- `400` — недостаточно актива для перевода
- `400` — нельзя переводить в тот же фонд
- `404` — фонд или актив не найден

---

### 4. История операций фонда

**Endpoint:** `GET /api/v1/funds/{fundId}/transactions`

Возвращает историю всех операций с активами фонда.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `type` | string | Фильтр по типу: `buy`, `sell`, `transfer_in`, `transfer_out`, `deposit` |
| `from` | string | Дата начала (YYYY-MM-DD) |
| `to` | string | Дата окончания (YYYY-MM-DD) |

**Response:**
```typescript
interface TransactionListResponse {
  data: Transaction[];
  total: number;
}

interface Transaction {
  id: string;
  fund_id: string;
  transaction_type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'deposit';
  asset_id: string;
  amount: number;
  price_per_unit: NullableFloat;
  total_value: NullableFloat;
  currency: string | null;
  counterpart_fund_id: string | null;
  counterpart_asset_id: string | null;
  source_account_id: string | null;
  note: string | null;
  date: string;
  created_at: string;

  // Joined fields
  asset_name: string;
  asset_ticker: string | null;
  asset_type: string;
  counterpart_fund_name: string | null;
  counterpart_asset_name: string | null;
  source_account_name: string | null;
}

interface NullableFloat {
  Float64: number;
  Valid: boolean;
}
```

**Пример:**
```bash
GET /api/v1/funds/65a86db4-3125-408d-8d45-c6b868ee1353/transactions?type=buy&from=2026-01-01
```

---

## Существующие endpoints (справочно)

### Получить валютные активы фонда
```
GET /api/v1/funds/{fundId}/assets/currency
```
Используйте для выпадающего списка "из какой валюты списать".

### Получить все активы фонда
```
GET /api/v1/funds/{fundId}/assets
```
Используйте для выпадающего списка "какой актив перевести".

### Получить список фондов
```
GET /api/v1/funds
```
Используйте для выпадающего списка "в какой фонд перевести".

### Получить список счетов
```
GET /api/v1/accounts
```
Используйте для выпадающего списка "с какого счёта пополнить".

---

## UI Компоненты

### 1. Модальное окно "Купить актив"

**Когда открывать:** Кнопка "Купить" в карточке фонда

**Поля формы:**

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| Актив | Select | Да | Выбор из списка всех активов (`/assets`) |
| Количество | Number | Да | Положительное число |
| Цена за единицу | Number | Да | Положительное число |
| Валюта списания | Select | Да | Выбор из `/funds/{id}/assets/currency` |
| Дата | DatePicker | Нет | По умолчанию сегодня |
| Комментарий | Textarea | Нет | — |

**Вычисляемые поля:**
- Итого = Количество × Цена (отображать под формой)

**Валидация:**
- Итого не должно превышать баланс выбранной валюты
- Количество и цена > 0

**Wireframe:**
```
┌─────────────────────────────────────────┐
│ Купить актив                        [X] │
├─────────────────────────────────────────┤
│ Актив *                                 │
│ [▼ Выберите актив________________]      │
│                                         │
│ Количество *        Цена за единицу *   │
│ [100_______]        [1.82__________]    │
│                                         │
│ Списать из валюты *                     │
│ [▼ RUB (80 388.15 доступно)_____]       │
│                                         │
│ Дата                                    │
│ [📅 15.01.2026____]                     │
│                                         │
│ Комментарий                             │
│ [_________________________________]     │
│                                         │
│ ─────────────────────────────────────── │
│ Итого: 182.00 RUB                       │
│                                         │
│              [Отмена]  [Купить]         │
└─────────────────────────────────────────┘
```

---

### 2. Модальное окно "Пополнить фонд"

**Когда открывать:** Кнопка "Пополнить" в карточке фонда

**Поля формы:**

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| Банковский счёт | Select | Да | Выбор из `/accounts` |
| Валютный актив | Select | Да | Выбор из `/funds/{id}/assets/currency` |
| Сумма | Number | Да | Положительное число |
| Дата | DatePicker | Нет | По умолчанию сегодня |
| Комментарий | Textarea | Нет | — |

**Валидация:**
- Сумма не должна превышать баланс счёта
- Рекомендуется проверять совпадение валют счёта и актива

**Wireframe:**
```
┌─────────────────────────────────────────┐
│ Пополнить фонд                      [X] │
├─────────────────────────────────────────┤
│ Банковский счёт *                       │
│ [▼ ВТБ Зарплатный (150 000 RUB)__]      │
│                                         │
│ Валютный актив фонда *                  │
│ [▼ Рубль (RUB)__________________]       │
│                                         │
│ Сумма *                                 │
│ [50000_____________________________]    │
│                                         │
│ Дата                                    │
│ [📅 15.01.2026____]                     │
│                                         │
│ Комментарий                             │
│ [_________________________________]     │
│                                         │
│              [Отмена]  [Пополнить]      │
└─────────────────────────────────────────┘
```

---

### 3. Модальное окно "Перевести актив"

**Когда открывать:** Кнопка "Перевести" в карточке фонда или у актива

**Поля формы:**

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| Актив | Select | Да | Выбор из активов текущего фонда |
| Количество | Number | Да | max = баланс актива |
| Целевой фонд | Select | Да | Выбор из `/funds` (без текущего) |
| Дата | DatePicker | Нет | По умолчанию сегодня |
| Комментарий | Textarea | Нет | — |

**Валидация:**
- Количество не должно превышать баланс актива
- Целевой фонд ≠ текущий фонд

**Wireframe:**
```
┌─────────────────────────────────────────┐
│ Перевести актив                     [X] │
├─────────────────────────────────────────┤
│ Актив *                                 │
│ [▼ ВИМ Ликвидность (1100 шт.)___]       │
│                                         │
│ Количество *                            │
│ [50_______] из 1100 доступно            │
│                                         │
│ В фонд *                                │
│ [▼ Путешествия_________________]        │
│                                         │
│ Дата                                    │
│ [📅 15.01.2026____]                     │
│                                         │
│ Комментарий                             │
│ [_________________________________]     │
│                                         │
│              [Отмена]  [Перевести]      │
└─────────────────────────────────────────┘
```

---

### 4. Секция "История операций"

**Где отображать:** Вкладка или раскрывающаяся секция в карточке фонда

**Фильтры:**
- Тип операции (multiselect checkbox)
- Период (date range picker)

**Колонки таблицы:**

| Колонка | Поле | Форматирование |
|---------|------|----------------|
| Дата | `date` | DD.MM.YYYY |
| Тип | `transaction_type` | Иконка + текст |
| Актив | `asset_name` | Название (тикер) |
| Количество | `amount` | Число с точностью |
| Цена | `price_per_unit.Float64` | Для buy/sell |
| Сумма | `total_value.Float64` | С валютой |
| Источник/Цель | * | См. ниже |

**Логика колонки "Источник/Цель":**
```typescript
function getCounterpartLabel(tx: Transaction): string {
  switch (tx.transaction_type) {
    case 'buy':
    case 'sell':
      return tx.counterpart_asset_name || '';
    case 'transfer_in':
      return `← ${tx.counterpart_fund_name}`;
    case 'transfer_out':
      return `→ ${tx.counterpart_fund_name}`;
    case 'deposit':
      return tx.source_account_name || '';
    default:
      return '';
  }
}
```

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ История операций                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│ Фильтры: [☑ Покупка] [☑ Продажа] [☑ Переводы] [☑ Пополнения]           │
│          Период: [01.01.2026] — [15.01.2026]                [Сбросить] │
├─────────────────────────────────────────────────────────────────────────┤
│ Дата       │ Тип        │ Актив              │ Кол-во │ Цена  │ Сумма  │
│────────────┼────────────┼────────────────────┼────────┼───────┼────────│
│ 15.01.2026 │ 🛒 Покупка │ ВИМ Ликвидность    │ 100    │ 1.82  │ 182 ₽  │
│ 15.01.2026 │ ↗ Перевод  │ ВИМ Ликвидность    │ 50     │ —     │ → Путешествия │
│ 14.01.2026 │ 💰 Пополн. │ Рубль              │ 50000  │ —     │ ВТБ    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Константы и локализация

### Типы операций

```typescript
export const TRANSACTION_TYPES = {
  buy: {
    label: 'Покупка',
    icon: 'ShoppingCart',
    color: 'green',
    description: 'Покупка актива за валюту фонда'
  },
  sell: {
    label: 'Продажа',
    icon: 'DollarSign',
    color: 'blue',
    description: 'Продажа актива за валюту фонда'
  },
  transfer_in: {
    label: 'Входящий перевод',
    icon: 'ArrowDownLeft',
    color: 'green',
    description: 'Получение актива из другого фонда'
  },
  transfer_out: {
    label: 'Исходящий перевод',
    icon: 'ArrowUpRight',
    color: 'orange',
    description: 'Отправка актива в другой фонд'
  },
  deposit: {
    label: 'Пополнение',
    icon: 'Plus',
    color: 'green',
    description: 'Пополнение с банковского счёта'
  }
} as const;

export type TransactionType = keyof typeof TRANSACTION_TYPES;
```

### Сообщения об ошибках

```typescript
export const ERROR_MESSAGES = {
  INSUFFICIENT_BALANCE: 'Недостаточно средств',
  INSUFFICIENT_ASSET_BALANCE: 'Недостаточно актива для операции',
  SAME_FUND_TRANSFER: 'Нельзя переводить в тот же фонд',
  INVALID_AMOUNT: 'Сумма должна быть положительной',
  FUND_NOT_FOUND: 'Фонд не найден',
  ASSET_NOT_FOUND: 'Актив не найден',
  ACCOUNT_NOT_FOUND: 'Счёт не найден'
};
```

---

## Примеры интеграции

### React Query hooks

```typescript
// hooks/useFundOperations.ts

export function useBuyAsset(fundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BuyAssetRequest) =>
      api.post(`/funds/${fundId}/buy-asset`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fund', fundId]);
      queryClient.invalidateQueries(['fund-transactions', fundId]);
    }
  });
}

export function useDepositToFund(fundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DepositToFundRequest) =>
      api.post(`/funds/${fundId}/deposit`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fund', fundId]);
      queryClient.invalidateQueries(['fund-transactions', fundId]);
      queryClient.invalidateQueries(['accounts']); // баланс счёта изменился
    }
  });
}

export function useTransferAsset(fundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferAssetRequest) =>
      api.post(`/funds/${fundId}/transfer-asset`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['fund', fundId]);
      queryClient.invalidateQueries(['fund', variables.toFundId]);
      queryClient.invalidateQueries(['fund-transactions', fundId]);
      queryClient.invalidateQueries(['fund-transactions', variables.toFundId]);
    }
  });
}

export function useFundTransactions(
  fundId: string,
  filters?: { type?: string; from?: string; to?: string }
) {
  return useQuery({
    queryKey: ['fund-transactions', fundId, filters],
    queryFn: () => api.get(`/funds/${fundId}/transactions`, { params: filters })
  });
}
```

---

## Диаграмма потоков данных

```
┌─────────────────────────────────────────────────────────────────┐
│                         ФОНД                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Валютный    │    │ Актив 1     │    │ Актив 2     │         │
│  │ актив (RUB) │    │ (ETF)       │    │ (Акции)     │         │
│  │ 80 388 ₽    │    │ 1100 шт.    │    │ 50 шт.      │         │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘         │
│         │                  │                                    │
│         │  buy-asset       │  transfer-asset                    │
│         │  ────────────►   │  ────────────────►                 │
│         │  (списание)      │  (перевод в другой фонд)          │
│         │                  │                                    │
│         │  sell-asset      │                                    │
│         │  ◄────────────   │                                    │
│         │  (зачисление)    │                                    │
└─────────┼──────────────────┼────────────────────────────────────┘
          │                  │
          │ deposit          │
          │ ▲                │
          │ │                ▼
┌─────────┴─┴────┐    ┌─────────────────┐
│ Банковский     │    │ ДРУГОЙ ФОНД     │
│ счёт           │    │ (transfer_in)   │
│ (ВТБ)          │    │                 │
└────────────────┘    └─────────────────┘
```

---

## Чеклист реализации

- [ ] Создать TypeScript типы для API
- [ ] Реализовать React Query hooks
- [ ] Модальное окно "Купить актив"
- [ ] Модальное окно "Пополнить фонд"
- [ ] Модальное окно "Перевести актив"
- [ ] Компонент таблицы истории операций
- [ ] Фильтры для истории операций
- [ ] Добавить кнопки в карточку фонда
- [ ] Обработка ошибок и уведомления
- [ ] Тесты компонентов
