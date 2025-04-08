'use client'

import * as React from 'react'
import { ThemeProvider as NextThemeProvider, type ThemeProviderProps as NextThemeProviderProps } from 'next-themes'

interface ThemeProviderProps extends Omit<NextThemeProviderProps, 'resolved'> {
  children: React.ReactNode;
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      {children}
    </NextThemeProvider>
  )
}
