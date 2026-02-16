import { View, Text, StyleSheet, Image, Pressable, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Star, MapPin, Users } from "lucide-react-native";
import { router } from "expo-router";
import MockData from "../Component/mockData/VendorsMockData"
import { Colors, Shadows, Spacing } from "@/app/constants/theme";

export default function FeaturedVendors() {
    const insets = useSafeAreaInsets()
    const mockData = MockData

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom}]}>
        <View className="mt-4">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <Text className="text-2xl font-bold" style={{color: Colors.textPrimary}}>Top Rated</Text>
            <Pressable className="active:opacity-70" onPress={() => router.push("/screens/client/Component/VendorListView")}>
              <Text className="text-base font-semibold" style={{color: Colors.primary}}>See All</Text>
            </Pressable>
          </View>
          <FlatList
            data={mockData}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl }}
            renderItem={({item}) => (
              <Pressable className="mb-4 active:opacity-80" onPress={() => router.push({
                pathname: "/screens/client/Component/DetailScreenPage",
                params: { vendor: JSON.stringify(item), category: item.key }
              })}>
                <View className="rounded-2xl p-4 flex-row items-center gap-3" style={[{backgroundColor: Colors.white}, Shadows.medium]}> 
                  <Image 
                    className="rounded-xl" 
                    source={{ uri: item.images[0] }}
                    accessibilityLabel={item.name} 
                    style={{ width: '35%', height: 140 }} 
                    resizeMode="cover" 
                  />
                  <View className="flex-col flex-1 justify-between h-full">
                    <View>
                      <Text className="text-lg font-extrabold mb-1" style={{color: Colors.textPrimary}} numberOfLines={1}>{item.name}</Text>
                      <View className="flex-row items-center mb-2">
                        <MapPin size={14} color={Colors.textSecondary} />
                        <Text className="text-sm font-medium ml-1 flex-1" style={{color: Colors.textSecondary}} numberOfLines={1}>{item.location}</Text>
                      </View>
                      {item.category === "banquet" && (
                        <View className="flex-row items-center mb-2">
                          <Users size={14} color={Colors.textSecondary} />
                          <Text className="text-sm font-medium ml-1" style={{color: Colors.textSecondary}}>{item.minGuests} - {item.maxGuests} Guests</Text>
                        </View>
                      )}
                      <View className="flex-row justify-between items-center mt-2">
                        <View className="flex-row items-center gap-1">
                          <Star size={14} fill={Colors.rating} color={Colors.rating} />
                          <Text className="text-sm font-bold" style={{color: Colors.rating}}>{item.rating}</Text>
                        </View>
                        <Text className="text-base font-extrabold" style={{color: Colors.primary}}>
                          PKR {item.category === "banquet" ? (item.price ?? 0).toLocaleString() : (item.packages?.[0]?.price ?? 0).toLocaleString()}
                        </Text>
                      </View>
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

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flex: 1,
    },
})
