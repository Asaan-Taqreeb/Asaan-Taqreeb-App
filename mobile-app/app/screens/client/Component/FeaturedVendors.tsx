import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { Star, MapPin, Users, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Colors, Shadows, Spacing } from '@/app/_constants/theme';
import { getAllServices, ServiceListItem, getConciseAddress } from '@/app/_utils/servicesApi';
import { getCategoryColor } from '@/app/_constants/theme';
import { useLanguage } from '@/app/_context/LanguageContext';

export default function FeaturedVendors() {
  const [vendors, setVendors] = useState<ServiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

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

        // 2. Fetch fresh services in the background
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

  // Filter vendors into clean category groups
  const topRatedVendors = useMemo(() => {
    return [...vendors]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);
  }, [vendors]);

  const banquetVendors = useMemo(() => {
    return vendors.filter((v) => {
      const k = String(v.key || '').toLowerCase();
      const c = String(v.category || '').toLowerCase();
      return k.includes('banquet') || c.includes('banquet') || c.includes('hall');
    });
  }, [vendors]);

  const cateringVendors = useMemo(() => {
    return vendors.filter((v) => {
      const k = String(v.key || '').toLowerCase();
      const c = String(v.category || '').toLowerCase();
      return k.includes('cater') || c.includes('cater');
    });
  }, [vendors]);

  const photoVendors = useMemo(() => {
    return vendors.filter((v) => {
      const k = String(v.key || '').toLowerCase();
      const c = String(v.category || '').toLowerCase();
      return k.includes('photo') || c.includes('photo');
    });
  }, [vendors]);

  const salonVendors = useMemo(() => {
    return vendors.filter((v) => {
      const k = String(v.key || '').toLowerCase();
      const c = String(v.category || '').toLowerCase();
      return k.includes('parlor') || k.includes('salon') || c.includes('salon') || c.includes('parlor');
    });
  }, [vendors]);

  const renderHorizontalVendorSection = (
    title: string,
    subtitle: string,
    items: ServiceListItem[],
    categoryFilter?: string
  ) => {
    if (items.length === 0) return null;

    return (
      <View className="mb-6">
        <View className="flex-row justify-between items-center px-5 mb-3">
          <View>
            <Text className="text-lg font-extrabold" style={{ color: Colors.textPrimary }}>
              {title}
            </Text>
            <Text className="text-xs font-medium text-gray-400 mt-0.5">{subtitle}</Text>
          </View>
          <Pressable
            className="flex-row items-center gap-1 active:opacity-70 px-3 py-1.5 rounded-full bg-white border border-gray-100"
            style={Shadows.small}
            onPress={() =>
              router.push({
                pathname: '/screens/client/Component/VendorListView',
                params: categoryFilter ? { category: categoryFilter } : undefined,
              })
            }
          >
            <Text className="text-xs font-bold" style={{ color: Colors.primary }}>
              {t('seeAll')}
            </Text>
            <ChevronRight size={14} color={Colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
        >
          {items.map((item) => {
            const catColor = getCategoryColor(item.key);
            const startingPrice =
              item.category === 'banquet'
                ? item.price ?? 0
                : item.packages?.[0]?.price ?? item.price ?? 0;

            return (
              <Pressable
                key={item.id.toString()}
                className="rounded-3xl bg-white border border-gray-100 overflow-hidden active:opacity-90"
                style={[{ width: 250 }, Shadows.medium]}
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
                {/* Photo & Category Badge */}
                <View className="relative">
                  <Image
                    source={{ uri: item.images[0] }}
                    accessibilityLabel={item.name}
                    style={{ width: 250, height: 135 }}
                    resizeMode="cover"
                  />
                  <View
                    className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${catColor}F0` }}
                  >
                    <Text className="text-[10px] font-black text-white uppercase tracking-wider">
                      {item.key}
                    </Text>
                  </View>

                  {/* Rating Badge */}
                  <View className="absolute bottom-2.5 right-2.5">
                    {item.rating && item.rating > 0 ? (
                      <View className="flex-row items-center gap-1 bg-white/95 px-2 py-0.5 rounded-full shadow-sm">
                        <Star size={11} fill={Colors.rating} color={Colors.rating} />
                        <Text className="text-[11px] font-extrabold text-amber-800">
                          {Number(item.rating).toFixed(1)}
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-white/95 px-2 py-0.5 rounded-full shadow-sm">
                        <Text className="text-[10px] font-bold text-gray-500">No reviews</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Info Card */}
                <View className="p-3.5 flex-col justify-between" style={{ minHeight: 110 }}>
                  <View>
                    <Text
                      className="text-base font-extrabold"
                      style={{ color: Colors.textPrimary }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>

                    <View className="flex-row items-center mt-1">
                      <MapPin size={12} color={Colors.textTertiary} />
                      <Text
                        className="text-xs font-semibold text-gray-500 ml-1 flex-1"
                        numberOfLines={1}
                      >
                        {getConciseAddress(item.location)}
                      </Text>
                    </View>

                    {item.category === 'banquet' && (
                      <View className="flex-row items-center mt-1">
                        <Users size={12} color={Colors.textTertiary} />
                        <Text className="text-xs font-semibold text-gray-500 ml-1">
                          {item.minGuests}-{item.maxGuests} {t('guests')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row justify-between items-baseline pt-2 mt-2 border-t border-gray-100">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {t('startingFrom')}
                    </Text>
                    <Text className="text-sm font-black" style={{ color: Colors.primary }}>
                      PKR {startingPrice.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && vendors.length === 0 && (
        <View className="py-10 items-center justify-center">
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

      {/* 1. Featured & Top Rated Carousel */}
      {renderHorizontalVendorSection(
        t('topRated'),
        'Top verified event partners in Karachi',
        topRatedVendors
      )}

      {/* 2. Banquets Section Carousel */}
      {renderHorizontalVendorSection(
        'Venues & Wedding Banquets',
        'Luxury halls, open marquees & lawns',
        banquetVendors,
        'banquets'
      )}

      {/* 3. Catering Section Carousel */}
      {renderHorizontalVendorSection(
        'Catering & Master Chefs',
        'Authentic Biryani, BBQ & dynamic menu feasts',
        cateringVendors,
        'caterings'
      )}

      {/* 4. Photography Section Carousel */}
      {renderHorizontalVendorSection(
        'Photography & Cinematic Films',
        'Bridal shoots, event coverage & drone videography',
        photoVendors,
        'photographers'
      )}

      {/* 5. Salons & Beauty Section Carousel */}
      {renderHorizontalVendorSection(
        'Bridal Makeup & Groom Salons',
        'Signature bridal makeup, styling & grooming',
        salonVendors,
        'parlor'
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: Spacing.sm,
  },
});
