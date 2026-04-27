import { Sparkles, House, Utensils, Video, Scissors } from 'lucide-react-native'
import type { ServiceListItem } from '@/app/_utils/servicesApi'

export type ClientCategoryCard = {
  id: string
  icon: typeof Sparkles
  title: string
  key: 'all' | 'banquet' | 'catering' | 'photo' | 'parlor'
  color: string
  backColor: string
  count: number
}

const CATEGORY_META: Array<Omit<ClientCategoryCard, 'id' | 'count'>> = [
  {
    icon: Sparkles,
    title: 'All',
    key: 'all',
    color: 'white',
    backColor: 'black',
  },
  {
    icon: House,
    title: 'Banquets',
    key: 'banquet',
    color: '#8A2BE2',
    backColor: '#F3E5F5',
  },
  {
    icon: Utensils,
    title: 'Catering',
    key: 'catering',
    color: '#FF8C00',
    backColor: '#FFF3E0',
  },
  {
    icon: Video,
    title: 'Photo Shoot',
    key: 'photo',
    color: '#008B8B',
    backColor: '#E0F7FA',
  },
  {
    icon: Scissors,
    title: 'Parlor',
    key: 'parlor',
    color: '#E91E63',
    backColor: '#FCE4EC',
  },
]

export const buildClientCategoryCards = (services: ServiceListItem[]) => {
  const counts = services.reduce<Record<string, number>>((accumulator, service) => {
    accumulator[service.key] = (accumulator[service.key] || 0) + 1
    accumulator.all = (accumulator.all || 0) + 1
    return accumulator
  }, { all: 0 })

  return CATEGORY_META.map((meta, index) => ({
    ...meta,
    id: String(index + 1),
    count: counts[meta.key] || 0,
  }))
}
