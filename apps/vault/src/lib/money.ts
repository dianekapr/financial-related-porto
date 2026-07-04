// Deliberately avoids Intl's currency-style formatting (`toLocaleString(..., {
// style: 'currency' })`): its symbol/spacing rules differ between Node's
// server-side ICU and the browser's, which causes React hydration mismatches
// on any client component that formats a currency value during render.
// Formatting manually keeps server and client output byte-identical.

export function formatIDR(n: number) {
  const rounded = Math.round(n)
  const sign = rounded < 0 ? '-' : ''
  const grouped = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}Rp ${grouped}`
}
