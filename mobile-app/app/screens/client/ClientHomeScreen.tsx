import { View, Text, StyleSheet, Image, Pressable, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "./Component/Header";
import CategoriesView from "./Component/CategoriesView";
import { Star, MapPin, Users } from "lucide-react-native";
import { router } from "expo-router";
import MockData from "./Component/mockData/VendorsMockData"

export default function ClientHomeScreen() {
    const insets = useSafeAreaInsets()
    const mockData = MockData

  return (
    <View style={[style.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <Header />
      <CategoriesView />
      <View className="mt-5">
        <View className="flex-row justify-between item-center p-2">
          <Text className="mx-3 text-2xl font-semibold">Featured Vendors</Text>
          <Pressable className="mr-3 active:opacity-50" onPress={() => router.push("/screens/client/ClientHomeScreen")}>
            <Text className="text-lg text-[#3B3F91] font-medium">See All</Text>
          </Pressable>
        </View>
        <FlatList
          data={mockData}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({item}) => (
            <Pressable className="mr-4 active:opacity-70" onPress={() => router.push("/screens/client/ClientHomeScreen")}>
              <View className="bg-gray-100 w-80 h-3/5 rounded-xl p-4" style={style.boxShadow}> 
                <View className="w-full h-40 mb-3">
                  <Image 
                    className="rounded-md" 
                    source={{ uri: item.imageUrl }}
                    accessibilityLabel={item.title} 
                    style={{ width: '100%', height: '100%' }} 
                    resizeMode="cover" 
                  />
                </View>
                <View className="flex-col">
                  <Text className="text-xl font-bold mb-1">{item.title}</Text>
                  <View className="flex-row items-center mb-1">
                    <MapPin size={14} color={"#3B3F91"} />
                    <Text className="text-sm text-[#3B3F91] font-medium ml-1" numberOfLines={1}>{item.location}</Text>
                  </View>
                  {
                    item.category == "banquet" && <Text className="text-base font-medium"><Users size={15} />  {item.capacity}</Text>
                  }
                  {
                    item.category == "catering" ? <Text className="text-base font-semibold mb-1">PKR {item.budget.toLocaleString()}/head</Text> : <Text className="text-base font-semibold mb-1">PKR {item.budget.toLocaleString()}</Text>
                  }
                  <View className="flex-row items-center">
                    <Star size={14} fill="#FFD700" color="#FFD700" />
                    <Text className="text-sm font-medium ml-1">{item.rating}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    </View>
  )
}

const style = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "#F7F6F2"
    },
    boxShadow: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 8, // For Android
    }
})
