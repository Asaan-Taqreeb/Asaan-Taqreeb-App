import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import CategoryData from "./mockData/CategoryData"

const CategoriesView = () => {
    const insets = useSafeAreaInsets()
    const mock = CategoryData
  return (
    <View style={[ styles.constainer, {paddingBottom: insets.bottom}]}>
      <Text className=' mt-2 text-2xl font-semibold p-2 mx-2'>Categories</Text>
      <View className='mt-5 flex-row justify-center items-center mx-2'>
        {
            mock.map(data => {
                const IconComponent = data.icon
                return (
                    <Pressable 
                        key={data.id}
                        onPress={() => router.push("/screens/client/Component/VendorListView")}
                        className='w-1/5 h-1/2 flex flex-col justify-center items-center active:opacity-20 '
                    >
                        <View className='px-3 py-3 rounded-xl' style={{backgroundColor: data.backColor}} >
                            <IconComponent size={25} color={data.color} />
                        </View>
                        <Text className='text-sm mt-2 font-medium text-[#64748B]' numberOfLines={1}>{data.title}</Text>
                    </Pressable>
            )})
        }
      </View>
    </View>
  )
}

export default CategoriesView

const styles = StyleSheet.create({
    constainer: {
        width: "100%",
        height: "18%",
        alignSelf: 'center'
    },
})