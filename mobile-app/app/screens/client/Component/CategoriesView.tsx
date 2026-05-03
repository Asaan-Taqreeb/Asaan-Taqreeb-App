import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { router } from 'expo-router'
import { buildClientCategoryCards } from './categoryConfig'
import { Colors, Spacing, Shadows } from '@/app/_constants/theme'
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
      <Text className='text-lg font-bold px-4 mb-3' style={{color: Colors.textPrimary}}>Categories</Text>
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
              <View 
                className='p-3 rounded-2xl items-center justify-center' 
                style={[
                  {
                    backgroundColor: data.backColor, 
                    minHeight: 64, 
                    minWidth: 64,
                    borderWidth: 1,
                    borderColor: data.color + '30',
                  },
                  Shadows.small
                ]}
              >
                <IconComponent size={28} color={data.color} />
              </View>
              <Text className='text-[11px] mt-2 font-bold text-center' style={{color: Colors.textPrimary}} numberOfLines={1}>{data.title}</Text>
              <View className="bg-white px-2 py-0.5 rounded-full mt-1 border border-gray-100">
                <Text className='text-[8px] font-black uppercase tracking-widest text-center' style={{color: Colors.textTertiary}}>
                  {data.count} Live
                </Text>
              </View>
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
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
})