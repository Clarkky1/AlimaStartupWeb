# Alima Theme System

This directory contains the theme system for the Alima platform, allowing for multiple theme variants while maintaining consistent styling across the application.

## Structure

- `/default` - Contains the default theme configuration
- `/premium` - Contains the premium theme configuration with enhanced styling

Each theme directory contains:

- `colors.ts` - Color palette configuration
- `typography.ts` - Typography system configuration
- `shadows.ts` - Shadow system configuration

## Root Files

- `theme-context.tsx` - The React context provider that manages theme switching

## Usage

### Switching Themes

The application includes a theme switcher component that allows users to toggle between themes. The theme selection is persisted in local storage.

```tsx
import { ThemeSwitcher } from "@/components/theme-switcher";

// In your component:
<ThemeSwitcher />
```

### Accessing Theme Values in Components

You can access theme values in your components using the provided hooks:

```tsx
import { useCustomTheme, useThemeColors, useThemeTypography, useThemeShadows } from "@/themes/theme-context";

// In your component:
const { themeVariant, setThemeVariant } = useCustomTheme();
const colors = useThemeColors();
const typography = useThemeTypography();
const shadows = useThemeShadows();

// Example usage:
<div style={{ 
  color: `hsl(${colors.primary})`,
  fontSize: typography.fontSize.base,
  boxShadow: shadows.md
}}>
  Themed component
</div>
```

## Adding a New Theme

To add a new theme:

1. Create a new directory with the theme name
2. Copy the structure from an existing theme
3. Update the configuration files with your new theme values
4. Add the new theme to the `ThemeVariant` type in `theme-context.tsx`
5. Add the new theme to the `themes` array in the theme switcher component
6. Add CSS variables for the new theme in `globals.css`

## Customization

The theme system is built on top of the CSS variables defined in `globals.css`. Each theme sets these variables which are then used by the Tailwind CSS classes throughout the application.

## Theme Specific Styling

You can add theme-specific styles using the `data-theme-variant` attribute that's automatically applied to the HTML document element:

```css
[data-theme-variant="premium"] .special-element {
  /* Premium theme specific styling */
}
``` 