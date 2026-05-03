import { View, Text, StyleSheet, Image, Pressable, FlatList } from "react-native";
import { Star, MapPin, Users } from "lucide-react-native";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Colors, Shadows, Spacing } from "@/app/_constants/theme";
import { getAllServices, ServiceListItem } from '@/app/_utils/servicesApi'
import { getCategoryColor } from '@/app/_constants/theme'

export default function FeaturedVendors() {
    const [vendors, setVendors] = useState<ServiceListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      let mounted = true

      const loadServices = async () => {
        try {
          setLoading(true)
          setError(null)
          const services = await getAllServices()
          if (mounted) {
            setVendors(services)
          }
        } catch (apiError: any) {
          if (mounted) {
            setError(apiError?.message || 'Failed to load vendors')
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }

      loadServices()

      return () => {
        mounted = false
      }
    }, [])

    const topRatedVendors = useMemo(
      () => [...vendors].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6),
      [vendors]
    )

  return (
    <View style={styles.container}>
        <View className="mt-2">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <Text className="text-lg font-bold" style={{color: Colors.textPrimary}}>Top Rated</Text>
            <Pressable className="active:opacity-70" onPress={() => router.push("/screens/client/Component/VendorListView")}>
              <Text className="text-sm font-semibold" style={{color: Colors.primary}}>See All</Text>
            </Pressable>
          </View>
          {loading && (
            <Text className="px-4 py-2 text-sm" style={{color: Colors.textSecondary}}>Loading vendors...</Text>
          )}
          {error && !loading && (
            <Text className="px-4 py-2 text-sm" style={{color: Colors.error}}>{error}</Text>
          )}
          <FlatList
            data={topRatedVendors}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}
            renderItem={({item}) => {
              const catColor = getCategoryColor(item.key)
              return (
              <Pressable className="mb-4 active:opacity-90" onPress={() => router.push({
                pathname: "/screens/client/Component/DetailScreenPage",
                params: { vendor: JSON.stringify(item), category: item.key }
              })}>
                <View 
                  className="rounded-3xl p-4 flex-row items-center gap-4" 
                  style={[
                    {backgroundColor: Colors.white, borderLeftWidth: 6, borderLeftColor: catColor}, 
                    Shadows.medium
                  ]}
                > 
                  <Image 
                    className="rounded-2xl" 
                    source={{ uri: item.images[0] }}
                    accessibilityLabel={item.name} 
                    style={{ width: 100, height: 110 }} 
                    resizeMode="cover"

                  />
                  <View className="flex-col flex-1 justify-between py-1">
                    <View>
                      <View className="flex-row justify-between items-start mb-1">
                        <Text className="text-base font-black flex-1 mr-2" style={{color: Colors.textPrimary}} numberOfLines={1}>{item.name}</Text>
                        <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                          <Star size={10} fill={Colors.rating} color={Colors.rating} />
                          <Text className="text-[10px] font-black" style={{color: Colors.rating}}>{item.rating}</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center mb-1.5">
                        <MapPin size={12} color={Colors.textTertiary} />
                        <Text className="text-xs font-bold ml-1 flex-1" style={{color: Colors.textSecondary}} numberOfLines={1}>{item.location}</Text>
                      </View>

                      {item.category === "banquet" && (
                        <View className="flex-row items-center mb-1.5">
                          <Users size={12} color={Colors.textTertiary} />
                          <Text className="text-xs font-bold ml-1" style={{color: Colors.textSecondary}}>{item.minGuests}-{item.maxGuests} Guests</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row justify-between items-center mt-auto">
                      <View className="bg-gray-50 px-2 py-1 rounded-lg">
                        <Text className="text-[10px] font-black uppercase tracking-widest" style={{color: Colors.textTertiary}}>Starting From</Text>
                      </View>
                      <Text className="text-base font-black" style={{color: Colors.primary}}>
                        PKR {item.category === "banquet" ? (item.price ?? 0).toLocaleString() : (item.packages?.[0]?.price ?? 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            )}}
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
