import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Building2, Utensils, Camera, Scissors, Sparkles } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { getAllCategories, type Category } from '@/app/_utils/categoriesApi';
import { getIconComponent } from '@/app/screens/client/Component/_categoryConfig';

const DEFAULT_CATEGORIES: Array<{
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
}> = [
  {
    id: 'banquet',
    key: 'banquet',
    name: 'Banquet Hall',
    description: 'Venues for weddings and large events',
    icon: 'House',
    color: '#6366F1',
    sortOrder: 1,
  },
  {
    id: 'catering',
    key: 'catering',
    name: 'Catering Service',
    description: 'Food and beverage services',
    icon: 'Utensils',
    color: '#F59E0B',
    sortOrder: 2,
  },
  {
    id: 'photo',
    key: 'photo',
    name: 'Photography',
    description: 'Wedding and event photography',
    icon: 'Video',
    color: '#EC4899',
    sortOrder: 3,
  },
  {
    id: 'parlor',
    key: 'parlor',
    name: 'Salon & Parlor',
    description: 'Makeup and grooming services',
    icon: 'Scissors',
    color: '#8B5CF6',
    sortOrder: 4,
  },
];

const getCategoryRoute = (key: string): Href => {
  switch (key) {
    case 'banquet':
      return '/screens/vendor/BanquetServiceForm' as Href;
    case 'catering':
      return '/screens/vendor/CateringServiceForm' as Href;
    case 'photo':
      return '/screens/vendor/PhotographyServiceForm' as Href;
    case 'parlor':
      return '/screens/vendor/ParlorServiceForm' as Href;
    default:
      return {
        pathname: '/screens/vendor/PhotographyServiceForm',
        params: { category: key },
      } as Href;
  }
};

export default function CategorySelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await getAllCategories();
        if (isActive) {
          const activeList = (data || []).filter(
            (c) => c.active && c.key !== 'all' && c.key !== 'request_category'
          );
          if (activeList.length > 0) {
            setCategories(activeList.sort((a, b) => a.sortOrder - b.sortOrder));
          } else {
            setCategories(DEFAULT_CATEGORIES as any);
          }
        }
      } catch (err) {
        console.error('Error fetching categories in CategorySelection:', err);
        if (isActive) {
          setCategories(DEFAULT_CATEGORIES as any);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      isActive = false;
    };
  }, []);

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

        {loading && categories.length === 0 ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-xs text-gray-400 mt-3 font-medium">Loading categories...</Text>
          </View>
        ) : (
          categories.map((category) => {
            const IconComponent = getIconComponent(category.icon || '');
            const categoryColor = category.color || '#6366F1';
            const route = getCategoryRoute(category.key);

            return (
              <Pressable
                key={category._id || category.key}
                className="bg-white rounded-[32px] p-6 mb-5 flex-row items-center"
                style={Shadows.medium}
                onPress={() => router.push(route)}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-5"
                  style={{ backgroundColor: (category.backgroundColor || categoryColor) + '20' }}
                >
                  <IconComponent size={28} color={categoryColor} />
                </View>
                
                <View className="flex-1">
                  <Text className="text-lg font-black" style={{ color: Colors.textPrimary }}>
                    {category.name}
                  </Text>
                  <Text className="text-xs font-medium text-gray-400 mt-1">
                    {category.description || `Manage and receive bookings for ${category.name}`}
                  </Text>
                </View>

                <View className="w-10 h-10 rounded-full items-center justify-center bg-gray-50">
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>
              </Pressable>
            );
          })
        )}

        <View className="mt-8 p-6 bg-gray-50 rounded-3xl mb-10 border border-gray-100">
          <Text className="text-xs font-bold leading-5 text-center text-gray-400 italic">
            &quot;Your service will be listed under the selected category to help clients find you easily.&quot;
          </Text>
          <Pressable 
            onPress={() => router.push('/screens/vendor/Component/CategoryRequestScreen' as Href)} 
            className="mt-4 py-3 rounded-xl items-center" 
            style={{ backgroundColor: Colors.primary }}
          >
            <Text className="text-sm font-bold text-white">Request a new category</Text>
          </Pressable>
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
