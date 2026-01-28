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
    <View style={[ styles.constainer, { paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <Text className='text-2xl mx-3 font-semibold p-2'>Categories</Text>
      <View className='flex-row justify-center items-center p-5'>
        {
            mock.map(data => {
                const IconComponent = data.icon
                return (
                    <Pressable 
                        key={data.id}
                        onPress={() => router.push("/screens/client/ClientHomeScreen")}
                        className='w-1/5 h-1/2 flex flex-col justify-center items-center active:opacity-20'
                    >
                        <View className='px-4 py-4 rounded-xl' style={{backgroundColor: data.backColor}} >
                            <IconComponent size={25} color={data.color} />
                        </View>
                        <Text className='text-sm mt-2' numberOfLines={1}>{data.title}</Text>
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
        height: "20%",
    }
})