import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, MapPin, Star, Users, ArrowUpDown } from 'lucide-react-native'
import { router, useLocalSearchParams } from 'expo-router'
import SearchBar from './SearchBar'
import FilterComponent from './FilterComponent'
import { Colors, Shadows, Spacing, getCategoryColor } from '@/app/_constants/theme'
import { getAllServices, ServiceListItem } from '@/app/_utils/servicesApi'
import { buildClientCategoryCards } from './categoryConfig'

export default function VendorListView() {
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams<{ query?: string; category?: string }>()
  const [vendors, setVendors] = useState<ServiceListItem[]>([])
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
    }, [params.query, params.category])

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
            setError(apiError?.message || 'Failed to load services')
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

    const categoryData = useMemo(() => buildClientCategoryCards(vendors), [vendors])

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
        const matchesCategory =
          selectedCategory === "all" || item.key === selectedCategory

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

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View className='flex-row justify-between items-center gap-4 px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
          <View className='flex-row items-center gap-4 flex-1'>
            <Pressable className='rounded-full p-2 active:opacity-70' style={{backgroundColor: Colors.lightGray}} onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}>
              <ArrowLeft color={Colors.primary} size={24} />
            </Pressable>
            <Text className='text-lg font-bold flex-1' style={{color: Colors.textPrimary}} numberOfLines={1}>Browse Vendors</Text>
          </View>
          <View className='flex-row items-center gap-2'>
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
              {categoryData.map((item) => (
                <Pressable
                  key={item.id} 
                  className='flex-row items-center gap-2 px-4 py-2.5 rounded-xl active:opacity-70'
                  style={{ 
                    backgroundColor: selectedCategory === item.key ? Colors.primary : Colors.white,
                    borderWidth: 1,
                    borderColor: selectedCategory === item.key ? Colors.primary : Colors.border
                  }}
                  onPress={() => setSelectedCategory(item.key || "all")}
                >
                  <item.icon size={16} color={selectedCategory === item.key ? Colors.white : Colors.textPrimary} />
                  <Text className='text-sm font-semibold' style={{ color: selectedCategory === item.key ? Colors.white : Colors.textPrimary }}>{item.title}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
        <ScrollView className='flex-1' style={{marginTop: Spacing.sm}}>
          {loading && (
            <View className='px-5 py-4'>
              <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>Loading vendors...</Text>
            </View>
          )}
          {error && !loading && (
            <View className='px-5 py-4'>
              <Text className='text-sm font-medium' style={{color: Colors.error}}>{error}</Text>
            </View>
          )}
          {filteredData.length === 0 ? (
            <View className='flex-1 items-center justify-center py-20'>
              <Text className='text-lg font-bold mb-2' style={{color: Colors.textSecondary}}>No vendors found</Text>
              <Text className='text-sm text-center px-8' style={{color: Colors.textTertiary}}>Try adjusting your filters or search criteria</Text>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl }}
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
          )}
        </ScrollView>
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