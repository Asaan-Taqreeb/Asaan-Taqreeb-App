import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { buildClientCategoryCards } from './_categoryConfig';
import { Colors, Spacing, Shadows } from '@/app/_constants/theme';
import { getAllServices, type ServiceListItem } from '@/app/_utils/servicesApi';
import { getAllCategories, type Category } from '@/app/_utils/categoriesApi';
import { useLanguage } from '@/app/_context/LanguageContext';

interface CategoriesViewProps {
  selectedCategory?: string;
  onSelectCategory?: (key: string) => void;
}

const CategoriesView = ({ selectedCategory, onSelectCategory }: CategoriesViewProps) => {
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [servicesData, categoriesData] = await Promise.all([
          getAllServices(),
          getAllCategories(),
        ]);
        if (mounted) {
          setServices(servicesData);
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error loading categories or services:', error);
        if (mounted) {
          setServices([]);
          setCategories([]);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const categoryCards = useMemo(
    () => buildClientCategoryCards(categories, services),
    [categories, services]
  );

  return (
    <View style={styles.container}>
      <View className="flex-row items-center justify-between px-5 mb-2.5">
        <Text className="text-xl font-extrabold" style={{ color: Colors.textPrimary }}>
          {t('categories')}
        </Text>
        <Pressable
          onPress={() => router.push('/screens/client/Component/VendorListView')}
          className="active:opacity-70"
        >
          <Text className="text-xs font-bold" style={{ color: Colors.primary }}>
            {t('seeAll')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4, gap: 10 }}
      >
        {categoryCards.map((data) => {
          const IconComponent = data.icon;
          const isSelected = selectedCategory === data.key;

          return (
            <Pressable
              key={data.id}
              onPress={() => {
                if (onSelectCategory) {
                  onSelectCategory(data.key);
                } else {
                  router.push({
                    pathname: '/screens/client/Component/VendorListView',
                    params: data.key && data.key !== 'all' ? { category: data.key } : undefined,
                  });
                }
              }}
              className="items-center py-3 px-3 rounded-2xl bg-white border active:opacity-75"
              style={[
                {
                  minWidth: 84,
                  borderColor: isSelected ? Colors.primary : Colors.border,
                  backgroundColor: isSelected ? `${Colors.primary}0C` : Colors.white,
                },
                Shadows.small,
              ]}
            >
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mb-1.5"
                style={{
                  backgroundColor: data.backColor || `${data.color}15`,
                }}
              >
                <IconComponent size={22} color={data.color} />
              </View>

              <Text
                className="text-xs font-bold text-center px-0.5"
                style={{ color: isSelected ? Colors.primary : Colors.textPrimary }}
                numberOfLines={1}
              >
                {data.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CategoriesView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
});