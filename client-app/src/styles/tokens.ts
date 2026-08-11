const cssVariable = (name: string) => `var(--${name})`

export const tokens = {
  color: {
    brandPrimary: cssVariable('color-brand-primary'),
    brandInk: cssVariable('color-brand-ink'),
    brandAccent: cssVariable('color-brand-accent'),
    textPrimary: cssVariable('color-text-primary'),
    textMuted: cssVariable('color-text-muted'),
    textSubtle: cssVariable('color-text-subtle'),
    surfacePage: cssVariable('color-surface-page'),
    surfaceCard: cssVariable('color-surface-card'),
    surfaceSubtle: cssVariable('color-surface-subtle'),
    borderDefault: cssVariable('color-border-default'),
    signalPositive: cssVariable('color-signal-positive'),
    signalWatch: cssVariable('color-signal-watch'),
    signalRisk: cssVariable('color-signal-risk'),
    signalInfo: cssVariable('color-signal-info'),
  },
  font: {
    familySystem: cssVariable('font-family-system'),
    size12: cssVariable('font-size-12'),
    size14: cssVariable('font-size-14'),
    size16: cssVariable('font-size-16'),
    size20: cssVariable('font-size-20'),
    size24: cssVariable('font-size-24'),
    size30: cssVariable('font-size-30'),
    lineHeightBody: cssVariable('line-height-body'),
  },
  space: {
    4: cssVariable('space-4'),
    8: cssVariable('space-8'),
    12: cssVariable('space-12'),
    16: cssVariable('space-16'),
    24: cssVariable('space-24'),
    32: cssVariable('space-32'),
    40: cssVariable('space-40'),
  },
  radius: {
    8: cssVariable('radius-8'),
    12: cssVariable('radius-12'),
    16: cssVariable('radius-16'),
    24: cssVariable('radius-24'),
    pill: cssVariable('radius-pill'),
  },
  border: {
    default: cssVariable('border-default'),
  },
  shadow: {
    card: cssVariable('shadow-card'),
    overlay: cssVariable('shadow-overlay'),
  },
  motion: {
    durationFast: cssVariable('duration-fast'),
    durationStandard: cssVariable('duration-standard'),
    distance: cssVariable('motion-distance'),
  },
  layout: {
    bottomNavigation: cssVariable('layout-bottom-navigation'),
  },
} as const
