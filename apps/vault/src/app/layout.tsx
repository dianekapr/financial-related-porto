import type { Metadata, Viewport } from 'next'
import './globals.css'
import ThemeProvider, { themeInitScript } from '../components/ThemeProvider'

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
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-vault-bg text-vault-text antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
