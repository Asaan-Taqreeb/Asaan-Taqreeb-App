import { View, Text, StyleSheet, Image, Pressable, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Star, MapPin, Users } from "lucide-react-native";
import { router } from "expo-router";
import MockData from "../Component/mockData/VendorsMockData"

export default function FeaturedVendors() {
    const insets = useSafeAreaInsets()
    const mockData = MockData

  return (
    <View style={[style.container, {paddingBottom: insets.bottom}]}>
        <View className="mt-2">
          <View className="flex-row justify-between item-center p-2">
            <Text className="mx-3 text-2xl font-medium mb-2">Top Rated</Text>
            <Pressable className="mr-3 active:opacity-50" onPress={() => router.push("/screens/client/Component/VendorListView")}>
              <Text className="text-lg text-[#4F46E5] font-medium">See All</Text>
            </Pressable>
          </View>
          <FlatList
            data={mockData}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
            renderItem={({item}) => (
              <Pressable className="mb-4 active:opacity-70" onPress={() => router.push({
                pathname: "/screens/client/Component/DetailScreenPage",
                params: { vendor: JSON.stringify(item), category: item.key }
              })}>
                <View className="bg-[#FFFFFF] w-full h-36 rounded-xl p-4 flex-row items-center gap-4" style={style.boxShadow}> 
                  <Image 
                    className="rounded-md" 
                    source={{ uri: item.images[0] }}
                    accessibilityLabel={item.name} 
                    style={{ width: '35%', height: '100%' }} 
                    resizeMode="cover" 
                  />
                  <View className="flex-col flex-1 justify-between">
                    <View>
                      <Text className="text-xl font-bold mb-1" numberOfLines={1}>{item.name}</Text>
                      <View className="flex-row items-center mb-2">
                        <MapPin size={14} color={"#64748B"} />
                        <Text className="text-base text-[#64748B] font-medium ml-1" numberOfLines={1}>{item.location}</Text>
                      </View>
                        {
                          item.category == "banquet" && <Text className="text-md font-medium mb-1"><Users size={13}  />  {item.minGuests} - {item.maxGuests} Guests</Text>
                        }
                      <View className="flex-row justify-between items-center ">
                        <View className="flex-row items-center gap-2">
                          <Star size={15} fill="#F97316" color="#F97316" />
                          <Text className="text-base font-medium text-[#F97316]">{item.rating}</Text>
                        </View>
                        {
                          item.category == "banquet" 
                            ? <Text className="text-lg font-bold text-[#4F46E5]">PKR {(item.price ?? 0).toLocaleString()}</Text>
                            : <Text className="text-lg font-bold text-[#4F46E5]">PKR {(item.packages?.[0]?.price ?? 0).toLocaleString()}</Text>
                        }
                      </View>
                    </View>
                    <View>
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
    },
    boxShadow: {
      shadowColor: "#0A0A0A",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
      elevation: 8, // For Android
    }
})
