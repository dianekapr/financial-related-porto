import type { Metadata, Viewport } from 'next'
import './globals.css'
import ThemeProvider, { themeInitScript } from '../components/ThemeProvider'
import LocaleProvider from '../components/LocaleProvider'
import { getServerLocale } from '../lib/getServerLocale'

export const metadata: Metadata = {
  title: 'VAULT — Money Manager',
  description: 'Track your money like a pro. Dark luxury finance dashboard.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'VAULT' },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getServerLocale()

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-vault-bg text-vault-text antialiased">
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
