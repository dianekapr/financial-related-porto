import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SLICE — Split Bill',
  description: 'Split tagihan dengan teman. Upload struk, assign item, beres!',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'SLICE' },
}

export const viewport: Viewport = {
  themeColor: '#FF5E1A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slice-bg text-slice-dark antialiased">
        {children}
      </body>
    </html>
  )
}
