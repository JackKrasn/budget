# API: Группировка активов по фондам

## Endpoint

```
GET /fund-deposits/by-asset
```

## Описание

Возвращает список всех активов с группировкой по `asset_id`. Для каждого актива показывает в каких фондах он находится и в каком количестве.

## Response

```json
{
  "data": [
    {
      "assetId": "550e8400-e29b-41d4-a716-446655440000",
      "assetName": "Акции Сбербанка",
      "assetTicker": "SBER",
      "assetCurrency": "RUB",
      "assetTypeName": "Акции",
      "currentPrice": 250.50,
      "totalAmount": 100.0,
      "totalValue": 25050.0,
      "funds": [
        {
          "fundId": "660e8400-e29b-41d4-a716-446655440001",
          "fundName": "Резервный фонд",
          "fundIcon": "💰",
          "fundColor": "#FF5733",
          "amount": 60.0,
          "value": 15030.0
        },
        {
          "fundId": "770e8400-e29b-41d4-a716-446655440002",
          "fundName": "Пенсионный фонд",
          "fundIcon": "🏦",
          "fundColor": "#33FF57",
          "amount": 40.0,
          "value": 10020.0
        }
      ]
    },
    {
      "assetId": "880e8400-e29b-41d4-a716-446655440003",
      "assetName": "Доллар США",
      "assetTicker": "USD",
      "assetCurrency": "USD",
      "assetTypeName": "Валюта",
      "currentPrice": 92.50,
      "totalAmount": 1000.0,
      "totalValue": 92500.0,
      "funds": [
        {
          "fundId": "660e8400-e29b-41d4-a716-446655440001",
          "fundName": "Резервный фонд",
          "fundIcon": "💰",
          "fundColor": "#FF5733",
          "amount": 1000.0,
          "value": 92500.0
        }
      ]
    }
  ],
  "total": 2
}
```

## Поля ответа

### AssetGrouped

| Поле | Тип | Описание |
|------|-----|----------|
| `assetId` | UUID | ID актива |
| `assetName` | string | Название актива |
| `assetTicker` | string? | Тикер актива (может быть null) |
| `assetCurrency` | string | Валюта актива |
| `assetTypeName` | string | Тип актива (Акции, Облигации, Валюта и т.д.) |
| `currentPrice` | float | Текущая цена актива |
| `totalAmount` | float | Общее количество актива во всех фондах |
| `totalValue` | float | Общая стоимость (totalAmount × currentPrice) |
| `funds` | FundAmount[] | Список фондов с этим активом |

### FundAmount

| Поле | Тип | Описание |
|------|-----|----------|
| `fundId` | UUID | ID фонда |
| `fundName` | string | Название фонда |
| `fundIcon` | string? | Иконка фонда (может быть null) |
| `fundColor` | string? | Цвет фонда (может быть null) |
| `amount` | float | Количество актива в этом фонде |
| `value` | float | Стоимость актива в этом фонде |

## TypeScript интерфейсы

```typescript
interface FundAmount {
  fundId: string;
  fundName: string;
  fundIcon: string | null;
  fundColor: string | null;
  amount: number;
  value: number;
}

interface AssetGrouped {
  assetId: string;
  assetName: string;
  assetTicker: string | null;
  assetCurrency: string;
  assetTypeName: string;
  currentPrice: number;
  totalAmount: number;
  totalValue: number;
  funds: FundAmount[];
}

interface GroupedByAssetResponse {
  data: AssetGrouped[];
  total: number;
}
```

## Пример использования (React/fetch)

```typescript
async function fetchAssetsByFund(): Promise<GroupedByAssetResponse> {
  const response = await fetch('/api/fund-deposits/by-asset');
  if (!response.ok) {
    throw new Error('Failed to fetch assets');
  }
  return response.json();
}
```

## Пример использования (React Query)

```typescript
import { useQuery } from '@tanstack/react-query';

export function useAssetsByFund() {
  return useQuery({
    queryKey: ['fund-deposits', 'by-asset'],
    queryFn: fetchAssetsByFund,
  });
}
```
