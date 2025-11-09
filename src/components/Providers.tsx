"use client"
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import type { ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <FluentProvider theme={webLightTheme} style={{ minHeight: '100vh' }}>
      {children}
    </FluentProvider>
  )
}
