import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Edit3, Trash2, MapPin, Star, Package } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { getVendorServices, deleteVendorService, type ServiceListItem } from '@/app/_utils/servicesApi';
import { useFocusEffect } from '@react-navigation/native';

export default function ManageServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendorServices();
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices])
  );

  const handleDelete = (serviceId: string, name: string) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVendorService(serviceId);
              loadServices();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const renderServiceItem = ({ item }: { item: ServiceListItem }) => (
    <View 
      className="bg-white rounded-3xl p-4 mb-4" 
      style={[{ borderLeftWidth: 6, borderLeftColor: Colors.primary }, Shadows.medium]}
    >
      <View className="flex-row">
        <Image 
          source={{ uri: item.images[0] }} 
          className="w-24 h-24 rounded-2xl" 
          resizeMode="cover" 
        />
        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-lg font-bold" numberOfLines={1} style={{ color: Colors.textPrimary }}>
                {item.name}
              </Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={12} color={Colors.textSecondary} />
                <Text className="text-xs font-medium ml-1" style={{ color: Colors.textSecondary }}>
                  {item.location}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center px-2 py-1 rounded-lg" style={{ backgroundColor: Colors.primaryMuted }}>
              <Star size={12} color={Colors.primary} fill={Colors.primary} />
              <Text className="text-xs font-bold ml-1" style={{ color: Colors.primary }}>
                {item.rating || '5.0'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mt-3">
            <Package size={14} color={Colors.textTertiary} />
            <Text className="text-xs font-bold ml-1 text-gray-400 uppercase tracking-widest">
              {item.category} • {item.packages?.length || 0} Packages
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-3 mt-4 pt-4 border-t border-gray-100">
        <Pressable 
          className="flex-1 flex-row items-center justify-center py-3.5 rounded-2xl"
          style={[{ backgroundColor: Colors.vendor }, Shadows.small]}
          onPress={() => {
            // Determine which form to open based on category
            let formPath = '/screens/vendor/BanquetServiceForm';
            if (item.category === 'catering') formPath = '/screens/vendor/CateringServiceForm';
            if (item.category === 'photo') formPath = '/screens/vendor/PhotographyServiceForm';
            if (item.category === 'parlor') formPath = '/screens/vendor/ParlorServiceForm';
            
            router.push({
              pathname: formPath,
              params: { serviceId: item.serviceId, edit: 'true' }
            });
          }}
        >
          <Edit3 size={16} color={Colors.white} />
          <Text className="text-sm font-extrabold ml-2" style={{ color: Colors.white }}>Edit Details</Text>
        </Pressable>

        <Pressable 
          className="w-12 h-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: Colors.errorLight + '20', borderWidth: 1, borderColor: Colors.error + '20' }}
          onPress={() => handleDelete(item.serviceId, item.name)}
        >
          <Trash2 size={18} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center gap-4">
          <Pressable 
            onPress={() => router.back()}
            className="p-2 rounded-full active:opacity-70"
            style={{ backgroundColor: Colors.lightGray }}
          >
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <Text className="text-2xl font-extrabold" style={{ color: Colors.textPrimary }}>My Services</Text>
            <Text className="text-xs font-medium" style={{ color: Colors.textSecondary }}>Manage your business listings</Text>
          </View>
        </View>

        {!loading && services.length === 0 && (
          <Pressable 
            className="p-3 rounded-2xl active:opacity-70"
            style={{ backgroundColor: Colors.vendor }}
            onPress={() => router.push('/screens/vendor/Component/CategorySelection')}
          >
            <Plus size={20} color={Colors.white} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="mt-4 font-medium text-gray-400">Loading your services...</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.serviceId}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <View className="w-24 h-24 rounded-full bg-gray-50 items-center justify-center mb-6">
                <Package size={40} color={Colors.textTertiary} />
              </View>
              <Text className="text-xl font-bold mb-2 text-center" style={{ color: Colors.textPrimary }}>
                No Services Found
              </Text>
              <Text className="text-sm font-medium text-gray-400 text-center mb-8 px-10 leading-5">
                You haven&apos;t added any services yet. Start by adding your first business listing!
              </Text>
              <Pressable 
                className="px-10 py-4 rounded-2xl"
                style={{ backgroundColor: Colors.primary }}
                onPress={() => router.push('/screens/vendor/Component/CategorySelection')}
              >
                <Text className="text-white font-bold">Add Your First Service</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
