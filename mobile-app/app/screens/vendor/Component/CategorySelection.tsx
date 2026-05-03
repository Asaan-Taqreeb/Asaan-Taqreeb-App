import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Building2, Utensils, Camera, Scissors } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';

const CATEGORIES = [
  {
    id: 'banquet',
    title: 'Banquet Hall',
    description: 'Venues for weddings and large events',
    icon: Building2,
    route: '/screens/vendor/BanquetServiceForm',
    color: '#6366F1'
  },
  {
    id: 'catering',
    title: 'Catering Service',
    description: 'Food and beverage services',
    icon: Utensils,
    route: '/screens/vendor/CateringServiceForm',
    color: '#F59E0B'
  },
  {
    id: 'photo',
    title: 'Photography',
    description: 'Wedding and event photography',
    icon: Camera,
    route: '/screens/vendor/PhotographyServiceForm',
    color: '#EC4899'
  },
  {
    id: 'parlor',
    title: 'Salon & Parlor',
    description: 'Makeup and grooming services',
    icon: Scissors,
    route: '/screens/vendor/ParlorServiceForm',
    color: '#8B5CF6'
  }
];

export default function CategorySelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-6 border-b border-gray-100 bg-white">
        <Pressable 
          onPress={() => router.back()}
          className="p-2 rounded-full active:opacity-70 mr-4"
          style={{ backgroundColor: Colors.lightGray }}
        >
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </Pressable>
        <View>
          <Text className="text-2xl font-extrabold" style={{ color: Colors.textPrimary }}>Select Category</Text>
          <Text className="text-xs font-medium" style={{ color: Colors.textSecondary }}>What kind of service do you provide?</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 mt-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[3px]">
          AVAILABLE CATEGORIES
        </Text>

        {CATEGORIES.map((category) => (
          <Pressable
            key={category.id}
            className="bg-white rounded-[32px] p-6 mb-5 flex-row items-center"
            style={Shadows.medium}
            onPress={() => router.push(category.route)}
          >
            <View 
              className="w-14 h-14 rounded-2xl items-center justify-center mr-5"
              style={{ backgroundColor: category.color + '15' }}
            >
              <category.icon size={28} color={category.color} />
            </View>
            
            <View className="flex-1">
              <Text className="text-lg font-black" style={{ color: Colors.textPrimary }}>
                {category.title}
              </Text>
              <Text className="text-xs font-medium text-gray-400 mt-1">
                {category.description}
              </Text>
            </View>

            <View className="w-10 h-10 rounded-full items-center justify-center bg-gray-50">
              <ChevronRight size={18} color={Colors.textTertiary} />
            </View>
          </Pressable>
        ))}

        <View className="mt-8 p-6 bg-gray-50 rounded-3xl mb-10 border border-gray-100">
          <Text className="text-xs font-bold leading-5 text-center text-gray-400 italic">
            &quot;Your service will be listed under the selected category to help clients find you easily.&quot;
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
