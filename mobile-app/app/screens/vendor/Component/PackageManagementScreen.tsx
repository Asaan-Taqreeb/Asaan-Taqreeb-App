import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, Edit, Package } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { createVendorService, getMyVendorServices, deleteVendorService, updateVendorService, type ServiceListItem } from '@/app/_utils/servicesApi';

type UiPackage = {
  id: string
  name: string
  price: number
  description: string
  items: string[]
}

type UiOptionalService = {
  id: string
  name: string
  price: number
  category: string
}

type UiOptionalDraft = {
  id: string
  name: string
  price: string
  category: string
}

export default function PackageManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<ServiceListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showOptionalManager, setShowOptionalManager] = useState(false)
  const [optionalDraft, setOptionalDraft] = useState<UiOptionalDraft[]>([])
  const [isSavingOptionalServices, setIsSavingOptionalServices] = useState(false)
  const [isDeletingService, setIsDeletingService] = useState(false)

  const activeService = useMemo(() => {
    if (!services.length) return null

    return [...services].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime()
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime()
      return bTime - aTime
    })[0]
  }, [services])

  const packages: UiPackage[] = useMemo(() => {
    if (!activeService) return []

    const fallbackItems = [activeService.name, activeService.category]
    const serviceDescription = activeService.about || `Package from ${activeService.name}`

    return (activeService.packages || []).map((pkg, index) => ({
      id: String(index),
      name: String(pkg.packageName || `Package ${index + 1}`),
      price: Number(pkg.price || 0),
      description: serviceDescription,
      items:
        Array.isArray(pkg.items) && pkg.items.length > 0
          ? pkg.items
          : [
              ...(Array.isArray(pkg.mainCourse) ? pkg.mainCourse : []),
              ...(Array.isArray(pkg.desserts) ? pkg.desserts : []),
              ...(Array.isArray(pkg.drinks) ? pkg.drinks : []),
            ].length > 0
              ? [
                  ...(Array.isArray(pkg.mainCourse) ? pkg.mainCourse : []),
                  ...(Array.isArray(pkg.desserts) ? pkg.desserts : []),
                  ...(Array.isArray(pkg.drinks) ? pkg.drinks : []),
                ]
              : fallbackItems,
    }))
  }, [activeService])

  const optionalServices: UiOptionalService[] = useMemo(() => {
    if (!activeService) return []

    return (activeService.optionalServices || []).map((item, index) => ({
      id: `${activeService.serviceId || activeService.id}-optional-${index}`,
      name: String(item.name || `Optional ${index + 1}`),
      price: Number(item.price || 0),
      category: activeService.category,
    }))
  }, [activeService])

  React.useEffect(() => {
    if (!showOptionalManager) return

    setOptionalDraft(
      optionalServices.length > 0
        ? optionalServices.map((item, index) => ({
            id: item.id,
            name: item.name,
            price: String(item.price),
            category: item.category,
          }))
        : [{ id: 'new-1', name: '', price: '', category: activeService?.category || 'banquet' }]
    )
  }, [showOptionalManager, optionalServices, activeService?.category])

  const primaryCategory = activeService?.category

  const getServiceFormRoute = () => {
    if (primaryCategory === 'banquet') return '/screens/vendor/BanquetServiceForm'
    if (primaryCategory === 'catering') return '/screens/vendor/CateringServiceForm'
    if (primaryCategory === 'photo') return '/screens/vendor/PhotographyServiceForm'
    if (primaryCategory === 'parlor') return '/screens/vendor/ParlorServiceForm'
    return null
  }

  const openServiceForm = () => {
    const route = getServiceFormRoute()
    if (!route) {
      Alert.alert('Info', 'Create a service first to manage packages.')
      return
    }
    router.push(route)
  }

  const openOptionalManager = () => {
    if (!activeService) {
      Alert.alert('Info', 'Create a service first to manage optional items.')
      return
    }

    setShowOptionalManager(true)
  }

  const addOptionalDraft = () => {
    setOptionalDraft((current) => [
      ...current,
      {
        id: `new-${Date.now()}-${current.length}`,
        name: '',
        price: '',
        category: activeService?.category || 'banquet',
      },
    ])
  }

  const updateOptionalDraft = (id: string, field: 'name' | 'price', value: string) => {
    setOptionalDraft((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === 'price' ? value.replace(/[^0-9]/g, '') : value,
            }
          : item
      )
    )
  }

  const removeOptionalDraft = (id: string) => {
    setOptionalDraft((current) => current.filter((item) => item.id !== id))
  }

  const saveOptionalDraft = async () => {
    if (!activeService) return

    const hasPartialRow = optionalDraft.some((item) => {
      const hasName = item.name.trim().length > 0
      const hasPrice = item.price.trim().length > 0
      return (hasName && !hasPrice) || (!hasName && hasPrice)
    })

    if (hasPartialRow) {
      Alert.alert('Error', 'Each optional service needs both a name and a price, or leave the row blank.')
      return
    }

    const nextOptionalServices = optionalDraft
      .map((item) => ({
        name: String(item.name || '').trim(),
        price: Number(item.price || 0),
      }))
      .filter((item) => item.name.length > 0)

    try {
      setIsSavingOptionalServices(true)

      await updateVendorService(activeService.id || activeService.serviceId, {
        optionalServices: nextOptionalServices,
      })

      setShowOptionalManager(false)
      Alert.alert('Success', 'Optional services updated successfully.')
      loadPackages()
    } catch (error: any) {
      Alert.alert('Failed', error?.message || 'Unable to update optional services right now.')
    } finally {
      setIsSavingOptionalServices(false)
    }
  }

  const loadPackages = React.useCallback(async () => {
    try {
      const data = await getMyVendorServices()
      setServices(data)
    } catch (error: any) {
      setServices([])
      Alert.alert('Failed', error?.message || 'Unable to load your packages right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true)
      loadPackages()
    }, [loadPackages])
  )

  const handleAddPackage = () => {
    router.push('/screens/vendor/Component/AddEditPackageScreen');
  };

  const handleEditPackage = (pkg: UiPackage) => {
    router.push({
      pathname: '/screens/vendor/Component/AddEditPackageScreen',
      params: { packageId: pkg.id, packageData: JSON.stringify(pkg) }
    });
  };

  const handleDeletePackage = (packageId: string, packageName: string) => {
    if (!activeService) return

    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${activeService.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingService(true)
              await deleteVendorService(activeService.id || activeService.serviceId)
              Alert.alert('Success', 'Service deleted successfully.')
              loadPackages()
            } catch (error: any) {
              Alert.alert('Failed', error?.message || 'Unable to delete service. Please try again.')
            } finally {
              setIsDeletingService(false)
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

          {isLoading && (
            <View className="bg-white rounded-2xl p-4 mb-4" style={Shadows.small}>
              <Text className="text-sm text-gray-500">Loading your packages...</Text>
            </View>
          )}

          {!isLoading && packages.map((pkg) => (
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
                  onPress={() => handleEditPackage(pkg)}
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

          {!isLoading && packages.length === 0 && (
            <View className="items-center justify-center py-20">
              <Package size={48} color="#D1D5DB" />
              <Text className="text-gray-400 text-base mt-4">No packages yet</Text>
              <Text className="text-gray-400 text-sm mt-2">
                Create your first package to get started
              </Text>
            </View>
          )}
        </View>

        {/* Optional Services */}
        <View className="px-5 mt-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold text-gray-400 tracking-wider">
              OPTIONAL SERVICES ({optionalServices.length})
            </Text>
            <TouchableOpacity
              onPress={openOptionalManager}
              className="px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: Colors.vendor + '20' }}
              activeOpacity={0.8}
            >
              <Text className="text-xs font-bold" style={{ color: Colors.vendor }}>
                Manage
              </Text>
            </TouchableOpacity>
          </View>

          {!isLoading && optionalServices.length > 0 && optionalServices.map((item) => (
            <View key={item.id} className="bg-white rounded-2xl p-4 mb-3" style={Shadows.small}>
              <View className="flex-row justify-between items-center">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-bold" style={{ color: Colors.textPrimary }}>
                    {item.name}
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: Colors.textSecondary }}>
                    {item.category === 'catering' ? 'Optional Dish' : 'Optional Service'}
                  </Text>
                </View>
                <Text className="text-base font-extrabold" style={{ color: Colors.vendor }}>
                  PKR {item.price.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}

          {!isLoading && optionalServices.length === 0 && (
            <View className="bg-white rounded-2xl p-4 mb-4" style={Shadows.small}>
              <Text className="text-sm text-gray-500">
                No optional services saved yet. Add them in your service form and submit again.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showOptionalManager}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionalManager(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View className="bg-white rounded-t-3xl p-5" style={{ maxHeight: '80%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-xl font-extrabold" style={{ color: Colors.textPrimary }}>
                  Optional Services
                </Text>
                <Text className="text-xs font-medium mt-1" style={{ color: Colors.textSecondary }}>
                  {activeService?.name || 'No active service'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowOptionalManager(false)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: Colors.lightGray }}
              >
                <Text className="text-lg font-bold" style={{ color: Colors.textPrimary }}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <Text className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                  Add, edit, or remove optional services for the active package.
                </Text>
              </View>

              {optionalDraft.length > 0 ? optionalDraft.map((item, index) => (
                <View key={item.id} className="bg-gray-50 rounded-2xl p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs font-semibold tracking-wider" style={{ color: Colors.textSecondary }}>
                      OPTIONAL ITEM {index + 1}
                    </Text>
                    <TouchableOpacity onPress={() => removeOptionalDraft(item.id)}>
                      <Text className="text-xs font-bold" style={{ color: '#EF4444' }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="mb-3">
                    <Text className="text-xs font-semibold mb-2" style={{ color: Colors.textPrimary }}>
                      Name
                    </Text>
                    <TextInput
                      value={item.name}
                      onChangeText={(value) => updateOptionalDraft(item.id, 'name', value)}
                      placeholder="e.g., Extra Lighting"
                      placeholderTextColor="#9CA3AF"
                      className="bg-white rounded-xl px-4 py-3 text-base"
                      style={{
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        color: Colors.textPrimary,
                      }}
                    />
                  </View>

                  <View>
                    <Text className="text-xs font-semibold mb-2" style={{ color: Colors.textPrimary }}>
                      Price
                    </Text>
                    <TextInput
                      value={item.price ? String(item.price) : ''}
                      onChangeText={(value) => updateOptionalDraft(item.id, 'price', value)}
                      placeholder="e.g., 5000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      className="bg-white rounded-xl px-4 py-3 text-base"
                      style={{
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        color: Colors.textPrimary,
                      }}
                    />
                  </View>
                </View>
              )) : (
                <View className="bg-gray-50 rounded-2xl p-4">
                  <Text className="text-sm" style={{ color: Colors.textSecondary }}>
                    No optional items yet. Tap Add Item to create one.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={addOptionalDraft}
                className="rounded-2xl py-4 items-center mt-1"
                style={{ backgroundColor: Colors.lightGray }}
                activeOpacity={0.8}
              >
                <Text className="font-bold" style={{ color: Colors.textPrimary }}>
                  Add Item
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              onPress={saveOptionalDraft}
              className="mt-4 rounded-2xl py-4 items-center"
              style={{ backgroundColor: Colors.vendor }}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold">
                {isSavingOptionalServices ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
