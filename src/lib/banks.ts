export interface Bank {
  id: string
  name: string
  logo: string
  aliases?: string[]
}

export const BANKS: Bank[] = [
  // Российские банки
  { id: 'tbank', name: 'Т-Банк', logo: '/bank-logos/tbank.svg', aliases: ['тинькофф', 'tinkoff', 't-bank', 'тбанк', 'т банк'] },
  { id: 'sber', name: 'Сбер', logo: '/bank-logos/sber.svg', aliases: ['сбер', 'sberbank', 'сбербанк', 'сбер банк'] },
  { id: 'alfa', name: 'Альфа-Банк', logo: '/bank-logos/alfa.svg', aliases: ['альфа', 'alfa-bank', 'alfabank', 'альфабанк', 'альфа банк'] },
  { id: 'vtb', name: 'ВТБ', logo: '/bank-logos/vtb.svg', aliases: ['vtb bank'] },
  { id: 'gazprombank', name: 'Газпромбанк', logo: '/bank-logos/gazprombank.svg', aliases: ['газпром', 'gpb'] },
  { id: 'raiffeisen', name: 'Райффайзен', logo: '/bank-logos/raifasen.svg', aliases: ['raiffeisen', 'райф'] },
  { id: 'rosselhozbank', name: 'Россельхозбанк', logo: '/bank-logos/rosselhozbank.svg', aliases: ['рсхб', 'rshb'] },
  { id: 'ozonbank', name: 'OZON Банк', logo: '/bank-logos/ozonbank.svg', aliases: ['ozon', 'озон'] },
  { id: 'yandex', name: 'Яндекс', logo: '/bank-logos/yandex.svg', aliases: ['yandex bank', 'яндекс банк', 'yandex pay'] },
  { id: 'cifra', name: 'Цифра Банк', logo: '/bank-logos/cifra.svg', aliases: ['cifra bank'] },

  // Брокеры / Инвестиции
  { id: 'freedom', name: 'Freedom Finance', logo: '/bank-logos/freedom.svg', aliases: ['фридом', 'freedom'] },
  { id: 'bcs', name: 'БКС', logo: '/bank-logos/bcs.svg', aliases: ['bcs broker', 'бкс брокер'] },

  // Международные банки
  { id: 'vakifbank', name: 'VakıfBank', logo: '/bank-logos/vakifbank.svg', aliases: ['vakif', 'вакыфбанк'] },
]

/**
 * Найти банк по ID
 */
export function getBankById(id: string): Bank | undefined {
  return BANKS.find((bank) => bank.id === id)
}

/**
 * Найти банк по названию (точное или частичное совпадение)
 */
export function getBankByName(name: string): Bank | undefined {
  if (!name) return undefined

  const normalizedName = name.toLowerCase().trim()

  // Сначала ищем точное совпадение
  const exactMatch = BANKS.find((bank) => {
    // Точное совпадение по названию
    if (bank.name.toLowerCase() === normalizedName) return true

    // Совпадение по ID
    if (bank.id === normalizedName) return true

    // Совпадение по aliases
    if (bank.aliases?.some((alias) => alias.toLowerCase() === normalizedName)) return true

    return false
  })

  if (exactMatch) return exactMatch

  // Если точного совпадения нет, ищем по включению подстроки
  return BANKS.find((bank) => {
    // Название банка содержит введённое значение или наоборот
    if (bank.name.toLowerCase().includes(normalizedName)) return true
    if (normalizedName.includes(bank.name.toLowerCase())) return true

    // Поиск в aliases
    if (bank.aliases?.some((alias) => {
      const normalizedAlias = alias.toLowerCase()
      return normalizedAlias.includes(normalizedName) || normalizedName.includes(normalizedAlias)
    })) return true

    return false
  })
}

/**
 * Поиск банков по запросу (для комбобокса)
 */
export function searchBanks(query: string): Bank[] {
  if (!query) return BANKS

  const normalizedQuery = query.toLowerCase().trim()

  return BANKS.filter((bank) => {
    // Поиск в названии
    if (bank.name.toLowerCase().includes(normalizedQuery)) return true

    // Поиск в ID
    if (bank.id.includes(normalizedQuery)) return true

    // Поиск в aliases
    if (bank.aliases?.some((alias) => alias.toLowerCase().includes(normalizedQuery))) return true

    return false
  })
}
