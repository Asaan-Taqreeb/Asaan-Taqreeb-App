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
    '#06B6D4', // cyan (primary)
    '#DB2777', // pink
    '#D97706', // amber
    '#059669', // emerald
    '#2563EB', // blue
    '#7C3AED', // violet
    '#4338CA', // indigo
    '#0891B2', // cyan
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
