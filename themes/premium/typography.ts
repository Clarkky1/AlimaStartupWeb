const premiumTypography = {
  fontFamily: {
    sans: 'var(--font-sans), "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'var(--font-serif, "Playfair Display", Georgia, Cambria, "Times New Roman", Times, serif)',
    mono: 'var(--font-mono, "JetBrains Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace)',
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
}

export const headingStyles = {
  h1: {
    fontSize: premiumTypography.fontSize['4xl'],
    fontWeight: premiumTypography.fontWeight.bold,
    lineHeight: premiumTypography.lineHeight.tight,
    letterSpacing: premiumTypography.letterSpacing.tight,
    marginBottom: '1.5rem',
  },
  h2: {
    fontSize: premiumTypography.fontSize['3xl'],
    fontWeight: premiumTypography.fontWeight.semibold,
    lineHeight: premiumTypography.lineHeight.tight,
    letterSpacing: premiumTypography.letterSpacing.tight,
    marginBottom: '1.25rem',
  },
  h3: {
    fontSize: premiumTypography.fontSize['2xl'],
    fontWeight: premiumTypography.fontWeight.semibold,
    lineHeight: premiumTypography.lineHeight.snug,
    letterSpacing: premiumTypography.letterSpacing.normal,
    marginBottom: '1rem',
  },
  h4: {
    fontSize: premiumTypography.fontSize.xl,
    fontWeight: premiumTypography.fontWeight.medium,
    lineHeight: premiumTypography.lineHeight.snug,
    letterSpacing: premiumTypography.letterSpacing.normal,
    marginBottom: '0.75rem',
  },
  h5: {
    fontSize: premiumTypography.fontSize.lg,
    fontWeight: premiumTypography.fontWeight.medium,
    lineHeight: premiumTypography.lineHeight.normal,
    letterSpacing: premiumTypography.letterSpacing.normal,
    marginBottom: '0.5rem',
  },
  h6: {
    fontSize: premiumTypography.fontSize.base,
    fontWeight: premiumTypography.fontWeight.medium,
    lineHeight: premiumTypography.lineHeight.normal,
    letterSpacing: premiumTypography.letterSpacing.normal,
    marginBottom: '0.5rem',
  },
}

export const bodyStyles = {
  regular: {
    fontSize: premiumTypography.fontSize.base,
    fontWeight: premiumTypography.fontWeight.normal,
    lineHeight: premiumTypography.lineHeight.relaxed,
    letterSpacing: premiumTypography.letterSpacing.normal,
  },
  small: {
    fontSize: premiumTypography.fontSize.sm,
    fontWeight: premiumTypography.fontWeight.normal,
    lineHeight: premiumTypography.lineHeight.normal,
    letterSpacing: premiumTypography.letterSpacing.normal,
  },
  large: {
    fontSize: premiumTypography.fontSize.lg,
    fontWeight: premiumTypography.fontWeight.normal,
    lineHeight: premiumTypography.lineHeight.relaxed,
    letterSpacing: premiumTypography.letterSpacing.normal,
  },
}

export default {
  ...premiumTypography,
  headings: headingStyles,
  body: bodyStyles,
} 