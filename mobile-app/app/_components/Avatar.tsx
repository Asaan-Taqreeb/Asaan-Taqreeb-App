import React from 'react'
import { View, Text } from 'react-native'

interface AvatarProps {
  name?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizeMap = {
  sm: { width: 32, height: 32, fontSize: 12 },
  md: { width: 48, height: 48, fontSize: 16 },
  lg: { width: 64, height: 64, fontSize: 24 },
}

const generateColorFromHash = (str: string): string => {
  const colors = [
    '#4F46E5', // indigo
    '#EC4899', // pink
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EF4444', // red
    '#06B6D4', // cyan
  ]

  if (!str) return colors[0]

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const Avatar: React.FC<AvatarProps> = ({ name = '?', size = 'md', color }) => {
  const dimension = sizeMap[size]
  const firstLetter = (name ?? '?').charAt(0).toUpperCase()
  const backgroundColor = color || generateColorFromHash(name ?? '')

  console.log('Avatar component - name:', name, 'firstLetter:', firstLetter)

  return (
    <View
      style={{
        width: dimension.width,
        height: dimension.height,
        borderRadius: dimension.width / 2,
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: dimension.fontSize,
          fontWeight: 'bold',
          color: '#FFFFFF',
        }}
      >
        {firstLetter}
      </Text>
    </View>
  )
}

export default Avatar
