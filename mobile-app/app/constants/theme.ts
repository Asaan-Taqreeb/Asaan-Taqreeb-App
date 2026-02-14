// Theme Constants for Asaan Taqreeb
// Consistent color palette throughout the app

export const Colors = {
  // Primary Brand Color
  primary: '#4F46E5', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  
  // Category Colors
  banquet: '#4F46E5', // Indigo
  catering: '#FF8C00', // Orange
  photo: '#008B8B', // Teal
  parlor: '#E91E63', // Pink
  
  // Background Colors
  background: '#FAFAFA',
  white: '#FFFFFF',
  lightGray: '#F3F4F6',
  
  // Text Colors
  textPrimary: '#0A0A0A',
  textSecondary: '#64748B',
  textTertiary: '#9CA3AF',
  textLight: '#FAFAFA',
  
  // Status Colors
  success: '#16A34A',
  successLight: '#86EFAC',
  warning: '#D97706',
  warningLight: '#FCD34D',
  error: '#DC2626',
  errorLight: '#FCA5A5',
  info: '#2563EB',
  infoLight: '#93C5FD',
  
  // Rating
  rating: '#F97316', // Orange for stars
  
  // Border Colors
  border: '#E5E7EB',
  borderDark: '#9CA3AF',
  
  // Shadow Colors
  shadow: '#0A0A0A',
  
  // Overlay
  overlay: 'rgba(10, 10, 10, 0.5)',
  overlayLight: 'rgba(10, 10, 10, 0.3)',
}

// Category color helper
export const getCategoryColor = (category: string): string => {
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
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
}

// Shadow Styles
export const Shadows = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
}
