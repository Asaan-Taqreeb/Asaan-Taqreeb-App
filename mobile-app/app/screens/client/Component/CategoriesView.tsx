import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { router } from 'expo-router'
import { buildClientCategoryCards } from './categoryConfig'
import { Colors, Spacing } from '@/app/_constants/theme'
import { getAllServices, type ServiceListItem } from '@/app/_utils/servicesApi'

const CategoriesView = () => {
    const [services, setServices] = useState<ServiceListItem[]>([])

    useEffect(() => {
      let mounted = true

      const loadServices = async () => {
        try {
          const data = await getAllServices()
          if (mounted) {
            setServices(data)
          }
        } catch {
          if (mounted) {
            setServices([])
          }
        }
      }

      loadServices()

      return () => {
        mounted = false
      }
    }, [])

    const categories = useMemo(() => buildClientCategoryCards(services), [services])
  return (
    <View style={styles.container}>
      <Text className='text-2xl font-bold px-4 mb-3' style={{color: Colors.textPrimary}}>Categories</Text>
      <View className='flex-row justify-evenly items-center px-2 flex-wrap'>
        {categories.map(data => {
          const IconComponent = data.icon

          return (
            <Pressable 
              key={data.id}
              onPress={() => router.push({
                pathname: "/screens/client/Component/VendorListView",
                params: data.key && data.key !== "all" ? { category: data.key } : undefined
              })}
              className='w-1/5 items-center mb-4 active:opacity-70'
            >
              <View className='p-3 rounded-xl items-center justify-center' style={{backgroundColor: data.backColor, minHeight: 60, minWidth: 60}}>
                <IconComponent size={28} color={data.color} />
              </View>
              <Text className='text-xs mt-2 font-medium text-center' style={{color: Colors.textSecondary}} numberOfLines={1}>{data.title}</Text>
              <Text className='text-[10px] mt-0.5 font-semibold text-center' style={{color: Colors.textTertiary}}>
                {data.count} live
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default CategoriesView

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
})