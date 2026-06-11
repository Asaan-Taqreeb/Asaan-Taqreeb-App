// Theme Constants for Asaan Taqreeb
// Luxury Event Planner — Deep Navy, Champagne Gold, Teal Accent

export const Colors = {
  // ─── Brand Colors ───────────────────────────────────────────────
  primary: '#0F172A',       // Deep Navy  — buttons, nav bar, headers
  primaryLight: '#1E293B',  // Navy Shade — hover, pressed states
  primaryDark: '#020617',   // Deep Midnight — extra emphasis
  primaryMuted: '#E8EBF0',  // Icy Navy Tint — chip backgrounds

  // ─── Secondary / Vendor (Champagne Gold) ────────────────────────
  vendor: '#0F172A',        // Deep Navy  (vendor portal primary)
  vendorLight: '#1E293B',
  vendorAccent: '#D4AF37',  // Champagne Gold — vendor highlights

  // ─── Accent (Champagne Gold) ────────────────────────────────────
  accent: '#D4AF37',        // Champagne Gold — CTAs, premium badges
  accentLight: '#EDD87A',   // Lighter Gold
  accentMuted: '#FBF5DC',   // Pale Gold Tint

  // ─── Teal Accent ─────────────────────────────────────────────────
  teal: '#14B8A6',          // Available status, success, interactive
  tealLight: '#CCFBF1',     // Soft Teal background

  // ─── Background Colors ───────────────────────────────────────────
  background: '#F8FAFC',   // Soft White — main app background
  white: '#FFFFFF',
  lightGray: '#F1F5F9',

  // ─── Text Colors ─────────────────────────────────────────────────
  textPrimary: '#0F172A',    // Deep Navy  — headlines
  textSecondary: '#1E293B',  // Dark Gray  — body text
  textTertiary: '#64748B',   // Medium Gray — captions, placeholders
  textLight: '#F8FAFC',

  // ─── Status Colors ────────────────────────────────────────────────
  success: '#14B8A6',        // Teal  → Available
  successLight: '#CCFBF1',
  warning: '#D4AF37',        // Gold  → Pending
  warningLight: '#FBF5DC',
  error: '#EF4444',          // Red   → Booked / Cancelled
  errorLight: '#FEE2E2',
  info: '#14B8A6',           // Teal  → info notifications
  infoLight: '#CCFBF1',

  // ─── Category Colors ─────────────────────────────────────────────
  banquet: '#0F172A',        // Deep Navy
  catering: '#D97706',       // Warm Amber
  photo: '#4F46E5',          // Royal Indigo
  parlor: '#DB2777',         // Bridal Pink

  // ─── Rating ──────────────────────────────────────────────────────
  rating: '#D4AF37',         // Gold star rating

  // ─── Border & Shadow ─────────────────────────────────────────────
  border: '#E2E8F0',
  borderDark: '#94A3B8',
  shadow: '#0F172A',

  // ─── Overlay ─────────────────────────────────────────────────────
  overlay: 'rgba(15, 23, 42, 0.55)',
  overlayLight: 'rgba(15, 23, 42, 0.25)',
}

// Luxury Gradients
export const Gradients = {
  luxury: ['#0F172A', '#D4AF37'],   // Navy → Champagne Gold (hero gradients)
  gold: ['#D4AF37', '#EDD87A'],     // Gold shimmer
  teal: ['#14B8A6', '#0F172A'],     // Teal → Navy (success / CTA)
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
}
