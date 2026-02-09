import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Sparkles, House, Utensils, Video, Scissors } from 'lucide-react-native'
import { router } from 'expo-router'

const CategoriesView = () => {
    const insets = useSafeAreaInsets()
    const mock = [
    {
        id: 1,
        icon: Sparkles,
        title: "All",
        color: "white",
        backColor: "black"
    },
    {
        id: 2,
        icon: House,
        title: "Banquets",
        color: "#8A2BE2",
        backColor: "#F3E5F5"
    },
    {
        id: 3,
        icon: Utensils,
        title: "Catering",
        color: "#FF8C00",
        backColor: "#FFF3E0"
    },
    {
        id: 4,
        icon: Video,
        title: "Photo Shoot",
        color: "#008B8B",
        backColor: "#E0F7FA"
    },
    {
        id: 5,
        icon: Scissors,
        title: "Parlor",
        color: "#E91E63",
        backColor: "#FCE4EC"
    }
    
]
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
                        onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}
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