import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, MapPin, Star, Users } from 'lucide-react-native'
import MockData from './mockData/VendorsMockData'
import { router, useLocalSearchParams } from 'expo-router'
import SearchBar from './SearchBar'
import CategoryData from './mockData/CategoryData'
import FilterComponent from './FilterComponent'
import { Colors, Shadows, Spacing } from '@/app/constants/theme'

export default function VendorListView() {
    const insets = useSafeAreaInsets()
    const mockData = MockData
    const categoryData = CategoryData
    const params = useLocalSearchParams<{ query?: string; category?: string }>()

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

      console.log('=== FILTER DEBUG ===')
      console.log('Filters:', filters)
      console.log('normalizedLocation:', normalizedLocation)
      console.log('minPrice:', hasMinPrice ? minPriceNumber : 'none')
      console.log('maxPrice:', hasMaxPrice ? maxPriceNumber : 'none')
      console.log('minRating:', filters.minRating)

      const filtered = mockData.filter((item) => {
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

        const passes = matchesCategory && matchesQuery && matchesLocation && matchesMinPrice && matchesMaxPrice && matchesRating && matchesGuestCapacity
        
        if (!passes && (normalizedLocation || hasMinPrice || hasMaxPrice || filters.minRating > 0 || hasMinGuests || hasMaxGuests)) {
          console.log(`${item.name} filtered out:`, {
            matchesCategory,
            matchesQuery,
            matchesLocation,
            matchesMinPrice,
            matchesMaxPrice,
            matchesRating,
            matchesGuestCapacity,
            itemLocation: item.location,
            itemPrice,
            itemRating: item.rating
          })
        }

        return passes
      })

      console.log(`Filtered ${filtered.length} out of ${mockData.length} vendors`)
      console.log('===================')

      return filtered
    }, [mockData, query, selectedCategory, filters])

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View className='flex-row justify-between items-center gap-4 px-5 py-5' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
          <View className='flex-row items-center gap-4 flex-1'>
            <Pressable className='rounded-full p-2 active:opacity-70' style={{backgroundColor: Colors.lightGray}} onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}>
              <ArrowLeft color={Colors.primary} size={24} />
            </Pressable>
            <Text className='text-xl font-extrabold flex-1' style={{color: Colors.textPrimary}} numberOfLines={1}>Browse Vendors</Text>
          </View>
          <View>
            <FilterComponent
              values={filters}
              onApply={setFilters}
              onReset={() => setFilters({ location: "", minPrice: "", maxPrice: "", minRating: 0, minGuests: "", maxGuests: "" })}
            />
            {activeFiltersCount > 0 && (
              <View className='absolute -top-1 -right-1 rounded-full px-1.5 py-0.5' style={{backgroundColor: Colors.error, minWidth: 20}}>
                <Text className='text-xs font-bold text-center' style={{color: Colors.white}}>{activeFiltersCount}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{backgroundColor: Colors.white, paddingBottom: Spacing.md}}>
          <SearchBar value={query} onChange={setQuery} />
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <View className='flex-row items-center gap-3 px-5' style={{marginTop: Spacing.md}}>
              {categoryData.map((item) => (
                <Pressable
                  key={item.id} 
                  className='flex-row items-center gap-2 px-4 py-3 rounded-xl active:opacity-70'
                  style={{ backgroundColor: selectedCategory === item.key ? Colors.primary : Colors.lightGray }}
                  onPress={() => setSelectedCategory(item.key || "all")}
                >
                  <item.icon size={18} color={selectedCategory === item.key ? Colors.white : Colors.textPrimary} />
                  <Text className='text-sm font-semibold' style={{ color: selectedCategory === item.key ? Colors.white : Colors.textPrimary }}>{item.title}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          {activeFiltersCount > 0 && (
            <View className='px-5 mt-3'>
              <Text className='text-xs font-semibold mb-2' style={{color: Colors.textSecondary}}>Active Filters:</Text>
              <View className='flex-row flex-wrap gap-2'>
                {filters.location && (
                  <View className='px-3 py-1.5 rounded-lg' style={{backgroundColor: Colors.primaryLight}}>
                    <Text className='text-xs font-semibold' style={{color: Colors.white}}>📍 {filters.location}</Text>
                  </View>
                )}
                {filters.minPrice && (
                  <View className='px-3 py-1.5 rounded-lg' style={{backgroundColor: Colors.success}}>
                    <Text className='text-xs font-semibold' style={{color: Colors.white}}>Min: PKR {Number(filters.minPrice).toLocaleString()}</Text>
                  </View>
                )}
                {filters.maxPrice && (
                  <View className='px-3 py-1.5 rounded-lg' style={{backgroundColor: Colors.success}}>
                    <Text className='text-xs font-semibold' style={{color: Colors.white}}>Max: PKR {Number(filters.maxPrice).toLocaleString()}</Text>
                  </View>
                )}
                {filters.minRating > 0 && (
                  <View className='px-3 py-1.5 rounded-lg' style={{backgroundColor: Colors.rating}}>
                    <Text className='text-xs font-semibold' style={{color: Colors.white}}>⭐ {filters.minRating}+</Text>
                  </View>
                )}
                {filters.minGuests && (
                  <View className='px-3 py-1.5 rounded-lg' style={{backgroundColor: Colors.info}}>
                    <Text className='text-xs font-semibold' style={{color: Colors.white}}>Min: {filters.minGuests} guests</Text>
                  </View>
                )}
                {filters.maxGuests && (
                  <View className='px-3 py-1.5 rounded-lg' style={{backgroundColor: Colors.info}}>
                    <Text className='text-xs font-semibold' style={{color: Colors.white}}>Max: {filters.maxGuests} guests</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
        <ScrollView className='flex-1' style={{marginTop: Spacing.md}}>
          {filteredData.length === 0 ? (
            <View className='flex-1 items-center justify-center py-20'>
              <Text className='text-xl font-bold mb-2' style={{color: Colors.textSecondary}}>No vendors found</Text>
              <Text className='text-sm text-center px-8' style={{color: Colors.textTertiary}}>Try adjusting your filters or search criteria</Text>
            </View>
          ) : (
            <FlatList
              data={filteredData}
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