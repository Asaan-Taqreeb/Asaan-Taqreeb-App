import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, Edit, Package } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';

// Mock data - in real app, fetch from backend
const mockPackages = [
  {
    id: '1',
    name: 'Premium Wedding Package',
    price: 150000,
    description: 'Complete wedding setup with decoration, sound system, and catering',
    items: ['Hall Decoration', 'Sound System', 'Stage Setup', 'Lighting'],
  },
  {
    id: '2',
    name: 'Standard Package',
    price: 80000,
    description: 'Basic hall booking with essential amenities',
    items: ['Hall Booking', 'Basic Sound System', 'Seating Arrangement'],
  },
  {
    id: '3',
    name: 'Deluxe Package',
    price: 200000,
    description: 'Luxury package with premium services',
    items: ['Premium Decoration', 'Professional DJ', 'Photography', 'Catering'],
  },
];

export default function PackageManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState(mockPackages);

  const handleAddPackage = () => {
    router.push('/screens/vendor/Component/AddEditPackageScreen');
  };

  const handleEditPackage = (packageId: string) => {
    router.push({
      pathname: '/screens/vendor/Component/AddEditPackageScreen',
      params: { packageId }
    });
  };

  const handleDeletePackage = (packageId: string, packageName: string) => {
    Alert.alert(
      'Delete Package',
      `Are you sure you want to delete "${packageName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPackages(packages.filter(pkg => pkg.id !== packageId));
            Alert.alert('Success', 'Package deleted successfully');
            // In real app, delete from backend
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: Colors.vendor + '15' }}
          >
            <ArrowLeft size={22} color={Colors.vendor} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ color: Colors.textPrimary }}>
            My Packages
          </Text>
          <View className="w-11" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Add New Package Button */}
        <View className="px-5 mt-5">
          <TouchableOpacity
            onPress={handleAddPackage}
            activeOpacity={0.8}
            className="rounded-2xl p-5 flex-row items-center justify-center border-2 border-dashed"
            style={{ borderColor: Colors.vendor }}
          >
            <Plus size={24} color={Colors.vendor} />
            <Text className="text-base font-semibold ml-2" style={{ color: Colors.vendor }}>
              Add New Package
            </Text>
          </TouchableOpacity>
        </View>

        {/* Packages List */}
        <View className="px-5 mt-6">
          <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
            YOUR PACKAGES ({packages.length})
          </Text>

          {packages.map((pkg) => (
            <View
              key={pkg.id}
              className="bg-white rounded-2xl p-4 mb-4"
              style={Shadows.small}
            >
              {/* Package Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-start flex-1">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: Colors.vendor + '20' }}
                  >
                    <Package size={24} color={Colors.vendor} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold" style={{ color: Colors.textPrimary }}>
                      {pkg.name}
                    </Text>
                    <Text className="text-lg font-bold mt-1" style={{ color: Colors.vendor }}>
                      PKR {pkg.price.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              <Text className="text-sm text-gray-600 mb-3 leading-5">
                {pkg.description}
              </Text>

              {/* Items */}
              <View className="bg-gray-50 rounded-xl p-3 mb-3">
                <Text className="text-xs font-semibold text-gray-400 mb-2">INCLUDES:</Text>
                {pkg.items.map((item, index) => (
                  <View key={index} className="flex-row items-center mb-1">
                    <View className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
                    <Text className="text-sm text-gray-700">{item}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => handleEditPackage(pkg.id)}
                  className="flex-1 bg-gray-100 rounded-xl py-3 flex-row items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Edit size={18} color={Colors.textPrimary} />
                  <Text className="text-sm font-semibold ml-2" style={{ color: Colors.textPrimary }}>
                    Edit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeletePackage(pkg.id, pkg.name)}
                  className="flex-1 bg-red-50 rounded-xl py-3 flex-row items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color="#EF4444" />
                  <Text className="text-sm font-semibold text-red-500 ml-2">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {packages.length === 0 && (
            <View className="items-center justify-center py-20">
              <Package size={48} color="#D1D5DB" />
              <Text className="text-gray-400 text-base mt-4">No packages yet</Text>
              <Text className="text-gray-400 text-sm mt-2">
                Create your first package to get started
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
