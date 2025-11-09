import './globals.css'
import type { ReactNode } from 'react'
import Providers from '@/src/components/Providers'
import Navigation from '@/src/components/Navigation'

export const metadata = {
  title: 'Asset Manager',
  description: 'Track assets with depreciation and tags'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Providers>
          <div style={{ display: 'flex' }}>
            <Navigation />
            <main style={{ flex: 1, overflow: 'auto' }}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
