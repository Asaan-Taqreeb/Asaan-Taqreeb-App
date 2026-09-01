import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";

import { Building2, Utensils, Camera, Scissors, Sparkles, ChevronRight } from "lucide-react-native";
import { Colors, Shadows } from "@/app/_constants/theme";
import { getMyVendorServices } from '@/app/_utils/servicesApi';
import { getAllCategories, type Category } from '@/app/_utils/categoriesApi';
import { getIconComponent } from '@/app/screens/client/Component/_categoryConfig';
import AgreementModal from '@/app/_components/AgreementModal';
import useVendorAgreement from '@/app/_hooks/useVendorAgreement';
import React, { useEffect, useState } from 'react';

const DEFAULT_SERVICES: Array<{
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
    description: 'Manage venue bookings, capacity, and hall packages',
    icon: 'House',
    color: '#6366F1',
    sortOrder: 1,
  },
  {
    id: 'catering',
    key: 'catering',
    name: 'Catering Service',
    description: 'Set up menu packages, pricing, and food services',
    icon: 'Utensils',
    color: '#F59E0B',
    sortOrder: 2,
  },
  {
    id: 'photo',
    key: 'photo',
    name: 'Photography Service',
    description: 'Create photography packages and showcase portfolio',
    icon: 'Video',
    color: '#EC4899',
    sortOrder: 3,
  },
  {
    id: 'parlor',
    key: 'parlor',
    name: 'Parlor/Salon',
    description: 'Manage beauty services, bridal packages, and styling',
    icon: 'Scissors',
    color: '#8B5CF6',
    sortOrder: 4,
  },
];

const getCategoryRoute = (category: Category | { key: string; name?: string }): Href => {
  const key = category.key;
  switch (key) {
    case 'banquet':
    case 'banquets':
      return '/screens/vendor/BanquetServiceForm' as Href;
    case 'catering':
    case 'caterings':
      return '/screens/vendor/CateringServiceForm' as Href;
    case 'photo':
    case 'photographers':
      return '/screens/vendor/PhotographyServiceForm' as Href;
    case 'parlor':
      return '/screens/vendor/ParlorServiceForm' as Href;
    default:
      return {
        pathname: '/screens/vendor/DynamicServiceForm',
        params: { category: key, categoryName: category.name || key },
      } as Href;
  }
};

