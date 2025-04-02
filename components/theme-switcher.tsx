'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useCustomTheme, ThemeVariant } from '@/themes/theme-context'
import { Paintbrush, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeSwitcher() {
  const { theme: colorMode, setTheme } = useTheme()
  const { themeVariant, setThemeVariant } = useCustomTheme()
  
  // All available themes
  const themes: { value: ThemeVariant; label: string }[] = [
    { value: 'default', label: 'Default Theme' },
    { value: 'premium', label: 'Premium Theme' },
  ]

  return (
    <div className="flex items-center gap-2">
      {/* Mode Switcher (Light/Dark) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme('light')}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Variant Switcher (Default/Premium) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Paintbrush className="h-4 w-4" />
            <span className="sr-only">Toggle theme variant</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.value}
              onClick={() => setThemeVariant(theme.value)}
              className={themeVariant === theme.value ? 'bg-accent' : ''}
            >
              {theme.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 