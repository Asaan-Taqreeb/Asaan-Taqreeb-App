import { Sparkles, House, Utensils, Video, Scissors, Car, Palette, Users } from 'lucide-react-native'
import type { ServiceListItem } from '@/app/_utils/servicesApi'
import type { Category } from '@/app/_utils/categoriesApi'

export type ClientCategoryCard = {
  id: string
  icon: typeof Sparkles
  title: string
  key: string
  color: string
  backColor: string
  count: number
}

// Map icon string names to actual icon components
const ICON_MAP: Record<string, typeof Sparkles> = {
  'Sparkles': Sparkles,
  'House': House,
  'Utensils': Utensils,
  'Video': Video,
  'Scissors': Scissors,
  'Car': Car,
  'Palette': Palette,
  'Users': Users,
}

export const getIconComponent = (iconName: string): typeof Sparkles => {
  return ICON_MAP[iconName] || Sparkles
}

export const buildClientCategoryCards = (categories: Category[], services: ServiceListItem[]) => {
  // Count services by key
  const counts = services.reduce<Record<string, number>>((accumulator, service) => {
    accumulator[service.key] = (accumulator[service.key] || 0) + 1
    accumulator.all = (accumulator.all || 0) + 1
    return accumulator
  }, { all: 0 })

  // Filter out 'all' and 'request_category' from the main list for now, we'll handle them separately
  const mainCategories = categories
    .filter(cat => cat.active && cat.key !== 'all' && cat.key !== 'request_category')
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return mainCategories.map((category, index) => ({
    id: String(index + 1),
    icon: getIconComponent(category.icon),
    title: category.name,
    key: category.key,
    color: category.color,
    backColor: category.backgroundColor,
    count: counts[category.key] || 0,
  }))
}

export default function CategoryConfigStub() {
  return null;
}
