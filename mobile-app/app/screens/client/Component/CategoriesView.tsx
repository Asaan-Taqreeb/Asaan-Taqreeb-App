import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import CategoryData from "./mockData/CategoryData"
import { Colors, Spacing } from '@/app/constants/theme'

const CategoriesView = () => {
    const insets = useSafeAreaInsets()
    const mock = CategoryData
  return (
    <View style={[styles.container, {paddingBottom: insets.bottom}]}>
      <Text className='text-2xl font-bold px-4 mb-4' style={{color: Colors.textPrimary}}>Categories</Text>
      <View className='flex-row justify-evenly items-center px-2 flex-wrap'>
        {
            mock.map(data => {
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
                        <View className='p-3 rounded-xl items-center justify-center' style={{backgroundColor: data.backColor, minHeight: 60, minWidth: 60}} >
                            <IconComponent size={28} color={data.color} />
                        </View>
                        <Text className='text-xs mt-2 font-medium text-center' style={{color: Colors.textSecondary}} numberOfLines={1}>{data.title}</Text>
                    </Pressable>
            )})
        }
      </View>
    </View>
  )
}

export default CategoriesView

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingVertical: Spacing.xl,
    },
})