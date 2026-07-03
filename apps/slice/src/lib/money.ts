// Deliberately avoids Intl's currency-style formatting (`toLocaleString(..., {
// style: 'currency' })`): its symbol/spacing rules differ between Node's
// server-side ICU and the browser's, which causes React hydration mismatches.
// Formatting manually keeps server and client output byte-identical.

const CURRENCY_SYMBOLS: Record<string, string> = {
  IDR: 'Rp',
  USD: '$',
  EUR: '€',
  SGD: 'S$',
  MYR: 'RM',
  JPY: '¥',
  GBP: '£',
  AUD: 'A$',
}

const ZERO_DECIMAL_CURRENCIES = new Set(['IDR', 'JPY'])

export function formatMoney(n: number, currency: string = 'IDR') {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  const decimals = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2
  const rounded = Math.round(n * 10 ** decimals) / 10 ** decimals
  const sign = rounded < 0 ? '-' : ''
  const [intPart, decPart] = Math.abs(rounded).toFixed(decimals).split('.')
  const thousandSep = currency === 'IDR' ? '.' : ','
  const decimalSep = currency === 'IDR' ? ',' : '.'
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep)
  return `${sign}${symbol} ${grouped}${decPart ? decimalSep + decPart : ''}`
}
