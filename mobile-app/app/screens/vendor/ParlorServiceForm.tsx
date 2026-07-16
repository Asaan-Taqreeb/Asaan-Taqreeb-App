import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Sparkles, Plus, Trash2, X } from "lucide-react-native";
import { Colors, Shadows } from "@/app/_constants/theme";
import { showAlert } from "@/app/_utils/alert";
import { useState, useEffect } from "react";
import { createVendorService, updateVendorService, getServiceById } from '@/app/_utils/servicesApi'
import ImageUploader from "@/app/screens/vendor/Component/ImageUploader";
import LocationPicker from "@/app/_components/LocationPicker";
import { uploadMultipleToCloudinary, isCloudinaryConfigured } from '@/app/_utils/cloudinaryUpload';
import { useUser } from "@/app/_context/UserContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Package {
  id: string;
  packageName: string;
  price: string;
  items: string[];
}

interface Branch {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  operatingHours: { from: string; to: string };
}

export default function ParlorServiceForm() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { serviceId, edit } = useLocalSearchParams<{ serviceId: string; edit: string }>();
  const isEditMode = edit === 'true' && !!serviceId;
  
  // Common fields
  const [placeName, setPlaceName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [nearbyLandmark, setNearbyLandmark] = useState("");
  const [about, setAbout] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isOnSite, setIsOnSite] = useState(false);
  const [onSiteFee, setOnSiteFee] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Operating Hours
  const [operatingHours, setOperatingHours] = useState({ from: "09:00 AM", to: "09:00 PM" });
  
  // Packages
  const [packages, setPackages] = useState<Package[]>([
    { id: "1", packageName: "", price: "", items: [""] }
  ]);
  
  // Optional Services
  const [optionalServices, setOptionalServices] = useState<{id: string; name: string; price: string}[]>([
    { id: "1", name: "", price: "" }
  ]);
  
  // Branches list
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (isEditMode) {
      loadServiceData();
    }
  }, [serviceId]);

  useEffect(() => {
    if (user?.id) {
      loadOperatingHours();
    }
  }, [user?.id]);

  const loadOperatingHours = async () => {
    try {
      const saved = await AsyncStorage.getItem('vendor_operating_hours_' + user?.id);
      if (saved) {
        setOperatingHours(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Failed to load operating hours:', error);
    }
  };

  const loadServiceData = async () => {
    try {
      const data = await getServiceById(serviceId!);
      if (data) {
        setPlaceName(data.name || "");
        setLocation(data.location || "");
        setAbout(data.about || "");
        setImages(data.images || []);
        if (data.latitude) setLatitude(data.latitude);
        if (data.longitude) setLongitude(data.longitude);
        setIsOnSite(data.isOnSite || false);
        setOnSiteFee(data.onSiteFee ? data.onSiteFee.toString() : "");
        if (data.operatingHours) {
          setOperatingHours(data.operatingHours);
        }
        
        if (data.packages && data.packages.length > 0) {
          setPackages(data.packages.map((pkg, idx) => ({
            id: pkg.id?.toString() || (idx + 1).toString(),
            packageName: pkg.packageName,
            price: pkg.price.toString(),
            items: pkg.items && pkg.items.length > 0 ? pkg.items : [""]
          })));
        }

        if (data.optionalServices && data.optionalServices.length > 0) {
          setOptionalServices(data.optionalServices.map((s, idx) => ({
            id: (idx + 1).toString(),
            name: s.name,
            price: s.price.toString()
          })));
        }

        if (data.branches && data.branches.length > 0) {
          setBranches(data.branches.map((b, idx) => ({
            id: b.id || (idx + 1).toString(),
            name: b.name,
            location: b.location,
            latitude: b.latitude,
            longitude: b.longitude,
            operatingHours: {
              from: b.operatingHours?.from || "09:00 AM",
              to: b.operatingHours?.to || "09:00 PM"
            }
          })));
        }
      }
    } catch (error) {
      showAlert("Error", "Failed to load service details");
      router.back();
    } finally {
      setIsInitialLoading(false);
    }
  };

  const addPackage = () => {
    const newId = (packages.length + 1).toString();
    setPackages([...packages, { id: newId, packageName: "", price: "", items: [""] }]);
  };

  const removePackage = (id: string) => {
    if (packages.length === 1) {
      showAlert("Error", "At least one package is required");
      return;
    }
    setPackages(packages.filter(pkg => pkg.id !== id));
  };

  const updatePackage = (id: string, field: keyof Package, value: string) => {
    setPackages(packages.map(pkg => 
      pkg.id === id ? { ...pkg, [field]: value } : pkg
    ));
  };

  const addItemToPackage = (packageId: string) => {
    setPackages(packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, items: [...pkg.items, ""] } : pkg
    ));
  };

  const removeItemFromPackage = (packageId: string, itemIndex: number) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const newItems = pkg.items.filter((_, idx) => idx !== itemIndex);
        return { ...pkg, items: newItems.length > 0 ? newItems : [""] };
      }
      return pkg;
    }));
  };

  const updatePackageItem = (packageId: string, itemIndex: number, value: string) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const newItems = [...pkg.items];
        newItems[itemIndex] = value;
        return { ...pkg, items: newItems };
      }
      return pkg;
    }));
  };

  // Optional Services handlers
  const addOptionalService = () => {
    const newId = (optionalServices.length + 1).toString();
    setOptionalServices([...optionalServices, { id: newId, name: "", price: "" }]);
  };

  const removeOptionalService = (id: string) => {
    if (optionalServices.length === 1) {
      showAlert("Info", "Optional services section will remain. You can leave fields empty if not needed.");
      return;
    }
    setOptionalServices(optionalServices.filter(service => service.id !== id));
  };

  const updateOptionalService = (id: string, field: 'name' | 'price', value: string) => {
    setOptionalServices(optionalServices.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  // Branches handlers
  const addBranch = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    setBranches([...branches, {
      id: newId,
      name: "",
      location: "",
      operatingHours: { from: "09:00 AM", to: "09:00 PM" }
    }]);
  };

  const removeBranch = (id: string) => {
    setBranches(branches.filter(b => b.id !== id));
  };

  const updateBranchField = (id: string, field: keyof Branch, value: any) => {
    setBranches(prev => prev.map(b => 
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  const updateBranchFields = (id: string, updates: Partial<Branch>) => {
    setBranches(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  };

  const handleSubmit = async () => {
    // Validation
    if (!placeName.trim()) {
      showAlert("Error", "Please enter your salon/parlor name");
      return;
    }
    if (!location.trim()) {
      showAlert("Error", "Please enter the location");
      return;
    }
    if (!about.trim()) {
      showAlert("Error", "Please provide information about your parlor/salon");
      return;
    }
    if (isOnSite && !onSiteFee.trim()) {
      showAlert("Error", "Please enter your travel / on-site service fee");
      return;
    }
    
    setIsSubmitting(true);
    
    // Validate packages
    for (const pkg of packages) {
      if (!pkg.packageName.trim() || !pkg.price.trim()) {
        showAlert("Error", "Please complete all package details");
        setIsSubmitting(false);
        return;
      }
    }

    // Validate branches
    for (const b of branches) {
      if (!b.name.trim() || !b.location.trim()) {
        showAlert("Error", "Please complete all branch names and locations");
        setIsSubmitting(false);
        return;
      }
    }

    // Validate operating hours
    if (!operatingHours.from.trim() || !operatingHours.to.trim()) {
      showAlert("Error", "Please complete operating hours");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      placeName,
      location,
      nearbyLandmark,
      about,
      latitude,
      longitude,
      images,
      isOnSite,
      onSiteFee: isOnSite ? parseFloat(onSiteFee) || 0 : 0,
      operatingHours,
      packages: packages.map(pkg => ({
        packageName: pkg.packageName,
        price: parseFloat(pkg.price),
        items: pkg.items.filter(item => item.trim())
      })),
      optionalServices: optionalServices
        .filter(service => service.name.trim() && service.price.trim())
        .map(service => ({
          name: service.name,
          price: parseFloat(service.price)
        })),
      branches: branches.map(b => ({
        id: b.id,
        name: b.name,
        location: b.location,
        latitude: b.latitude,
        longitude: b.longitude,
        operatingHours: b.operatingHours
      }))
    };

    try {
      if (isEditMode) {
        await updateVendorService(serviceId!, payload);
        if (user?.id) {
          await AsyncStorage.setItem('vendor_operating_hours_' + user.id, JSON.stringify(operatingHours));
        }
        showAlert("Success", "Service updated successfully.", [
          { text: "OK", onPress: () => router.replace('/screens/vendor/Component/ManageServicesScreen') }
        ]);
      } else {
        const result = await createVendorService({
          category: 'parlor',
          serviceType: 'parlor',
          ...payload,
        });

        if (user?.id) {
          await AsyncStorage.setItem('vendor_operating_hours_' + user.id, JSON.stringify(operatingHours));
        }

        // Upload images to Cloudinary for new service
        const newServiceId = result?._id || result?.id || result?.data?._id || result?.data?.id;
        if (newServiceId && images.length > 0) {
          if (isCloudinaryConfigured()) {
            const cloudinaryUrls = await uploadMultipleToCloudinary(images);
            if (cloudinaryUrls.length > 0) {
              await updateVendorService(newServiceId, { images: cloudinaryUrls });
            }
          }
        }

        showAlert("Success", "Parlor service created successfully.", [
          { text: "OK", onPress: () => router.replace('/screens/vendor/Component/ManageServicesScreen') }
        ]);
      }
    } catch (error: any) {
      showAlert('Failed', error?.message || 'Unable to save service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 font-bold" style={{ color: Colors.textSecondary }}>Loading Service Details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{flex: 1}} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.top}
    >
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      {/* Header */}
      <View className='flex-row items-center gap-4 px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
        <Pressable 
          className='rounded-full p-2 active:opacity-70' 
          style={{backgroundColor: Colors.lightGray}} 
          onPress={() => router.back()}
        >
          <ArrowLeft color={Colors.parlor} size={24} />
        </Pressable>
        <View className='flex-row items-center gap-3 flex-1'>
          <View className='rounded-full p-2' style={{backgroundColor: `${Colors.parlor}20`}}>
            <Sparkles size={24} color={Colors.parlor} />
          </View>
          <View>
            <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>Parlor/Salon Service</Text>
            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Setup your beauty services</Text>
          </View>
        </View>
      </View>

      {/* Form Content */}
      <ScrollView className='flex-1 px-5 py-6' showsVerticalScrollIndicator={false}>
        {/* Common Fields */}
        <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
          <Text className='text-lg font-extrabold mb-4' style={{color: Colors.textPrimary}}>Basic Information</Text>
          
          <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Salon/Parlor Name *</Text>
          <TextInput
            style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
            placeholder="e.g., Glamour Salon"
            placeholderTextColor={Colors.textTertiary}
            value={placeName}
            onChangeText={setPlaceName}
          />

          <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Location *</Text>
          <LocationPicker 
            initialLocation={{
              address: location,
              latitude: latitude,
              longitude: longitude
            }}
            onLocationSelect={(loc) => {
              setLocation(loc.address);
              setLatitude(loc.latitude);
              setLongitude(loc.longitude);
            }}
          />

          <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Nearby Landmark (Optional)</Text>
          <TextInput
            style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
            placeholder="e.g., Near Star Mall"
            placeholderTextColor={Colors.textTertiary}
            value={nearbyLandmark}
            onChangeText={setNearbyLandmark}
          />

          <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>About Your Salon *</Text>
          <TextInput
            style={[styles.input, styles.textArea, {borderColor: Colors.border, color: Colors.textPrimary}]}
            placeholder="Describe your salon, services offered, expertise, and what makes your service special..."
            placeholderTextColor={Colors.textTertiary}
            value={about}
            onChangeText={setAbout}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View className='flex-row justify-between items-center mt-5 p-3 rounded-xl border border-slate-100 bg-slate-50'>
              <View className='flex-1 pr-4'>
                  <Text className='text-sm font-extrabold' style={{color: Colors.textPrimary}}>
                      Offer On-Site (Home/Venue) Services?
                  </Text>
                  <Text className='text-[10px] font-semibold text-slate-400 mt-0.5'>
                      Check this if you travel to the client&apos;s location for beauty services.
                  </Text>
              </View>
              <Pressable
                  onPress={() => setIsOnSite(!isOnSite)}
                  className='px-4 py-2 rounded-xl'
                  style={{ backgroundColor: isOnSite ? Colors.parlor : Colors.lightGray }}
              >
                  <Text className='text-xs font-bold text-white' style={{ color: isOnSite ? Colors.white : Colors.textSecondary }}>
                      {isOnSite ? "YES" : "NO"}
                  </Text>
              </Pressable>
          </View>

          {isOnSite && (
              <View className='mt-4'>
                  <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>
                      On-Site / Travel Additional Fee (PKR) *
                  </Text>
                  <TextInput
                      style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                      placeholder="e.g., 5000"
                      placeholderTextColor={Colors.textTertiary}
                      value={onSiteFee}
                      onChangeText={setOnSiteFee}
                      keyboardType="numeric"
                  />
              </View>
          )}
        </View>

        {/* Salon Branches */}
        <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
          <View className='flex-row justify-between items-center mb-4'>
            <View className='flex-1 pr-2'>
              <Text className='text-lg font-extrabold' style={{color: Colors.textPrimary}}>Salon Branches / Outlets</Text>
              <Text className='text-[10px] font-medium text-slate-400 mt-0.5'>Add other branch locations for in-salon booking selection</Text>
            </View>
            <Pressable 
              className='flex-row items-center gap-2 px-4 py-2 rounded-lg active:opacity-70'
              style={{backgroundColor: Colors.parlor}}
              onPress={addBranch}
            >
              <Plus size={18} color={Colors.white} />
              <Text className='text-sm font-bold' style={{color: Colors.white}}>Add Branch</Text>
            </Pressable>
          </View>

          {branches.length === 0 ? (
            <View className='p-4 rounded-xl border border-dashed justify-center items-center' style={{borderColor: Colors.border, backgroundColor: Colors.background}}>
              <Text className='text-xs font-semibold' style={{color: Colors.textTertiary}}>No additional branches added yet</Text>
            </View>
          ) : (
            branches.map((b, bIdx) => (
              <View key={b.id} className='mb-4 p-4 rounded-xl' style={{backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border}}>
                <View className='flex-row justify-between items-center mb-3'>
                  <Text className='text-base font-bold' style={{color: Colors.textPrimary}}>Branch {bIdx + 1}</Text>
                  <Pressable onPress={() => removeBranch(b.id)} className='p-2 rounded-lg active:opacity-70' style={{backgroundColor: '#ff000020'}}>
                    <Trash2 size={18} color="#ff0000" />
                  </Pressable>
                </View>

                <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Branch Name *</Text>
                <TextInput
                  style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                  placeholder="e.g., Clifton Branch, DHA Outlet"
                  placeholderTextColor={Colors.textTertiary}
                  value={b.name}
                  onChangeText={(val) => updateBranchField(b.id, 'name', val)}
                />

                <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Branch Location *</Text>
                <LocationPicker 
                  initialLocation={{
                    address: b.location,
                    latitude: b.latitude,
                    longitude: b.longitude
                  }}
                  onLocationSelect={(loc) => {
                    updateBranchFields(b.id, {
                      location: loc.address,
                      latitude: loc.latitude,
                      longitude: loc.longitude
                    });
                  }}
                />

                <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Operating Hours</Text>
                <View className='flex-row gap-3'>
                  <View className='flex-1'>
                    <Text className='text-xs font-semibold mb-1' style={{color: Colors.textTertiary}}>Start Time</Text>
                    <TextInput
                      style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                      placeholder="09:00 AM"
                      placeholderTextColor={Colors.textTertiary}
                      value={b.operatingHours.from}
                      onChangeText={(val) => updateBranchField(b.id, 'operatingHours', { ...b.operatingHours, from: val })}
                    />
                  </View>
                  <View className='flex-1'>
                    <Text className='text-xs font-semibold mb-1' style={{color: Colors.textTertiary}}>End Time</Text>
                    <TextInput
                      style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                      placeholder="09:00 PM"
                      placeholderTextColor={Colors.textTertiary}
                      value={b.operatingHours.to}
                      onChangeText={(val) => updateBranchField(b.id, 'operatingHours', { ...b.operatingHours, to: val })}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <ImageUploader
          images={images}
          onImagesChange={setImages}
          maxImages={5}
        />

        {/* Packages */}
        <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-lg font-extrabold' style={{color: Colors.textPrimary}}>Beauty Packages</Text>
            <Pressable 
              className='flex-row items-center gap-2 px-4 py-2 rounded-lg active:opacity-70'
              style={{backgroundColor: Colors.parlor}}
              onPress={addPackage}
            >
              <Plus size={18} color={Colors.white} />
              <Text className='text-sm font-bold' style={{color: Colors.white}}>Add Package</Text>
            </Pressable>
          </View>

          {packages.map((pkg, pkgIndex) => (
            <View key={pkg.id} className='mb-4 p-4 rounded-xl' style={{backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border}}>
              <View className='flex-row justify-between items-center mb-3'>
                <Text className='text-base font-bold' style={{color: Colors.textPrimary}}>Package {pkgIndex + 1}</Text>
                {packages.length > 1 && (
                  <Pressable onPress={() => removePackage(pkg.id)} className='p-2 rounded-lg active:opacity-70' style={{backgroundColor: '#ff000020'}}>
                    <Trash2 size={18} color="#ff0000" />
                  </Pressable>
                )}
              </View>

              <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Package Name *</Text>
              <TextInput
                style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                placeholder="e.g., Bridal Makeup, Full Bridal Package"
                placeholderTextColor={Colors.textTertiary}
                value={pkg.packageName}
                onChangeText={(value) => updatePackage(pkg.id, 'packageName', value)}
              />

              <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Price (PKR) *</Text>
              <TextInput
                style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                placeholder="25000"
                placeholderTextColor={Colors.textTertiary}
                value={pkg.price}
                onChangeText={(value) => updatePackage(pkg.id, 'price', value)}
                keyboardType="numeric"
              />

              <View className='flex-row justify-between items-center mt-3 mb-2'>
                <Text className='text-sm font-semibold' style={{color: Colors.textSecondary}}>Services Included *</Text>
                <Pressable 
                  className='flex-row items-center gap-1 px-3 py-1 rounded active:opacity-70'
                  style={{backgroundColor: Colors.parlor}}
                  onPress={() => addItemToPackage(pkg.id)}
                >
                  <Plus size={14} color={Colors.white} />
                  <Text className='text-xs font-bold' style={{color: Colors.white}}>Add</Text>
                </Pressable>
              </View>

              {pkg.items.map((item, itemIndex) => (
                <View key={itemIndex} className='flex-row gap-2 mb-2'>
                  <TextInput
                    style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary, flex: 1}]}
                    placeholder="e.g., Professional Makeup, Hair Styling, Nail Art"
                    placeholderTextColor={Colors.textTertiary}
                    value={item}
                    onChangeText={(value) => updatePackageItem(pkg.id, itemIndex, value)}
                  />
                  {pkg.items.length > 1 && (
                    <Pressable 
                      className='justify-center items-center p-2 rounded active:opacity-70'
                      style={{backgroundColor: '#ff000020'}}
                      onPress={() => removeItemFromPackage(pkg.id, itemIndex)}
                    >
                      <X size={18} color="#ff0000" />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
        {/* Operating Hours Section */}
        <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
          <Text className='text-lg font-extrabold mb-1' style={{color: Colors.textPrimary}}>Operating Hours</Text>
          <Text className='text-xs font-medium mb-4' style={{color: Colors.textSecondary}}>Define your daily operating hours (e.g. 09:00 AM to 09:00 PM)</Text>
          
          <View className='flex-row gap-3'>
            <View className='flex-1'>
              <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Start Time *</Text>
              <TextInput
                style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                placeholder="09:00 AM"
                placeholderTextColor={Colors.textTertiary}
                value={operatingHours.from}
                onChangeText={(text) => setOperatingHours(prev => ({ ...prev, from: text }))}
              />
            </View>
            <View className='flex-1'>
              <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>End Time *</Text>
              <TextInput
                style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                placeholder="09:00 PM"
                placeholderTextColor={Colors.textTertiary}
                value={operatingHours.to}
                onChangeText={(text) => setOperatingHours(prev => ({ ...prev, to: text }))}
              />
            </View>
          </View>
        </View>

        {/* Optional Services */}
        <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
          <View className='flex-row justify-between items-center mb-4'>
            <View>
              <Text className='text-lg font-extrabold' style={{color: Colors.textPrimary}}>Optional Services</Text>
              <Text className='text-xs font-medium mt-1' style={{color: Colors.textSecondary}}>Add extra beauty services</Text>
            </View>
            <Pressable 
              className='flex-row items-center gap-2 px-4 py-2 rounded-lg active:opacity-70'
              style={{backgroundColor: Colors.parlor}}
              onPress={addOptionalService}
            >
              <Plus size={18} color={Colors.white} />
              <Text className='text-sm font-bold' style={{color: Colors.white}}>Add</Text>
            </Pressable>
          </View>

          {optionalServices.map((service, index) => (
            <View key={service.id} className='mb-3 p-3 rounded-xl' style={{backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border}}>
              <View className='flex-row justify-between items-center mb-2'>
                <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>Service {index + 1}</Text>
                {optionalServices.length > 1 && (
                  <Pressable onPress={() => removeOptionalService(service.id)} className='p-1 rounded active:opacity-70' style={{backgroundColor: '#ff000020'}}>
                    <Trash2 size={16} color="#ff0000" />
                  </Pressable>
                )}
              </View>
              
              <Text className='text-xs font-semibold mb-1' style={{color: Colors.textSecondary}}>Service Name</Text>
              <TextInput
                style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary, marginBottom: 8}]}
                placeholder="e.g., Mehndi, Facial, Spa Treatment"
                placeholderTextColor={Colors.textTertiary}
                value={service.name}
                onChangeText={(value) => updateOptionalService(service.id, 'name', value)}
              />
              
              <Text className='text-xs font-semibold mb-1' style={{color: Colors.textSecondary}}>Price (PKR)</Text>
              <TextInput
                style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                placeholder="5000"
                placeholderTextColor={Colors.textTertiary}
                value={service.price}
                onChangeText={(value) => updateOptionalService(service.id, 'price', value)}
                keyboardType="numeric"
              />
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <Pressable 
          className='rounded-xl py-4 items-center active:opacity-80 flex-row justify-center gap-2'
          style={{backgroundColor: Colors.parlor, marginBottom: 40, opacity: isSubmitting ? 0.7 : 1}}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text className='text-base font-extrabold' style={{color: Colors.white}}>
              {isEditMode ? "Save Changes" : "Save & Continue to Dashboard"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: Colors.white
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12
  }
});
