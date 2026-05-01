import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { getMyVendorServices, uploadServiceImages, deleteServiceImage, type ServiceListItem } from '@/app/_utils/servicesApi';
import ImageUploader from './ImageUploader';

export default function ServiceImageManager() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const data = await getMyVendorServices();
      setServices(data);
    } catch (error: any) {
      Alert.alert('Failed', error?.message || 'Unable to load your services.');
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = (serviceId: string, imageUrl: string, serviceName: string) => {
    Alert.alert(
      'Delete Image',
      `Remove this image from ${serviceName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingImage(imageUrl);
              await deleteServiceImage(serviceId, imageUrl);
              Alert.alert('Success', 'Image deleted successfully.');
              loadServices();
            } catch (error: any) {
              Alert.alert('Failed', error?.message || 'Unable to delete image.');
            } finally {
              setIsDeletingImage(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            className="rounded-full p-2"
            style={{ backgroundColor: Colors.lightGray }}
            onPress={() => router.back()}
          >
            <ArrowLeft color={Colors.textPrimary} size={24} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-extrabold" style={{ color: Colors.textPrimary }}>
              Manage Images
            </Text>
            <Text className="text-xs font-medium mt-1" style={{ color: Colors.textSecondary }}>
              Upload and organize your service photos
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.vendor} />
          <Text className="mt-3 text-gray-500">Loading your services...</Text>
        </View>
      ) : services.length === 0 ? (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="px-5 mt-6 items-center">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: Colors.vendor + '20' }}
            >
              <AlertCircle size={32} color={Colors.vendor} />
            </View>
            <Text className="text-base font-semibold text-center" style={{ color: Colors.textPrimary }}>
              No Services Yet
            </Text>
            <Text className="text-sm text-gray-500 mt-2 text-center">
              Create a service first to upload images
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {services.map((service) => (
            <View key={service.id} className="px-5 mt-4">
              {/* Service Header */}
              <View className="bg-white rounded-2xl p-4 mb-3" style={Shadows.small}>
                <Text className="text-base font-extrabold" style={{ color: Colors.textPrimary }}>
                  {service.name}
                </Text>
                <Text className="text-xs font-medium mt-1 text-gray-500">
                  {service.category.toUpperCase()} • {service.images?.length || 0} images
                </Text>
              </View>

              {/* Current Images Gallery */}
              {service.images && service.images.length > 0 ? (
                <View className="bg-white rounded-2xl p-4 mb-4" style={Shadows.small}>
                  <Text className="text-sm font-semibold mb-3" style={{ color: Colors.textPrimary }}>
                    Current Images ({service.images.length})
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    {service.images.map((imageUrl, index) => (
                      <View key={index} className="relative">
                        <Image
                          source={{ uri: imageUrl }}
                          className="w-24 h-24 rounded-xl"
                          onError={() => console.log('Image load error:', imageUrl)}
                        />
                        <TouchableOpacity
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5"
                          onPress={() => handleDeleteImage(service.id || service.serviceId, imageUrl, service.name)}
                          disabled={isDeletingImage === imageUrl}
                        >
                          {isDeletingImage === imageUrl ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Trash2 size={14} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
                  <Text className="text-sm text-blue-700">
                    No images uploaded yet. Add images below to showcase this service.
                  </Text>
                </View>
              )}

              {/* Image Uploader */}
              <View className="mb-6">
                <ImageUploader
                  serviceId={service.id || service.serviceId}
                  images={service.images || []}
                  onImagesChange={() => {
                    // Reload services after upload
                    loadServices();
                  }}
                  maxImages={5}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
