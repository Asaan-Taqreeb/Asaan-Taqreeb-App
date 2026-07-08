// Theme Constants for Asaan Taqreeb
// Luxury Event Planner — Deep Navy, Champagne Gold, Teal Accent

export const Colors = {
  // ─── Brand Colors ───────────────────────────────────────────────
  primary: '#111808',       // Green Waterloo — buttons, nav bar, headers
  primaryLight: '#263219',  // Softer Green Waterloo — hover, pressed states
  primaryDark: '#090C04',   // Darker Green Waterloo
  primaryMuted: '#EAE3D2',  // Warm cream-gray tint — chip backgrounds

  // ─── Secondary / Vendor ─────────────────────────────────────────
  vendor: '#111808',        
  vendorLight: '#263219',
  vendorAccent: '#D4AF37',  // Champagne Gold — vendor highlights

  // ─── Accent ─────────────────────────────────────────────────────
  accent: '#111808',        // CTA buttons
  accentLight: '#263219',
  accentMuted: '#FFF0BA',   // Colonial White

  // ─── Teal Accent ─────────────────────────────────────────────────
  teal: '#14B8A6',          // Available status, success, interactive
  tealLight: '#CCFBF1',     // Soft Teal background

  // ─── Background Colors ───────────────────────────────────────────
  background: '#F9F6F0',   // Soft Off-White / Cream
  white: '#FFFDF9',
  lightGray: '#F5EFE0',

  // ─── Text Colors ─────────────────────────────────────────────────
  textPrimary: '#111808',    // Green Waterloo — headlines
  textSecondary: '#2D3525',  // Darker Waterloo tone — body text
  textTertiary: '#6B7462',   // Muted Green Waterloo — captions
  textLight: '#FFF0BA',      // Colonial White text for dark BG

  // ─── Status Colors ────────────────────────────────────────────────
  success: '#14B8A6',        
  successLight: '#CCFBF1',
  warning: '#D4AF37',        
  warningLight: '#FBF5DC',
  error: '#EF4444',          
  errorLight: '#FEE2E2',
  info: '#14B8A6',           
  infoLight: '#CCFBF1',

  // ─── Category Colors ─────────────────────────────────────────────
  banquet: '#111808',        // Green Waterloo
  catering: '#D97706',       
  photo: '#4F46E5',          
  parlor: '#DB2777',         

  // ─── Rating ──────────────────────────────────────────────────────
  rating: '#D4AF37',         

  // ─── Border & Shadow ─────────────────────────────────────────────
  border: '#E5DEC9',
  borderDark: '#9E9783',
  shadow: '#111808',

  // ─── Overlay ─────────────────────────────────────────────────────
  overlay: 'rgba(17, 24, 8, 0.55)',
  overlayLight: 'rgba(17, 24, 8, 0.25)',
}

// Luxury Gradients
export const Gradients = {
  luxury: ['#111808', '#FFF0BA'],   // Green Waterloo → Colonial White
  gold: ['#BF953F', '#FCF6BA', '#B38728', '#FBF5B7', '#AA771C'],     // Metallic gold shimmer
  teal: ['#14B8A6', '#111808'],     // Teal → Waterloo
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
    case 'salon':
    case 'parlor_salon': return Colors.parlor
    default: return Colors.primary
  }
}

export default function ThemeRouteStub() {
  return null
}

// Spacing system (8pt grid)
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
  },
  // Font families (load via expo-google-fonts or @expo-google-fonts)
  fonts: {
    heading: 'Poppins',
    body: 'Inter',
  },
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
};

export const lightColors = {
  ...Colors,
  surface: '#FFF0BA',       // Colonial White primary container cards
  background: '#F9F6F0',    // Soft Off-White / Cream background canvas
  textPrimary: '#111808',   // Green Waterloo
  textSecondary: '#2D3525',
  textTertiary: '#6B7462',
  border: '#E5DEC9',
};

export const darkColors = {
  ...Colors,
  primary: '#FFF0BA',       // Colonial White typography & accents
  primaryLight: '#FFF5D1',
  primaryDark: '#E6D8A0',
  primaryMuted: '#223010',
  accent: '#FFF0BA',        // Colonial White for CTA buttons
  accentLight: '#FFF5D1',
  accentMuted: '#223010',
  background: '#111808',    // Green Waterloo background canvas
  surface: '#1D2612',       // Lighter forest-gray shade container cards
  white: '#1D2612',         // Cards are surface
  lightGray: '#263219',
  textPrimary: '#FFF0BA',   // Colonial White typography
  textSecondary: '#EAE3D2',
  textTertiary: '#9D9783',
  textLight: '#111808',     // Green Waterloo text on Colonial White buttons
  border: '#2E3A20',
  borderDark: '#556345',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

