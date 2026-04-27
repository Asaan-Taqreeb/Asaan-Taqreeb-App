import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';
import { createVendorService, getMyVendorServices } from '@/app/_utils/servicesApi';

export default function AddEditPackageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { packageId, packageData } = useLocalSearchParams<{ packageId?: string; packageData?: string }>();
  
  const isEditMode = !!packageId;
  const [isSaving, setIsSaving] = useState(false)

  const existingPackage = React.useMemo(() => {
    if (!isEditMode || !packageData) return null
    try {
      const parsed = JSON.parse(String(packageData))
      return {
        name: String(parsed?.name || ''),
        price: String(parsed?.price ?? ''),
        description: String(parsed?.description || ''),
        items: Array.isArray(parsed?.items) && parsed.items.length > 0 ? parsed.items.map((item: any) => String(item)) : [''],
      }
    } catch {
      return null
    }
  }, [isEditMode, packageData])

  const [packageName, setPackageName] = useState(existingPackage?.name || '');
  const [price, setPrice] = useState(existingPackage?.price || '');
  const [description, setDescription] = useState(existingPackage?.description || '');
  const [items, setItems] = useState<string[]>(existingPackage?.items || ['']);

  const addItem = () => {
    setItems([...items, '']);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      Alert.alert('Error', 'At least one item is required');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    // Validation
    if (!packageName.trim()) {
      Alert.alert('Error', 'Please enter package name');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Error', 'Please enter package price');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter package description');
      return;
    }
    if (items.every(item => !item.trim())) {
      Alert.alert('Error', 'Please add at least one item to the package');
      return;
    }

    try {
      setIsSaving(true)

      const services = await getMyVendorServices()
      if (!services.length) {
        Alert.alert('Error', 'No existing service found for this vendor account.')
        return
      }

      const activeService = [...services].sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return bTime - aTime
      })[0]

      if (activeService.category === 'catering') {
        Alert.alert('Info', 'For catering packages (pricePerHead/guestCount), please use the Catering Service form.')
        return
      }

      const packagePayload = {
        packageName: packageName.trim(),
        price: parseFloat(price),
        items: items.filter(item => item.trim()),
      }

      const existingPackages = (activeService.packages || []).map((pkg) => ({
        packageName: String(pkg.packageName || ''),
        price: Number(pkg.price || 0),
        items: Array.isArray(pkg.items) ? pkg.items : [],
      }))

      const updatedPackages = [...existingPackages]
      if (isEditMode) {
        const index = Number(packageId)
        if (Number.isFinite(index) && index >= 0 && index < updatedPackages.length) {
          updatedPackages[index] = packagePayload
        } else {
          updatedPackages.push(packagePayload)
        }
      } else {
        updatedPackages.push(packagePayload)
      }

      await createVendorService({
        category: activeService.category,
        serviceType: activeService.category,
        name: activeService.name,
        location: activeService.location,
        about: activeService.about,
        minGuests: activeService.minGuests,
        maxGuests: activeService.maxGuests,
        packages: updatedPackages,
        optionalServices: activeService.optionalServices || [],
        optionalDishes: activeService.optionalServices || [],
      })

      Alert.alert(
        'Success',
        isEditMode ? 'Package updated successfully!' : 'Package created successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (error: any) {
      Alert.alert('Failed', error?.message || 'Unable to save package. Please try again.')
    } finally {
      setIsSaving(false)
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
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
              {isEditMode ? 'Edit Package' : 'Add New Package'}
            </Text>
            <View className="w-11" />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        >
          {/* Package Name */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Package Name *
            </Text>
            <TextInput
              value={packageName}
              onChangeText={setPackageName}
              placeholder="e.g., Premium Wedding Package"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
              }}
            />
          </View>

          {/* Price */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Price (PKR) *
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="e.g., 150000"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
              }}
            />
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Description *
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what's included in this package"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
                minHeight: 100,
              }}
            />
          </View>

          {/* Package Items */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
                Package Items *
              </Text>
              <TouchableOpacity
                onPress={addItem}
                className="flex-row items-center px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: Colors.vendor + '20' }}
                activeOpacity={0.7}
              >
                <Plus size={16} color={Colors.vendor} />
                <Text className="text-sm font-semibold ml-1" style={{ color: Colors.vendor }}>
                  Add Item
                </Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <TextInput
                  value={item}
                  onChangeText={(value) => updateItem(index, value)}
                  placeholder={`Item ${index + 1}`}
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 bg-white rounded-xl px-4 py-3 text-base"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    color: Colors.textPrimary,
                  }}
                />
                {items.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeItem(index)}
                    className="ml-3 w-10 h-10 rounded-full bg-red-50 items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <X size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Info Note */}
          <View className="bg-blue-50 rounded-xl p-4 mb-5">
            <Text className="text-sm text-blue-900 leading-5">
              💡 Tip: Be specific about what&apos;s included in your package. Clear descriptions help customers make informed decisions.
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="px-5 pb-5 pt-3 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSave}
            className="rounded-2xl py-4 items-center justify-center"
            style={{ backgroundColor: Colors.vendor }}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Text className="text-white text-base font-bold">
              {isSaving ? 'Saving...' : isEditMode ? 'Update Package' : 'Create Package'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
