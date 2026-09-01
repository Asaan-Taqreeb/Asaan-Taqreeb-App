import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Star, MapPin, Users, Sparkles, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Colors, Shadows, Spacing } from '@/app/_constants/theme';
import { getAllServices, ServiceListItem, getConciseAddress } from '@/app/_utils/servicesApi';
import { getCategoryColor } from '@/app/_constants/theme';
import { useLanguage } from '@/app/_context/LanguageContext';
import { useLocationContext } from '@/app/_context/LocationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [vendors, setVendors] = useState<ServiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geocodedCoords, setGeocodedCoords] = useState<
    Record<string, { latitude: number; longitude: number }>
  >({});
  const { t } = useLanguage();
  const { latitude: userLat, longitude: userLon } = useLocationContext();

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
        console.log('Failed to load geocode cache:', e);
      }
    };
    loadCache();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Get cached services first for instant display
        const cachedServices = await getAllServices(false);
        if (mounted && cachedServices.length > 0) {
          setVendors(cachedServices);
          setLoading(false);
        }

        // 2. Fetch fresh services in the background and update UI state
        const freshServices = await getAllServices(true);
        if (mounted) {
          setVendors(freshServices);
        }
      } catch (apiError: any) {
        if (mounted && vendors.length === 0) {
          setError(apiError?.message || t('loadingVendors'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      mounted = false;
    };
  }, []);

  const sortedVendors = useMemo(() => {
    if (userLat === undefined || userLon === undefined) {
      return [...vendors]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .map((v) => ({ ...v, distance: undefined }))
        .slice(0, 8);
    }

    return [...vendors]
      .map((vendor) => {
        let distance: number | undefined = undefined;
        const lat =
          vendor.latitude !== undefined && vendor.latitude !== null
            ? vendor.latitude
            : geocodedCoords[vendor.id]?.latitude;
        const lon =
          vendor.longitude !== undefined && vendor.longitude !== null
            ? vendor.longitude
            : geocodedCoords[vendor.id]?.longitude;

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
      .slice(0, 8);
  }, [vendors, userLat, userLon, geocodedCoords]);

  return (
    <View style={styles.container}>
      <View className="mt-4">
        <View className="flex-row justify-between items-center px-5 mb-4">
          <View>
            <Text className="text-xl font-extrabold" style={{ color: Colors.textPrimary }}>
              {userLat !== undefined && userLon !== undefined ? t('nearbyVendors') : t('topRated')}
            </Text>
            <Text className="text-xs font-medium mt-0.5" style={{ color: Colors.textTertiary }}>
              Top verified event partners in Karachi
            </Text>
          </View>
          <Pressable
            className="flex-row items-center gap-1 active:opacity-70 px-3 py-1.5 rounded-full bg-white border border-gray-100"
            style={Shadows.small}
            onPress={() => router.push('/screens/client/Component/VendorListView')}
          >
            <Text className="text-xs font-bold" style={{ color: Colors.primary }}>
              {t('seeAll')}
            </Text>
            <ChevronRight size={14} color={Colors.primary} />
          </Pressable>
        </View>

        {loading && vendors.length === 0 && (
          <View className="py-8 items-center justify-center">
            <Text className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
              {t('loadingVendors')}
            </Text>
          </View>
        )}

        {error && !loading && vendors.length === 0 && (
          <View className="py-8 px-5 items-center justify-center">
            <Text className="text-sm font-medium text-center" style={{ color: Colors.error }}>
              {error}
            </Text>
          </View>
        )}

        <View style={{ paddingHorizontal: 20, paddingBottom: Spacing.md }}>
          {sortedVendors.map((item, index) => {
            const catColor = getCategoryColor(item.key);
            const isNearest = index === 0 && item.distance !== undefined && item.distance <= 15;
            const startingPrice =
              item.category === 'banquet'
                ? item.price ?? 0
                : item.packages?.[0]?.price ?? item.price ?? 0;

            return (
              <Pressable
                key={item.id.toString()}
                className="mb-4 rounded-3xl bg-white border border-gray-100 overflow-hidden active:opacity-90"
                style={Shadows.medium}
                onPress={() =>
                  router.push({
                    pathname: '/screens/client/Component/DetailScreenPage',
                    params: {
                      vendor: encodeURIComponent(JSON.stringify(item)),
                      category: item.key,
                    },
                  })
                }
              >
                <View className="p-3.5 flex-row gap-3.5 items-center">
                  <View className="relative">
                    <Image
                      className="rounded-2xl"
                      source={{ uri: item.images[0] }}
                      accessibilityLabel={item.name}
                      style={{ width: 104, height: 114 }}
                      resizeMode="cover"
                    />
                    <View
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${catColor}EE` }}
                    >
                      <Text className="text-[9px] font-black text-white uppercase tracking-wider">
                        {item.key}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-col flex-1 justify-between py-0.5 min-h-[114px]">
                    <View>
                      {isNearest && (
                        <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 self-start mb-1">
                          <Sparkles size={10} color="#047857" />
                          <Text className="text-[9px] font-bold text-emerald-700">Nearest to you</Text>
                        </View>
                      )}

                      <View className="flex-row justify-between items-start mb-1">
                        <Text
                          className="text-base font-extrabold flex-1 mr-2"
                          style={{ color: Colors.textPrimary }}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        {item.rating && item.rating > 0 ? (
                          <View className="flex-row items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                            <Star size={11} fill={Colors.rating} color={Colors.rating} />
                            <Text className="text-[11px] font-black" style={{ color: '#B45309' }}>
                              {Number(item.rating).toFixed(1)}
                            </Text>
                          </View>
                        ) : (
                          <View className="bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200/60">
                            <Text className="text-[10px] font-semibold text-gray-500">
                              No reviews
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center mb-1 flex-wrap gap-1">
                        <MapPin size={12} color={Colors.textTertiary} />
                        <Text
                          className="text-xs font-semibold text-gray-500 flex-1"
                          numberOfLines={1}
                        >
                          {getConciseAddress(item.location)}
                        </Text>
                        {item.distance !== undefined && (
                          <View className="bg-gray-100 px-1.5 py-0.5 rounded">
                            <Text className="text-[10px] font-bold text-gray-600">
                              {item.distance.toFixed(1)} km
                            </Text>
                          </View>
                        )}
                      </View>

                      {item.category === 'banquet' && (
                        <View className="flex-row items-center mb-1">
                          <Users size={12} color={Colors.textTertiary} />
                          <Text className="text-xs font-semibold text-gray-500 ml-1">
                            {item.minGuests}-{item.maxGuests} {t('guests')}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row justify-between items-baseline pt-1.5 border-t border-gray-100">
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {t('startingFrom')}
                      </Text>
                      <Text className="text-sm font-black" style={{ color: Colors.primary }}>
                        PKR {startingPrice.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
  },
});
