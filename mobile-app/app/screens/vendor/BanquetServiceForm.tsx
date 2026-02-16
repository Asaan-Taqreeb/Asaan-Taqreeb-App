import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Building2, Plus, Trash2, X } from "lucide-react-native";
import { Colors, Shadows } from "@/app/_constants/theme";
import { useState } from "react";

interface Package {
  id: string;
  packageName: string;
  price: string;
  items: string[];
}

export default function BanquetServiceForm() {
  const insets = useSafeAreaInsets();
  
  // Common fields
  const [placeName, setPlaceName] = useState("");
  const [location, setLocation] = useState("");
  const [nearbyLandmark, setNearbyLandmark] = useState("");
  const [about, setAbout] = useState("");
  
  // Banquet specific
  const [minGuests, setMinGuests] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  
  // Packages
  const [packages, setPackages] = useState<Package[]>([
    { id: "1", packageName: "", price: "", items: [""] }
  ]);
  
  // Optional Services
  const [optionalServices, setOptionalServices] = useState<{id: string; name: string; price: string}[]>([
    { id: "1", name: "", price: "" }
  ]);

  const addPackage = () => {
    const newId = (packages.length + 1).toString();
    setPackages([...packages, { id: newId, packageName: "", price: "", items: [""] }]);
  };

  const removePackage = (id: string) => {
    if (packages.length === 1) {
      Alert.alert("Error", "At least one package is required");
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
      Alert.alert("Info", "Optional services section will remain. You can leave fields empty if not needed.");
      return;
    }
    setOptionalServices(optionalServices.filter(service => service.id !== id));
  };

  const updateOptionalService = (id: string, field: 'name' | 'price', value: string) => {
    setOptionalServices(optionalServices.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  const handleSubmit = () => {
    // Validation
    if (!placeName.trim()) {
      Alert.alert("Error", "Please enter the place name");
      return;
    }
    if (!location.trim()) {
      Alert.alert("Error", "Please enter the location");
      return;
    }
    if (!about.trim()) {
      Alert.alert("Error", "Please provide information about your venue");
      return;
    }
    if (!minGuests.trim() || !maxGuests.trim()) {
      Alert.alert("Error", "Please enter hall capacity (min and max guests)");
      return;
    }
    
    // Validate packages
    for (const pkg of packages) {
      if (!pkg.packageName.trim() || !pkg.price.trim()) {
        Alert.alert("Error", "Please complete all package details");
        return;
      }
      if (pkg.items.every(item => !item.trim())) {
        Alert.alert("Error", "Each package must have at least one service/item");
        return;
      }
    }

    // Save data (to be integrated with backend)
    const formData = {
      placeName,
      location,
      nearbyLandmark,
      about,
      minGuests: parseInt(minGuests),
      maxGuests: parseInt(maxGuests),
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
        }))
    };

    console.log("Form Data:", formData);
    Alert.alert("Success", "Banquet service details saved! You can now view this from your dashboard.", [
      { text: "OK", onPress: () => router.replace('/screens/vendor/_tabs/VendorDashboardHome') }
    ]);
  };

  return (
    <KeyboardAvoidingView 
      style={{flex: 1}} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View className='flex-row items-center gap-4 px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
          <Pressable 
            className='rounded-full p-2 active:opacity-70' 
            style={{backgroundColor: Colors.lightGray}} 
            onPress={() => router.back()}
          >
            <ArrowLeft color={Colors.banquet} size={24} />
          </Pressable>
          <View className='flex-row items-center gap-3 flex-1'>
            <View className='rounded-full p-2' style={{backgroundColor: `${Colors.banquet}20`}}>
              <Building2 size={24} color={Colors.banquet} />
            </View>
            <View>
              <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>Banquet Hall Service</Text>
              <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Setup your venue details</Text>
            </View>
          </View>
        </View>

        <ScrollView className='flex-1 px-5 py-6' showsVerticalScrollIndicator={false}>
          <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
            <Text className='text-lg font-extrabold mb-4' style={{color: Colors.textPrimary}}>Basic Information</Text>
            
            <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Place Name *</Text>
            <TextInput
              style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
              placeholder="e.g., Grand Taj Banquet"
              placeholderTextColor={Colors.textTertiary}
              value={placeName}
              onChangeText={setPlaceName}
            />

            <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Location *</Text>
            <TextInput
              style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
              placeholder="e.g., Shahrah e Faisal, Karachi"
              placeholderTextColor={Colors.textTertiary}
              value={location}
              onChangeText={setLocation}
            />

            <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Nearby Landmark (Optional)</Text>
            <TextInput
              style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
              placeholder="e.g., Near City Mall"
              placeholderTextColor={Colors.textTertiary}
              value={nearbyLandmark}
              onChangeText={setNearbyLandmark}
            />

            <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>About Your Venue *</Text>
            <TextInput
              style={[styles.input, styles.textArea, {borderColor: Colors.border, color: Colors.textPrimary}]}
              placeholder="Describe your banquet hall, amenities, and what makes it special..."
              placeholderTextColor={Colors.textTertiary}
              value={about}
              onChangeText={setAbout}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
            <Text className='text-lg font-extrabold mb-4' style={{color: Colors.textPrimary}}>Hall Capacity</Text>
            
            <View className='flex-row gap-3'>
              <View className='flex-1'>
                <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Min Guests *</Text>
                <TextInput
                  style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                  placeholder="200"
                  placeholderTextColor={Colors.textTertiary}
                  value={minGuests}
                  onChangeText={setMinGuests}
                  keyboardType="numeric"
                />
              </View>
              <View className='flex-1'>
                <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Max Guests *</Text>
                <TextInput
                  style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                  placeholder="500"
                  placeholderTextColor={Colors.textTertiary}
                  value={maxGuests}
                  onChangeText={setMaxGuests}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
            <View className='flex-row justify-between items-center mb-4'>
              <Text className='text-lg font-extrabold' style={{color: Colors.textPrimary}}>Packages</Text>
              <Pressable 
                className='flex-row items-center gap-2 px-4 py-2 rounded-lg active:opacity-70'
                style={{backgroundColor: Colors.banquet}}
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
                  placeholder="e.g., Classic Package"
                  placeholderTextColor={Colors.textTertiary}
                  value={pkg.packageName}
                  onChangeText={(value) => updatePackage(pkg.id, 'packageName', value)}
                />

                <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Price (PKR) *</Text>
                <TextInput
                  style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                  placeholder="250000"
                  placeholderTextColor={Colors.textTertiary}
                  value={pkg.price}
                  onChangeText={(value) => updatePackage(pkg.id, 'price', value)}
                  keyboardType="numeric"
                />

                <View className='flex-row justify-between items-center mt-3 mb-2'>
                  <Text className='text-sm font-semibold' style={{color: Colors.textSecondary}}>Services/Items *</Text>
                  <Pressable 
                    className='flex-row items-center gap-1 px-3 py-1 rounded active:opacity-70'
                    style={{backgroundColor: Colors.banquet}}
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
                      placeholder="e.g., Stage Decoration, Sound System"
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

          <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
            <View className='flex-row justify-between items-center mb-4'>
              <View>
                <Text className='text-lg font-extrabold' style={{color: Colors.textPrimary}}>Optional Services</Text>
                <Text className='text-xs font-medium mt-1' style={{color: Colors.textSecondary}}>Add extra services clients can choose</Text>
              </View>
              <Pressable 
                className='flex-row items-center gap-2 px-4 py-2 rounded-lg active:opacity-70'
                style={{backgroundColor: Colors.banquet}}
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
                  placeholder="e.g., LED Wall, Photo Booth, Valet Parking"
                  placeholderTextColor={Colors.textTertiary}
                  value={service.name}
                  onChangeText={(value) => updateOptionalService(service.id, 'name', value)}
                />
                
                <Text className='text-xs font-semibold mb-1' style={{color: Colors.textSecondary}}>Price (PKR)</Text>
                <TextInput
                  style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                  placeholder="25000"
                  placeholderTextColor={Colors.textTertiary}
                  value={service.price}
                  onChangeText={(value) => updateOptionalService(service.id, 'price', value)}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>

          <Pressable 
            className='rounded-xl py-4 items-center active:opacity-80'
            style={{backgroundColor: Colors.banquet, marginBottom: 40}}
            onPress={handleSubmit}
          >
            <Text className='text-base font-extrabold' style={{color: Colors.white}}>Save & Continue to Dashboard</Text>
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
