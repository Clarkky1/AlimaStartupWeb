'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useTheme as useNextTheme } from 'next-themes'

// Import theme configurations
import defaultColors from './default/colors'
import defaultTypography from './default/typography'
import defaultShadows from './default/shadows'

import premiumColors from './premium/colors'
import premiumTypography from './premium/typography'
import premiumShadows from './premium/shadows'

// Theme options
export type ThemeVariant = 'default' | 'premium'

// Theme configuration structure
export interface ThemeConfig {
  colors: {
    colors: {
      light: Record<string, string>
      dark: Record<string, string>
    }
    chartColors: {
      light: Record<string, string>
      dark: Record<string, string>
    }
    sidebarColors: {
      light: Record<string, string>
      dark: Record<string, string>
    }
    radius: {
      radius: string
    }
  }
  typography: typeof defaultTypography
  shadows: {
    sm: string
    DEFAULT: string
    md: string
    lg: string
    xl: string
    '2xl': string
    inner: string
    none: string
    effects: Record<string, string>
  }
}

// All themes with their configurations
const themes: Record<ThemeVariant, ThemeConfig> = {
  default: {
    colors: defaultColors,
    typography: defaultTypography,
    shadows: defaultShadows,
  },
  premium: {
    colors: premiumColors,
    typography: premiumTypography,
    shadows: premiumShadows,
  },
}

// Theme context interface
interface ThemeContextType {
  themeVariant: ThemeVariant
  setThemeVariant: (variant: ThemeVariant) => void
  theme: ThemeConfig
  isDarkMode: boolean
}

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode
  defaultVariant?: ThemeVariant
}

// Custom theme provider that combines next-themes with our theme variants
export function CustomThemeProvider({
  children,
  defaultVariant = 'default',
}: ThemeProviderProps) {
  const { theme: colorMode, setTheme } = useNextTheme()
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>(defaultVariant)
  
  // Get current theme configuration
  const theme = themes[themeVariant]
  const isDarkMode = colorMode === 'dark'

  // Apply theme variant change
  const handleThemeVariantChange = (variant: ThemeVariant) => {
    setThemeVariant(variant)
    // Apply any necessary CSS changes
    document.documentElement.setAttribute('data-theme-variant', variant)
  }

  // Initialize theme variant
  useEffect(() => {
    // Check for stored preference
    const storedVariant = localStorage.getItem('theme-variant') as ThemeVariant | null
    if (storedVariant && Object.keys(themes).includes(storedVariant)) {
      handleThemeVariantChange(storedVariant)
    } else {
      handleThemeVariantChange(defaultVariant)
    }
  }, [defaultVariant])

  // Save theme variant preference when it changes
  useEffect(() => {
    localStorage.setItem('theme-variant', themeVariant)
  }, [themeVariant])

  return (
    <ThemeContext.Provider
      value={{
        themeVariant,
        setThemeVariant: handleThemeVariantChange,
        theme,
        isDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

// Hook for accessing theme context
export function useCustomTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider')
  }
  return context
}

// Helper hooks for specific theme properties
export function useThemeColors() {
  const { theme, isDarkMode } = useCustomTheme()
  return isDarkMode ? theme.colors.colors.dark : theme.colors.colors.light
}

export function useThemeTypography() {
  const { theme } = useCustomTheme()
  return theme.typography
}

export function useThemeShadows() {
  const { theme } = useCustomTheme()
  return theme.shadows
} 