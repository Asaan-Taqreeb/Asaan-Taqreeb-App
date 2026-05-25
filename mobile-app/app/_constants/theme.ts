// Theme Constants for Asaan Taqreeb
// Professional color palette — Primary (Electric Cyan), Vendor (Midnight Slate), Accent (Electric Blue)

export const Colors = {
  // Brand Colors (Modern Luxe)
  primary: '#06B6D4',      // Electric Cyan
  primaryLight: '#22D3EE',
  primaryDark: '#0891B2',
  primaryMuted: '#ECFEFF',

  // Secondary / Vendor (Midnight Slate)
  vendor: '#0F172A',
  vendorLight: '#1E293B',
  vendorAccent: '#334155',

  // Accent (Warm Gold)
  accent: '#2563EB',
  accentLight: '#60A5FA',
  accentMuted: '#EFF6FF',

  // Background Colors
  background: '#F8FAFC',   // Cloud White
  white: '#FFFFFF',
  lightGray: '#F1F5F9',

  // Text Colors
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textLight: '#F8FAFC',

  // Status Colors
  success: '#14B8A6',      // Teal Mint
  successLight: '#CCFBF1',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Category Colors
  banquet: '#0F172A',
  catering: '#06B6D4',
  photo: '#2563EB',
  parlor: '#14B8A6',

  // Rating
  rating: '#F59E0B',

  // Border Colors
  border: '#E2E8F0',
  borderDark: '#94A3B8',

  // Shadow Colors
  shadow: '#0F172A',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.25)',
}

// Urban Luxe Gradients
export const Gradients = {
  luxury: ['#0F172A', '#2563EB'],
  cyan: ['#06B6D4', '#22D3EE'],
  blue: ['#2563EB', '#60A5FA'],
}

// Category color helper
export const getCategoryColor = (category?: string | null): string => {
  if (!category) return Colors.primary
  switch(category.toLowerCase()) {
    case 'banquet': return Colors.banquet
    case 'catering': return Colors.catering
    case 'photo': 
    case 'photographer':
    case 'photography': return Colors.photo
    case 'parlor':
    case 'salon': return Colors.parlor
    default: return Colors.primary
  }
}

export default function ThemeRouteStub() {
  return null
}

// Spacing system (following 8pt grid system)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

// Typography
export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  }
}

// Border Radius
export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  full: 9999,
}

// Shadow Styles
export const Shadows = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
}
