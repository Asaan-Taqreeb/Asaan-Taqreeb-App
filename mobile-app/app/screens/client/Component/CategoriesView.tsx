import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { buildClientCategoryCards } from './_categoryConfig';
import { Colors, Spacing, Shadows } from '@/app/_constants/theme';
import { getAllServices, type ServiceListItem } from '@/app/_utils/servicesApi';
import { getAllCategories, type Category } from '@/app/_utils/categoriesApi';
import { useLanguage } from '@/app/_context/LanguageContext';

const CategoriesView = () => {
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
      <View className="flex-row items-center justify-between px-5 mb-3.5">
        <Text className="text-xl font-extrabold" style={{ color: Colors.textPrimary }}>
          {t('categories')}
        </Text>
        <Text className="text-xs font-semibold" style={{ color: Colors.textTertiary }}>
          {categoryCards.length} Categories Available
        </Text>
      </View>

      <View className="flex-row flex-wrap px-3">
        {categoryCards.map((data) => {
          const IconComponent = data.icon;

          return (
            <View key={data.id} className="w-1/4 p-1.5">
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/screens/client/Component/VendorListView',
                    params: data.key && data.key !== 'all' ? { category: data.key } : undefined,
                  })
                }
                className="items-center py-3 px-1 rounded-2xl bg-white border border-gray-100 active:opacity-75"
                style={Shadows.small}
              >
                <View
                  className="w-13 h-13 rounded-2xl items-center justify-center mb-2"
                  style={{
                    backgroundColor: data.backColor || `${data.color}15`,
                    width: 52,
                    height: 52,
                  }}
                >
                  <IconComponent size={24} color={data.color} />
                </View>

                <Text
                  className="text-xs font-bold text-center px-1"
                  style={{ color: Colors.textPrimary }}
                  numberOfLines={1}
                >
                  {data.title}
                </Text>

                <View className="bg-gray-50 px-2 py-0.5 rounded-full mt-1 border border-gray-100">
                  <Text
                    className="text-[9px] font-bold text-center"
                    style={{ color: Colors.textTertiary }}
                  >
                    {data.count} {t('live')}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default CategoriesView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
});