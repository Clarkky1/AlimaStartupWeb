const premiumShadows = {
  sm: '0 2px 5px -1px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.1)',
  DEFAULT: '0 4px 8px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  md: '0 8px 15px -3px rgba(0, 0, 0, 0.1), 0 3px 6px -4px rgba(0, 0, 0, 0.1)',
  lg: '0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 8px 15px -6px rgba(0, 0, 0, 0.1)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 12px 24px -8px rgba(0, 0, 0, 0.1)',
  '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.2), 0 20px 40px -10px rgba(0, 0, 0, 0.15)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
}

// Premium specific shadow effects
export const premiumEffects = {
  // Subtle glow for primary elements/highlights
  glow: '0 0 15px rgba(79, 70, 229, 0.35)',
  
  // Soft inset shadow for pressed/active states
  pressed: 'inset 0 2px 5px 0 rgba(0, 0, 0, 0.08)',
  
  // Card hover effect - subtle lift and glow
  cardHover: '0 12px 20px -3px rgba(0, 0, 0, 0.15), 0 0 10px rgba(79, 70, 229, 0.15)',
  
  // Button hover effect
  buttonHover: '0 4px 10px -1px rgba(79, 70, 229, 0.4)',
  
  // Frosted glass effect (use with backdrop-filter: blur)
  frost: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  
  // Elevated content (modals, drawers)
  elevated: '0 20px 50px -10px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)',
}

export default {
  ...premiumShadows,
  effects: premiumEffects,
} 