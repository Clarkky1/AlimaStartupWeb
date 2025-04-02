const defaultTypography = {
  fontFamily: {
    sans: 'var(--font-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'var(--font-serif, Georgia, Cambria, "Times New Roman", Times, serif)',
    mono: 'var(--font-mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace)',
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
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
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
    fontSize: defaultTypography.fontSize['3xl'],
    fontWeight: defaultTypography.fontWeight.bold,
    lineHeight: defaultTypography.lineHeight.tight,
    letterSpacing: defaultTypography.letterSpacing.tight,
    marginBottom: '1rem',
  },
  h2: {
    fontSize: defaultTypography.fontSize['2xl'],
    fontWeight: defaultTypography.fontWeight.semibold,
    lineHeight: defaultTypography.lineHeight.tight,
    letterSpacing: defaultTypography.letterSpacing.tight,
    marginBottom: '0.75rem',
  },
  h3: {
    fontSize: defaultTypography.fontSize.xl,
    fontWeight: defaultTypography.fontWeight.semibold,
    lineHeight: defaultTypography.lineHeight.snug,
    letterSpacing: defaultTypography.letterSpacing.normal,
    marginBottom: '0.75rem',
  },
  h4: {
    fontSize: defaultTypography.fontSize.lg,
    fontWeight: defaultTypography.fontWeight.medium,
    lineHeight: defaultTypography.lineHeight.snug,
    letterSpacing: defaultTypography.letterSpacing.normal,
    marginBottom: '0.5rem',
  },
  h5: {
    fontSize: defaultTypography.fontSize.base,
    fontWeight: defaultTypography.fontWeight.medium,
    lineHeight: defaultTypography.lineHeight.normal,
    letterSpacing: defaultTypography.letterSpacing.normal,
    marginBottom: '0.5rem',
  },
  h6: {
    fontSize: defaultTypography.fontSize.sm,
    fontWeight: defaultTypography.fontWeight.medium,
    lineHeight: defaultTypography.lineHeight.normal,
    letterSpacing: defaultTypography.letterSpacing.normal,
    marginBottom: '0.5rem',
  },
}

export const bodyStyles = {
  regular: {
    fontSize: defaultTypography.fontSize.base,
    fontWeight: defaultTypography.fontWeight.normal,
    lineHeight: defaultTypography.lineHeight.normal,
    letterSpacing: defaultTypography.letterSpacing.normal,
  },
  small: {
    fontSize: defaultTypography.fontSize.sm,
    fontWeight: defaultTypography.fontWeight.normal,
    lineHeight: defaultTypography.lineHeight.normal,
    letterSpacing: defaultTypography.letterSpacing.normal,
  },
  large: {
    fontSize: defaultTypography.fontSize.lg,
    fontWeight: defaultTypography.fontWeight.normal,
    lineHeight: defaultTypography.lineHeight.relaxed,
    letterSpacing: defaultTypography.letterSpacing.normal,
  },
}

export default {
  ...defaultTypography,
  headings: headingStyles,
  body: bodyStyles,
} 