export default function VendorHomeScreen() {
  const insets = useSafeAreaInsets();
  const [isChecking, setIsChecking] = useState(true);
  const [lockedCategory, setLockedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const {
    showAgreement,
    loading: agreementLoading,
    acceptAgreement,
    rejectAgreement,
  } = useVendorAgreement();

  useEffect(() => {
    let isActive = true;

    const initialize = async () => {
      setIsChecking(true);
      try {
        const [existingServices, fetchedCategories] = await Promise.all([
          getMyVendorServices().catch(() => []),
          getAllCategories().catch(() => []),
        ]);

        if (!isActive) return;

        if (existingServices.length > 0) {
          const firstCategory = String(existingServices[0]?.category || '').toLowerCase();
          setLockedCategory(firstCategory || null);
          router.replace('/screens/vendor/VendorDashboardHome');
          return;
        }

        setLockedCategory(null);

        const activeList = (fetchedCategories || []).filter(
          (c) => c.active && c.key !== 'all' && c.key !== 'request_category'
        );
        if (activeList.length > 0) {
          setCategories(activeList.sort((a, b) => a.sortOrder - b.sortOrder));
        } else {
          setCategories(DEFAULT_SERVICES as any);
        }
      } catch {
        if (isActive) {
          setLockedCategory(null);
          setCategories(DEFAULT_SERVICES as any);
        }
      } finally {
        if (isActive) {
          setIsChecking(false);
        }
      }
    };

    initialize();

    return () => {
      isActive = false;
    };
  }, []);

  const handleCategorySelect = (category: Category) => {
    if (lockedCategory && category.key !== lockedCategory) {
      Alert.alert(
        'Service Locked',
        'This vendor account already has a service category. You cannot add a different category with the same email.'
      );
      return;
    }

    const route = getCategoryRoute(category);
    router.push(route);
  };

  const handleRejectAgreement = async () => {
    Alert.alert(
      'Agreement Required',
      'You must accept the vendor agreement to continue using Asaan Taqreeb. Would you like to reconsider?',
      [
        { text: 'Re-read Agreement', onPress: rejectAgreement },
        { text: 'Logout', onPress: () => router.push('/screens/vendor/VendorLoginScreen' as Href), style: 'destructive' }
      ]
    );
  };

  const handleAcceptAgreement = async () => {
    try {
      const accepted = await acceptAgreement();
      if (accepted) {
        router.replace('/screens/vendor/Component/CategorySelection' as Href);
      } else {
        Alert.alert('Error', 'Failed to accept agreement. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to accept agreement. Please try again.');
    }
  };

  if (isChecking) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
        <View className="px-6 py-6" style={{ borderBottomWidth: 1, borderBottomColor: Colors.border }}>
          <Text className="text-3xl font-extrabold" style={{ color: Colors.textPrimary }}>Welcome Vendor! 👋</Text>
          <Text className="text-base font-medium mt-2" style={{ color: Colors.textSecondary }}>
            Checking your service setup...
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View className="px-6 py-6" style={{ borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <Text className="text-3xl font-extrabold" style={{ color: Colors.textPrimary }}>Welcome Vendor! 👋</Text>
        <Text className="text-base font-medium mt-2" style={{ color: Colors.textSecondary }}>
          Select the type of service you want to offer
        </Text>
      </View>

      {/* Service Selection */}
      <ScrollView 
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-xl font-extrabold mb-4" style={{ color: Colors.textPrimary }}>
          Choose Your Service Category
        </Text>

        <View className="gap-4">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon || '');
            const categoryColor = category.color || '#6366F1';

            return (
              <Pressable
                key={category._id || category.key}
                className="rounded-2xl overflow-hidden active:opacity-90"
                style={[
                  {
                    backgroundColor: Colors.white,
                    borderWidth: 2,
                    borderColor: Colors.border,
                  },
                  Shadows.medium
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <View className="flex-row items-center p-5">
                  {/* Icon */}
                  <View 
                    className="rounded-2xl p-4 mr-4"
                    style={{ backgroundColor: `${category.backgroundColor || categoryColor}20` }}
                  >
                    <IconComponent size={32} color={categoryColor} />
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <Text className="text-xl font-extrabold mb-1" style={{ color: Colors.textPrimary }}>
                      {category.name}
                    </Text>
                    <Text className="text-sm font-medium leading-relaxed" style={{ color: Colors.textSecondary }}>
                      {category.description || `Manage bookings and packages for ${category.name}`}
                    </Text>
                  </View>

                  {/* Arrow Indicator */}
                  <View className="ml-2">
                    <View 
                      className="rounded-full p-2.5"
                      style={{ backgroundColor: categoryColor }}
                    >
                      <ChevronRight size={18} color={Colors.white} />
                    </View>
                  </View>
                </View>

                {/* Color Accent Bar */}
                <View style={{ height: 4, backgroundColor: categoryColor }} />
              </Pressable>
            );
          })}
        </View>

        {/* Info Box */}
        <View 
          className="rounded-2xl p-5 mt-6 mb-4 border"
          style={{
            backgroundColor: Colors.lightGray,
            borderColor: Colors.border
          }}
        >
          <Text className="text-base font-extrabold mb-2" style={{ color: Colors.primary }}>
            💡 Getting Started
          </Text>
          <Text className="text-sm font-medium leading-relaxed" style={{ color: Colors.textSecondary }}>
            Select your service category to fill in your business details, create packages, and start receiving booking requests from clients.
          </Text>
        </View>

        {/* Request New Category Button */}
        <Pressable 
          onPress={() => router.push('/screens/vendor/Component/CategoryRequestScreen' as Href)} 
          className="py-3.5 rounded-2xl items-center mb-8 border border-dashed"
          style={{ borderColor: Colors.primary, backgroundColor: `${Colors.primary}08` }}
        >
          <Text className="text-sm font-bold" style={{ color: Colors.primary }}>
            + Don't see your category? Request here
          </Text>
        </Pressable>
      </ScrollView>

      {/* Agreement Modal */}
      <AgreementModal
        visible={showAgreement}
        onAccept={handleAcceptAgreement}
        onReject={handleRejectAgreement}
        loading={agreementLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background
  }
});
