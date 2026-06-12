import { View, Text, StyleSheet, Image, Pressable, FlatList } from "react-native";
import { Star, MapPin, Users } from "lucide-react-native";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Colors, Shadows, Spacing } from "@/app/_constants/theme";
import { getAllServices, ServiceListItem, getConciseAddress } from '@/app/_utils/servicesApi'
import { getCategoryColor } from '@/app/_constants/theme'
import { useLanguage } from '@/app/_context/LanguageContext'
import useLocation from "./hooks/useLocation";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FeaturedVendorListItem = ServiceListItem & {
  distance?: number;
};

const GEOCODE_CACHE_KEY = '@vendor_geocode_cache';
const GEOCODE_CACHE: Record<string, { latitude: number; longitude: number }> = {};

// Haversine formula to calculate distance in kilometers
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function FeaturedVendors() {
  const [vendors, setVendors] = useState<ServiceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [geocodedCoords, setGeocodedCoords] = useState<Record<string, { latitude: number; longitude: number }>>({})
  const { t } = useLanguage()
  const { latitude: userLat, longitude: userLon } = useLocation()

  // Load geocode cache from AsyncStorage on mount
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(GEOCODE_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          Object.assign(GEOCODE_CACHE, parsed);
          setGeocodedCoords({ ...GEOCODE_CACHE });
        }
      } catch (e) {
        console.log("Failed to load geocode cache:", e);
      }
    };
    loadCache();
  }, []);

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
          setError(apiError?.message || t('loadingVendors'))
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

  // Geocode any vendors that do not have coordinates from the backend
  useEffect(() => {
    let active = true

    const geocodeAll = async () => {
      let cacheUpdated = false
      const newCoords: Record<string, { latitude: number; longitude: number }> = {}

      for (const vendor of vendors) {
        const hasLat = vendor.latitude !== undefined && vendor.latitude !== null
        const hasLon = vendor.longitude !== undefined && vendor.longitude !== null
        
        if (!hasLat || !hasLon) {
          // If already in memory cache, use it immediately
          if (GEOCODE_CACHE[vendor.id]) {
            newCoords[vendor.id] = GEOCODE_CACHE[vendor.id]
            continue
          }

          if (vendor.location && vendor.location !== 'Location not set') {
            try {
              const results = await Location.geocodeAsync(vendor.location)
              if (results && results.length > 0) {
                const coord = {
                  latitude: results[0].latitude,
                  longitude: results[0].longitude
                }
                newCoords[vendor.id] = coord
                GEOCODE_CACHE[vendor.id] = coord
                cacheUpdated = true
                console.log(`Geocoded vendor "${vendor.name}" (${vendor.location}) to:`, coord.latitude, coord.longitude)
              }
            } catch (e) {
              console.log(`Failed to geocode address "${vendor.location}":`, e)
            }
          }
        }
      }

      if (active && Object.keys(newCoords).length > 0) {
        setGeocodedCoords(prev => ({ ...prev, ...newCoords }))
        if (cacheUpdated) {
          try {
            await AsyncStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(GEOCODE_CACHE))
          } catch (e) {
            console.log("Failed to save geocode cache:", e)
          }
        }
      }
    }

    if (vendors.length > 0) {
      geocodeAll()
    }

    return () => {
      active = false
    }
  }, [vendors])

  const sortedVendors = useMemo(() => {
    if (userLat === undefined || userLon === undefined) {
      return [...vendors]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .map(v => ({ ...v, distance: undefined }))
        .slice(0, 6);
    }

    return [...vendors]
      .map(vendor => {
        let distance: number | undefined = undefined;
        const lat = (vendor.latitude !== undefined && vendor.latitude !== null) ? vendor.latitude : geocodedCoords[vendor.id]?.latitude;
        const lon = (vendor.longitude !== undefined && vendor.longitude !== null) ? vendor.longitude : geocodedCoords[vendor.id]?.longitude;

        if (lat !== undefined && lon !== undefined) {
          distance = calculateDistance(userLat, userLon, lat, lon);
        }
        return { ...vendor, distance } as FeaturedVendorListItem;
      })
      .sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, 6);
  }, [vendors, userLat, userLon, geocodedCoords]);

  return (
    <View style={styles.container}>
        <View className="mt-2">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <Text className="text-lg font-bold" style={{color: Colors.textPrimary}}>
              {userLat !== undefined && userLon !== undefined ? t('nearbyVendors') : t('topRated')}
            </Text>
            <Pressable className="active:opacity-70" onPress={() => router.push("/screens/client/Component/VendorListView")}>
              <Text className="text-sm font-semibold" style={{color: Colors.primary}}>{t('seeAll')}</Text>
            </Pressable>
          </View>
          {loading && (
            <Text className="px-4 py-2 text-sm" style={{color: Colors.textSecondary}}>{t('loadingVendors')}</Text>
          )}
          {error && !loading && (
            <Text className="px-4 py-2 text-sm" style={{color: Colors.error}}>{error}</Text>
          )}
          <FlatList
            data={sortedVendors}
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
                        <Text className="text-xs font-bold ml-1 flex-1" style={{color: Colors.textSecondary}} numberOfLines={1}>
                          {getConciseAddress(item.location)}
                          {item.distance !== undefined && ` • ${item.distance.toFixed(1)} km`}
                        </Text>
                      </View>

                      {item.category === "banquet" && (
                        <View className="flex-row items-center mb-1.5">
                          <Users size={12} color={Colors.textTertiary} />
                          <Text className="text-xs font-bold ml-1" style={{color: Colors.textSecondary}}>{item.minGuests}-{item.maxGuests} {t('guests')}</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row justify-between items-center mt-auto">
                      <View className="bg-gray-50 px-2 py-1 rounded-lg">
                        <Text className="text-[10px] font-black uppercase tracking-widest" style={{color: Colors.textTertiary}}>{t('startingFrom')}</Text>
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
