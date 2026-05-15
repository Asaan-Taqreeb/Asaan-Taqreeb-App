/**
 * Asaan Taqreeb — Design System
 * Aesthetic: Swiss Design / Functional Minimalism
 * Grid: 8pt base unit | Radius: 4px max | No gradients | No glassmorphism
 * Accent: Electric Blue #2563EB (used sparingly)
 */

export const Colors = {
  // ── Core ──────────────────────────────────────────────────────────
  primary:      '#2563EB',   // Electric Blue — ONE accent color
  primaryLight: '#3B82F6',
  primaryDark:  '#1D4ED8',
  primaryMuted: '#EFF6FF',   // near-white blue tint

  // ── Vendor (kept for vendor-specific surfaces) ────────────────────
  vendor:       '#0A0A0A',   // near-black
  vendorLight:  '#18181B',
  vendorAccent: '#27272A',

  // ── Accent (reused as primary) ────────────────────────────────────
  accent:       '#2563EB',
  accentLight:  '#3B82F6',
  accentMuted:  '#EFF6FF',

  // ── Backgrounds ───────────────────────────────────────────────────
  background:   '#FAFAFA',   // off-white page surface
  white:        '#FFFFFF',
  lightGray:    '#F4F4F5',   // input fill, secondary surface

  // ── Text ──────────────────────────────────────────────────────────
  textPrimary:   '#0A0A0A',  // near-black
  textSecondary: '#52525B',  // zinc-600
  textTertiary:  '#A1A1AA',  // zinc-400
  textLight:     '#FAFAFA',

  // ── Status ────────────────────────────────────────────────────────
  success:      '#16A34A',
  successLight: '#F0FDF4',
  warning:      '#D97706',
  warningLight: '#FFFBEB',
  error:        '#DC2626',
  errorLight:   '#FEF2F2',
  info:         '#2563EB',
  infoLight:    '#EFF6FF',

  // ── Category (muted, professional) ───────────────────────────────
  banquet:  '#0A0A0A',   // near-black
  catering: '#2563EB',   // electric blue
  photo:    '#52525B',   // dark gray
  parlor:   '#16A34A',   // deep green

  // ── Rating ────────────────────────────────────────────────────────
  rating: '#D97706',

  // ── Borders ───────────────────────────────────────────────────────
  border:     '#E4E4E7',   // zinc-200 — used for ALL 1px borders
  borderDark: '#A1A1AA',   // zinc-400

  // ── Misc ──────────────────────────────────────────────────────────
  shadow:      '#0A0A0A',
  overlay:     'rgba(10,10,10,0.5)',
  overlayLight:'rgba(10,10,10,0.2)',
}

export const Gradients = {
  // Swiss design: no gradients — these are kept for compatibility only
  luxury: [Colors.vendor, Colors.vendor],
  cyan:   [Colors.primary, Colors.primary],
  blue:   [Colors.primary, Colors.primary],
}

/** Returns a muted, professional color per service category */
export const getCategoryColor = (category?: string | null): string => {
  if (!category) return Colors.primary
  switch (category.toLowerCase()) {
    case 'banquet':
    case 'banquet_hall': return Colors.banquet
    case 'catering':     return Colors.catering
    case 'photo':
    case 'photographer':
    case 'photography':  return Colors.photo
    case 'parlor':
    case 'salon':
    case 'parlor_salon': return Colors.parlor
    default:             return Colors.primary
  }
}

export default function ThemeRouteStub() { return null }

// ── Spacing (8pt grid) ────────────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
}

// ── Typography ────────────────────────────────────────────────────
export const Typography = {
  sizes: {
    xs:   12,
    sm:   14,
    base: 16,
    lg:   18,
    xl:   20,
    xxl:  24,
    xxxl: 28,
    huge: 32,
  },
  weights: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
  },
}

// ── Border Radius — strict 4px max ────────────────────────────────
export const BorderRadius = {
  sm:   2,
  md:   4,
  lg:   4,
  xl:   4,
  xxl:  4,
  full: 4,
}

// ── Shadows — flat design, no visible shadows ─────────────────────
export const Shadows = {
  small: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  medium: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  large: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
}
