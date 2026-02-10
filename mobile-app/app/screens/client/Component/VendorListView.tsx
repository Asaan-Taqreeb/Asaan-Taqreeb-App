import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, ForkKnife, MapPin, SlidersHorizontal, Star, Users } from 'lucide-react-native'
import MockData from './mockData/VendorsMockData'
import { router } from 'expo-router'
import SearchBar from './SearchBar'
import CategoryData from './mockData/CategoryData'
import FilterComponent from './FilterComponent'

export default function VendorListView() {
    const insets = useSafeAreaInsets()
    const mockData = MockData
    const categoryData = CategoryData

  return (
    <View style={[styles.container ,{paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View className='h-24 flex-row justify-between items-center gap-5 border-b border-gray-300 mx-5'>
          <View className='flex-row justify-normal items-center gap-5'>
            <Pressable className='bg-gray-100 rounded-full px-2 py-2' onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}>
              <ArrowLeft color={"#4546E5"} />
            </Pressable>
            <Text className='text-2xl font-bold'>Browse Vendors</Text>
          </View>
          <FilterComponent />
        </View>
        <View className='bg-[#FFFFFF] h-44'>
          <SearchBar />
          <ScrollView horizontal={true}>
            <View className='mt-2 mx-5 flex-row justify-evenly items-center gap-4'>
              {
                categoryData.map((item) => (
                  <Pressable
                    key={item.id} 
                    className='active:opacity-50 flex-row items-center gap-2 bg-[#FAFAFA] px-3 py-4 rounded-xl'
                  >
                    <item.icon size={18} />
                    <Text className='text-base font-medium'>{item.title}</Text>
                  </Pressable>
                ))
              }
            </View>
          </ScrollView>
        </View>
        <ScrollView className='mt-5'>
          <FlatList
            data={mockData}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
            renderItem={({item}) => (
              <Pressable className="mb-4 active:opacity-70" onPress={() => router.push("/screens/client/Component/DetailScreenPage")}>
                <View className="bg-[#FFFFFF] w-full h-36 rounded-xl p-4 flex-row items-center gap-4" style={styles.boxShadow}> 
                  <Image 
                    className="rounded-md" 
                    source={{ uri: item.imageUrl }}
                    accessibilityLabel={item.title} 
                    style={{ width: '35%', height: '100%' }} 
                    resizeMode="cover" 
                  />
                  <View className="flex-col flex-1 justify-between">
                    <View>
                      <Text className="text-xl font-bold mb-1" numberOfLines={1}>{item.title}</Text>
                      <View className="flex-row items-center mb-2">
                        <MapPin size={14} color={"#64748B"} />
                        <Text className="text-base text-[#64748B] font-medium ml-1" numberOfLines={1}>{item.location}</Text>
                      </View>
                      {
                        item.category == "banquet" && <Text className="text-md font-medium mb-1"><Users size={13}  />  {item.capacity} Min</Text>
                      }
                      <View className="flex-row justify-between items-center ">
                        <View className="flex-row items-center gap-2">
                          <Star size={15} fill="#F97316" color="#F97316" />
                          <Text className="text-base font-medium text-[#F97316]">{item.rating}</Text>
                        </View>
                        {
                          item.category == "catering" ? <Text className="text-lg font-bold text-[#4F46E5]">PKR {item.budget.toLocaleString()}/head</Text> : <Text className="text-lg font-bold text-[#4F46E5]">PKR {item.budget.toLocaleString()}</Text>
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