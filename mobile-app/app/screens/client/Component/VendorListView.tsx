import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, MapPin, Star, Users } from 'lucide-react-native'
import MockData from './mockData/VendorsMockData'
import { router, useLocalSearchParams } from 'expo-router'
import SearchBar from './SearchBar'
import CategoryData from './mockData/CategoryData'
import FilterComponent from './FilterComponent'

export default function VendorListView() {
    const insets = useSafeAreaInsets()
    const mockData = MockData
    const categoryData = CategoryData
    const params = useLocalSearchParams<{ query?: string; category?: string }>()

    const [query, setQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [filters, setFilters] = useState({ location: "", maxPrice: "" })

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
      const maxPriceNumber = Number(filters.maxPrice)
      const hasMaxPrice = Number.isFinite(maxPriceNumber) && maxPriceNumber > 0

      return mockData.filter((item) => {
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

        const matchesPrice = hasMaxPrice ? itemPrice <= maxPriceNumber : true

        return matchesCategory && matchesQuery && matchesLocation && matchesPrice
      })
    }, [mockData, query, selectedCategory, filters.location, filters.maxPrice])

  return (
    <View style={[styles.container ,{paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View className='h-24 flex-row justify-between items-center gap-5 border-b border-gray-300 mx-5'>
          <View className='flex-row justify-normal items-center gap-5'>
            <Pressable className='bg-gray-100 rounded-full px-2 py-2' onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}>
              <ArrowLeft color={"#4546E5"} />
            </Pressable>
            <Text className='text-2xl font-bold'>Browse Vendors</Text>
          </View>
          <FilterComponent
            values={filters}
            onApply={setFilters}
            onReset={() => setFilters({ location: "", maxPrice: "" })}
          />
        </View>
        <View className='bg-[#FFFFFF] h-44'>
          <SearchBar value={query} onChange={setQuery} />
          <ScrollView horizontal={true}>
            <View className='mt-2 mx-5 flex-row justify-evenly items-center gap-4'>
              {
                categoryData.map((item) => (
                  <Pressable
                    key={item.id} 
                    className='active:opacity-50 flex-row items-center gap-2 px-3 py-4 rounded-xl'
                    style={{ backgroundColor: selectedCategory === item.key ? "#4F46E5" : "#FAFAFA" }}
                    onPress={() => setSelectedCategory(item.key || "all")}
                  >
                    <item.icon size={18} color={selectedCategory === item.key ? "#FAFAFA" : "#0A0A0A"} />
                    <Text className='text-base font-medium' style={{ color: selectedCategory === item.key ? "#FAFAFA" : "#0A0A0A" }}>{item.title}</Text>
                  </Pressable>
                ))
              }
            </View>
          </ScrollView>
        </View>
        <ScrollView className='mt-5'>
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
            renderItem={({item}) => (
              <Pressable className="mb-4 active:opacity-70" onPress={() => router.push({
                pathname: "/screens/client/Component/DetailScreenPage",
                params: { vendor: JSON.stringify(item), category: item.key }
              })}>
                <View className="bg-[#FFFFFF] w-full h-36 rounded-xl p-4 flex-row items-center gap-4" style={styles.boxShadow}> 
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
                            ? <Text className="text-lg font-bold text-[#4F46E5]">PKR {item.price?.toLocaleString()}</Text>
                            : <Text className="text-lg font-bold text-[#4F46E5]">PKR {item.packages?.[0]?.price?.toLocaleString()}</Text>
                        }
                      </View>
                    </View>
                        
                  </View>
                </View>
              </Pressable>
            )}
          />
        </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "#FAFAFA"
    },
    boxShadow: {
          shadowColor: "#0A0A0A",
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.5,
          shadowRadius: 5,
          elevation: 8, // For Android
        }
}) 