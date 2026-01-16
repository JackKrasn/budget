import type { FundTransactionType } from '@/lib/api/types'

export const TRANSACTION_TYPES: Record<
  FundTransactionType,
  {
    label: string
    icon: string
    color: string
    description: string
  }
> = {
  buy: {
    label: 'Покупка',
    icon: 'ShoppingCart',
    color: 'green',
    description: 'Покупка актива за валюту фонда',
  },
  sell: {
    label: 'Продажа',
    icon: 'DollarSign',
    color: 'blue',
    description: 'Продажа актива за валюту фонда',
  },
  transfer_in: {
    label: 'Входящий перевод',
    icon: 'ArrowDownLeft',
    color: 'green',
    description: 'Получение актива из другого фонда',
  },
  transfer_out: {
    label: 'Исходящий перевод',
    icon: 'ArrowUpRight',
    color: 'orange',
    description: 'Отправка актива в другой фонд',
  },
  deposit: {
    label: 'Пополнение',
    icon: 'Plus',
    color: 'green',
    description: 'Пополнение с банковского счёта',
  },
  withdrawal: {
    label: 'Списание на расход',
    icon: 'Receipt',
    color: 'red',
    description: 'Финансирование расхода из фонда',
  },
}

export const ERROR_MESSAGES = {
  INSUFFICIENT_BALANCE: 'Недостаточно средств',
  INSUFFICIENT_ASSET_BALANCE: 'Недостаточно актива для операции',
  SAME_FUND_TRANSFER: 'Нельзя переводить в тот же фонд',
  INVALID_AMOUNT: 'Сумма должна быть положительной',
  FUND_NOT_FOUND: 'Фонд не найден',
  ASSET_NOT_FOUND: 'Актив не найден',
  ACCOUNT_NOT_FOUND: 'Счёт не найден',
}
