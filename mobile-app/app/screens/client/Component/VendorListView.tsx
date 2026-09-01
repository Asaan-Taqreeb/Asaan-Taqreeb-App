import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View , ActivityIndicator} from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, MapPin, Star, Users, ArrowUpDown, Map as MapIcon } from 'lucide-react-native'
import { router, useLocalSearchParams } from 'expo-router'
import SearchBar from './SearchBar'
import FilterComponent from './FilterComponent'
import { Colors, Shadows, Spacing, getCategoryColor } from '@/app/_constants/theme'
import { getAllServices, ServiceListItem, getConciseAddress } from '@/app/_utils/servicesApi'
import { getAllCategories, type Category } from '@/app/_utils/categoriesApi'
import { buildClientCategoryCards } from './_categoryConfig'
import GoogleMapView from '@/app/_components/GoogleMapView'

export default function VendorListView() {
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams<{ query?: string; category?: string; mapMode?: string }>()
  const [vendors, setVendors] = useState<ServiceListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

    const [query, setQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [filters, setFilters] = useState({ 
      location: "", 
      minPrice: "", 
      maxPrice: "",
      minRating: 0,
      minGuests: "",
      maxGuests: ""
    })
    const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'rating_desc'>('default')
    const [isMapView, setIsMapView] = useState(false)

    const activeFiltersCount = useMemo(() => {
      let count = 0
      if (filters.location) count++
      if (filters.minPrice) count++
      if (filters.maxPrice) count++
      if (filters.minRating > 0) count++
      if (filters.minGuests) count++
      if (filters.maxGuests) count++
      return count
    }, [filters])

    useEffect(() => {
      if (typeof params.query === "string") {
        setQuery(params.query)
      }

      if (typeof params.category === "string") {
        setSelectedCategory(params.category)
      }

      if (params.mapMode === 'true') {
        setIsMapView(true)
      }
    }, [params.query, params.category, params.mapMode])

    useEffect(() => {
      let mounted = true

      const loadData = async () => {
        try {
          setLoading(true)
          setError(null)
          const [services, cats] = await Promise.all([
            getAllServices(),
            getAllCategories(),
          ])
          if (mounted) {
            setVendors(services)
            setCategories(cats)
          }
        } catch (apiError: any) {
          if (mounted) {
            setError(apiError?.message || 'Failed to load services')
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }

      loadData()

      return () => {
        mounted = false
      }
    }, [])

    const categoryData = useMemo(() => buildClientCategoryCards(categories, vendors), [categories, vendors]);

    const matchCategory = (item: ServiceListItem, selectedCat: string) => {
      if (!selectedCat || selectedCat === 'all' || selectedCat === 'ALL') return true;

      const sel = String(selectedCat).toLowerCase().trim();
      const itemKey = String(item.key || '').toLowerCase().trim();
      const itemCat = String(item.category || '').toLowerCase().trim();

      if (itemKey === sel || itemCat === sel) return true;

      // Banquets
      if ((sel === 'banquet' || sel === 'banquets' || sel === 'banquet_hall') && 
          (itemKey.includes('banquet') || itemCat.includes('banquet') || itemCat.includes('hall'))) {
        return true;
      }

      // Catering
      if ((sel === 'catering' || sel === 'caterings') && 
          (itemKey.includes('cater') || itemCat.includes('cater'))) {
        return true;
      }

      // Photography
      if ((sel === 'photo' || sel === 'photographers' || sel === 'photography') && 
          (itemKey.includes('photo') || itemCat.includes('photo'))) {
        return true;
      }

      // Parlor / Women's Salon
      if ((sel === 'parlor' || sel === 'parlors' || sel === 'parlor_salon' || sel === 'bridal_salon') && 
          (itemKey.includes('parlor') || itemCat.includes('parlor') || (itemCat.includes('salon') && !itemCat.includes('men')))) {
        return true;
      }

      // Men's Salon
      if ((sel === 'salon_men' || sel === 'mens_salon' || sel === 'groom_salon') && 
          (itemKey.includes('men') || itemCat.includes('men'))) {
        return true;
      }

      // Rent a Car
      if ((sel === 'rent_car' || sel === 'car' || sel === 'rent_a_car') && 
          (itemKey.includes('car') || itemCat.includes('car'))) {
        return true;
      }

      // Decors
      if ((sel === 'decors' || sel === 'decor' || sel === 'decorations') && 
          (itemKey.includes('decor') || itemCat.includes('decor'))) {
        return true;
      }

      // Lighting / Stage
      if ((sel === 'stage_lighting' || sel === 'lighting' || sel === 'sound_stage') && 
          (itemKey.includes('light') || itemCat.includes('light') || itemKey.includes('stage') || itemCat.includes('stage'))) {
        return true;
      }

      return itemKey.includes(sel) || itemCat.includes(sel) || sel.includes(itemKey) || sel.includes(itemCat);
    };

    const filteredData = useMemo(() => {
      const normalizedQuery = query.trim().toLowerCase()
      const normalizedLocation = filters.location.trim().toLowerCase()
      const minPriceNumber = Number(filters.minPrice)
      const maxPriceNumber = Number(filters.maxPrice)
      const hasMinPrice = Number.isFinite(minPriceNumber) && minPriceNumber > 0
      const hasMaxPrice = Number.isFinite(maxPriceNumber) && maxPriceNumber > 0
      const minGuestsNumber = Number(filters.minGuests)
      const maxGuestsNumber = Number(filters.maxGuests)
      const hasMinGuests = Number.isFinite(minGuestsNumber) && minGuestsNumber > 0
      const hasMaxGuests = Number.isFinite(maxGuestsNumber) && maxGuestsNumber > 0

      return vendors.filter((item) => {
        const matchesCategory = matchCategory(item, selectedCategory)

        const matchesQuery = !normalizedQuery
          ? true
          : [item.name, item.location, item.category]
              .filter(Boolean)
              .some((field) => field.toLowerCase().includes(normalizedQuery))

        const matchesLocation = !normalizedLocation
          ? true
          : item.location.toLowerCase().includes(normalizedLocation)

        const itemPrice = (item.category === "banquet" 
          ? item.price 
          : item.packages?.[0]?.price || item.price) || 0

        const matchesMinPrice = hasMinPrice ? itemPrice >= minPriceNumber : true
        const matchesMaxPrice = hasMaxPrice ? itemPrice <= maxPriceNumber : true

        const matchesRating = filters.minRating > 0 ? (item.rating || 0) >= filters.minRating : true

        const matchesGuestCapacity = (() => {
          if (!item.minGuests || !item.maxGuests) return true
          if (hasMinGuests && item.maxGuests < minGuestsNumber) return false
          if (hasMaxGuests && item.minGuests > maxGuestsNumber) return false
          return true
        })()

        return matchesCategory && matchesQuery && matchesLocation && matchesMinPrice && matchesMaxPrice && matchesRating && matchesGuestCapacity
      }).sort((a, b) => {
        const aPrice = (a.category === "banquet" ? a.price : a.packages?.[0]?.price || a.price) || 0
        const bPrice = (b.category === "banquet" ? b.price : b.packages?.[0]?.price || b.price) || 0
        
        if (sortBy === 'price_asc') return aPrice - bPrice
        if (sortBy === 'price_desc') return bPrice - aPrice
        if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0)
        return 0
      })
    }, [vendors, query, selectedCategory, filters, sortBy])

    const availableLocations = useMemo(() => {
      const locs = new Set<string>()
      const plusCodeRegex = /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}/;
      const genericCodeRegex = /^[A-Z0-9]{4}_[A-Z0-9]{3}/;

      vendors.forEach(v => {
        if (v.location) {
          const concise = getConciseAddress(v.location)
          const area = concise.split(',')[0].trim()
          
          // Skip if it's still a code or too short
          if (plusCodeRegex.test(area) || genericCodeRegex.test(area) || area.length < 3) return;

          // Normalization logic
          let normalized = area
          if (normalized.toLowerCase().includes('malir')) normalized = 'Malir'
          if (normalized.toLowerCase().includes('gulshan')) normalized = 'Gulshan'
          if (normalized.toLowerCase().includes('nazimabad')) normalized = 'Nazimabad'
          if (normalized.toLowerCase().includes('clifton')) normalized = 'Clifton'
          if (normalized.toLowerCase().includes('dha')) normalized = 'DHA'
          if (normalized.toLowerCase().includes('bahria')) normalized = 'Bahria Town'
          
          if (normalized && normalized !== 'Location not set') {
            locs.add(normalized)
          }
        }
      })
      return Array.from(locs).sort()
    }, [vendors])

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View className='flex-row justify-between items-center gap-4 px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
          <View className='flex-row items-center gap-4 flex-1'>
            <Pressable className='rounded-full p-2 active:opacity-70' style={{backgroundColor: Colors.lightGray}} onPress={() => router.push("/screens/client/ClientHomeScreen")}>
              <ArrowLeft color={Colors.primary} size={24} />
            </Pressable>
            <Text className='text-lg font-bold flex-1' style={{color: Colors.textPrimary}} numberOfLines={1}>Browse Vendors</Text>
          </View>
          <View className='flex-row items-center gap-2'>
            <Pressable 
              className='p-2 rounded-xl flex-row items-center gap-1.5'
              style={{ backgroundColor: isMapView ? Colors.primary : Colors.white, borderWidth: 1, borderColor: isMapView ? Colors.primary : Colors.border }}
              onPress={() => setIsMapView(!isMapView)}
            >
              <MapIcon size={18} color={isMapView ? Colors.white : Colors.textSecondary} />
              <Text className='text-xs font-bold' style={{ color: isMapView ? Colors.white : Colors.textSecondary }}>Map</Text>
            </Pressable>

            <Pressable 
              className='p-2 rounded-xl flex-row items-center gap-1.5'
              style={{ backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border }}
              onPress={() => {
                const options = [
                  { text: 'Default', value: 'default' },
                  { text: 'Price: Low to High', value: 'price_asc' },
                  { text: 'Price: High to Low', value: 'price_desc' },
                  { text: 'Highest Rated', value: 'rating_desc' },
                ];
                Alert.alert(
                  'Sort By',
                  'Choose how you want to see the vendors',
                  options.map(opt => ({
                    text: opt.text,
                    onPress: () => setSortBy(opt.value as any)
                  }))
                );
              }}
            >
              <ArrowUpDown size={18} color={Colors.textSecondary} />
              <Text className='text-xs font-bold' style={{ color: Colors.textSecondary }}>Sort</Text>
            </Pressable>
            
            <View>
              <FilterComponent
                values={filters}
                onApply={setFilters}
                onReset={() => setFilters({ location: "", minPrice: "", maxPrice: "", minRating: 0, minGuests: "", maxGuests: "" })}
                locations={availableLocations}
              />
              {activeFiltersCount > 0 && (
                <View className='absolute -top-1 -right-1 rounded-full px-1.5 py-0.5' style={{backgroundColor: Colors.error, minWidth: 18}}>
                  <Text className='text-[10px] font-bold text-center' style={{color: Colors.white}}>{activeFiltersCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={{backgroundColor: Colors.white, paddingBottom: Spacing.md}}>
          <SearchBar value={query} onChange={setQuery} />
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <View className='flex-row items-center gap-2 px-5' style={{marginTop: Spacing.xs}}>
              {/* All Categories Option */}
              <Pressable
                className='flex-row items-center gap-2 px-4 py-2.5 rounded-xl active:opacity-70'
                style={{ 
                  backgroundColor: selectedCategory === "all" ? Colors.primary : Colors.white,
                  borderWidth: 1,
                  borderColor: selectedCategory === "all" ? Colors.primary : Colors.border
                }}
                onPress={() => setSelectedCategory("all")}
              >
                <Text className='text-sm font-semibold' style={{ color: selectedCategory === "all" ? Colors.white : Colors.textPrimary }}>All</Text>
              </Pressable>

              {categoryData.map((item) => {
                const isSelected = matchCategory({ key: item.key, category: item.key } as any, selectedCategory);
                return (
                  <Pressable
                    key={item.id} 
                    className='flex-row items-center gap-2 px-4 py-2.5 rounded-xl active:opacity-70'
                    style={{ 
                      backgroundColor: isSelected ? Colors.primary : Colors.white,
                      borderWidth: 1,
                      borderColor: isSelected ? Colors.primary : Colors.border
                    }}
                    onPress={() => setSelectedCategory(item.key)}
                  >
                    <item.icon size={16} color={isSelected ? Colors.white : Colors.textPrimary} />
                    <Text className='text-sm font-semibold' style={{ color: isSelected ? Colors.white : Colors.textPrimary }}>{item.title}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
        
        {!isMapView && (
          <FlatList
            className='flex-1'
            style={{marginTop: Spacing.sm}}
            data={filteredData}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl }}
            ListHeaderComponent={
              <>
                {loading && (
                  <View className='flex-1 justify-center items-center py-20'>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text className='text-sm font-bold mt-4' style={{color: Colors.textSecondary}}>Loading vendors...</Text>
                  </View>
                )}
                {error && !loading && (
                  <View className='px-5 py-4'>
                    <Text className='text-sm font-medium' style={{color: Colors.error}}>{error}</Text>
                  </View>
                )}
              </>
            }
            ListEmptyComponent={
              !loading && !error && filteredData.length === 0 ? (
                <View className='flex-1 items-center justify-center py-20'>
                  <Text className='text-lg font-bold mb-2' style={{color: Colors.textSecondary}}>No vendors found</Text>
                  <Text className='text-sm text-center px-8' style={{color: Colors.textTertiary}}>Try adjusting your filters or search criteria</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const catColor = getCategoryColor(item.key);
              const startingPrice =
                item.category === 'banquet'
                  ? item.price ?? 0
                  : item.packages?.[0]?.price ?? item.price ?? 0;

              return (
                <Pressable
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
                        </View>

                        {item.category === 'banquet' && (
                          <View className="flex-row items-center mb-1">
                            <Users size={12} color={Colors.textTertiary} />
                            <Text className="text-xs font-semibold text-gray-500 ml-1">
                              {item.minGuests}-{item.maxGuests} Guests
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-row justify-between items-baseline pt-1.5 border-t border-gray-100">
                        <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Starting From
                        </Text>
                        <Text className="text-sm font-black" style={{ color: Colors.primary }}>
                          PKR {startingPrice.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}

        {isMapView && (
          <View className='flex-1 mt-2'>
            {filteredData.length === 0 ? (
              <View className='flex-1 items-center justify-center'>
                <Text className='text-sm text-center' style={{color: Colors.textSecondary}}>No vendors found in this area.</Text>
              </View>
            ) : (
              <GoogleMapView
                latitude={(() => {
                  const first = filteredData[0];
                  if (!first) return 24.8607;
                  if (first.latitude) return first.latitude;
                  const id = String(first.id || first.serviceId || '');
                  let hash = 0;
                  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
                  const offset = (Math.abs(hash % 1000) / 1000 - 0.5) * 0.16;
                  return 24.8607 + offset;
                })()}
                longitude={(() => {
                  const first = filteredData[0];
                  if (!first) return 67.0011;
                  if (first.longitude) return first.longitude;
                  const id = String(first.id || first.serviceId || '');
                  let hash = 0;
                  for (let i = 0; i < id.length; i++) hash = (hash << 7) - hash + id.charCodeAt(i) * 31;
                  const offset = (Math.abs(hash % 1000) / 1000 - 0.5) * 0.16;
                  return 67.0011 + offset;
                })()}
                zoom={11}
                markers={filteredData.map(v => {
                  const lat = v.latitude ?? (() => {
                    const id = String(v.id || v.serviceId || '');
                    let hash = 0;
                    for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
                    const offset = (Math.abs(hash % 1000) / 1000 - 0.5) * 0.16;
                    return 24.8607 + offset;
                  })();
                  const lng = v.longitude ?? (() => {
                    const id = String(v.id || v.serviceId || '');
                    let hash = 0;
                    for (let i = 0; i < id.length; i++) hash = (hash << 7) - hash + id.charCodeAt(i) * 31;
                    const offset = (Math.abs(hash % 1000) / 1000 - 0.5) * 0.16;
                    return 67.0011 + offset;
                  })();
                  return {
                    id: v.id,
                    latitude: lat,
                    longitude: lng,
                    title: v.name,
                    price: (v.category === "banquet" ? v.price : v.packages?.[0]?.price || v.price) || 0,
                    rating: v.rating || 0,
                    category: v.category || v.key || "",
                  };
                })}
                onMarkerPress={(id) => {
                  const vendor = filteredData.find(v => v.id === id);
                  if (vendor) {
                    router.push({
                      pathname: "/screens/client/Component/DetailScreenPage",
                      params: { vendor: encodeURIComponent(JSON.stringify(vendor)), category: vendor.key }
                    });
                  }
                }}
              />
            )}
          </View>
        )}
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.background
    },
})