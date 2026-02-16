import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Utensils, Plus, Trash2, X } from "lucide-react-native";
import { Colors, Shadows } from "@/app/_constants/theme";
import { useState } from "react";

interface Package {
  id: string;
  packageName: string;
  price: string;
  pricePerHead: string;
  guestCount: string;
  mainCourse: string[];
  desserts: string[];
  drinks: string[];
}

export default function CateringServiceForm() {
  const insets = useSafeAreaInsets();
  
  // Common fields
  const [placeName, setPlaceName] = useState("");
  const [location, setLocation] = useState("");
  const [nearbyLandmark, setNearbyLandmark] = useState("");
  const [about, setAbout] = useState("");
  
  // Packages
  const [packages, setPackages] = useState<Package[]>([
    { 
      id: "1", 
      packageName: "", 
      price: "", 
      pricePerHead: "",
      guestCount: "",
      mainCourse: [""],
      desserts: [""],
      drinks: [""]
    }
  ]);
  
  // Optional Dishes
  const [optionalDishes, setOptionalDishes] = useState<{id: string; name: string; price: string}[]>([
    { id: "1", name: "", price: "" }
  ]);

  const addPackage = () => {
    const newId = (packages.length + 1).toString();
    setPackages([...packages, { 
      id: newId, 
      packageName: "", 
      price: "", 
      pricePerHead: "",
      guestCount: "",
      mainCourse: [""],
      desserts: [""],
      drinks: [""]
    }]);
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

  const addItemToArray = (packageId: string, arrayName: 'mainCourse' | 'desserts' | 'drinks') => {
    setPackages(packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, [arrayName]: [...pkg[arrayName], ""] } : pkg
    ));
  };

  const removeItemFromArray = (packageId: string, arrayName: 'mainCourse' | 'desserts' | 'drinks', itemIndex: number) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const newArray = pkg[arrayName].filter((_, idx) => idx !== itemIndex);
        return { ...pkg, [arrayName]: newArray.length > 0 ? newArray : [""] };
      }
      return pkg;
    }));
  };

  const updateArrayItem = (packageId: string, arrayName: 'mainCourse' | 'desserts' | 'drinks', itemIndex: number, value: string) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const newArray = [...pkg[arrayName]];
        newArray[itemIndex] = value;
        return { ...pkg, [arrayName]: newArray };
      }
      return pkg;
    }));
  };

  // Optional Dishes handlers
  const addOptionalDish = () => {
    const newId = (optionalDishes.length + 1).toString();
    setOptionalDishes([...optionalDishes, { id: newId, name: "", price: "" }]);
  };

  const removeOptionalDish = (id: string) => {
    if (optionalDishes.length === 1) {
      Alert.alert("Info", "Optional dishes section will remain. You can leave fields empty if not needed.");
      return;
    }
    setOptionalDishes(optionalDishes.filter(dish => dish.id !== id));
  };

  const updateOptionalDish = (id: string, field: 'name' | 'price', value: string) => {
    setOptionalDishes(optionalDishes.map(dish => 
      dish.id === id ? { ...dish, [field]: value } : dish
    ));
  };

  const handleSubmit = () => {
    // Validation
    if (!placeName.trim()) {
      Alert.alert("Error", "Please enter the business name");
      return;
    }
    if (!location.trim()) {
      Alert.alert("Error", "Please enter the location");
      return;
    }
    if (!about.trim()) {
      Alert.alert("Error", "Please provide information about your catering service");
      return;
    }
    
    // Validate packages
    for (const pkg of packages) {
      if (!pkg.packageName.trim() || !pkg.price.trim() || !pkg.pricePerHead.trim() || !pkg.guestCount.trim()) {
        Alert.alert("Error", "Please complete all package details");
        return;
      }
      if (pkg.mainCourse.every(item => !item.trim())) {
        Alert.alert("Error", "Each package must have at least one main course item");
        return;
      }
    }

    // Save data
    const formData = {
      placeName,
      location,
      nearbyLandmark,
      about,
      packages: packages.map(pkg => ({
        packageName: pkg.packageName,
        price: parseFloat(pkg.price),
        pricePerHead: parseFloat(pkg.pricePerHead),
        guestCount: parseInt(pkg.guestCount),
        mainCourse: pkg.mainCourse.filter(item => item.trim()),
        desserts: pkg.desserts.filter(item => item.trim()),
        drinks: pkg.drinks.filter(item => item.trim())
      })),
      optionalDishes: optionalDishes
        .filter(dish => dish.name.trim() && dish.price.trim())
        .map(dish => ({
          name: dish.name,
          price: parseFloat(dish.price)
        }))
    };

    console.log("Form Data:", formData);
    Alert.alert("Success", "Catering service details saved! You can now view this from your dashboard.", [
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
      {/* Header */}
      <View className='flex-row items-center gap-4 px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
        <Pressable 
          className='rounded-full p-2 active:opacity-70' 
          style={{backgroundColor: Colors.lightGray}} 
          onPress={() => router.back()}
        >
          <ArrowLeft color={Colors.catering} size={24} />
        </Pressable>
        <View className='flex-row items-center gap-3 flex-1'>
          <View className='rounded-full p-2' style={{backgroundColor: `${Colors.catering}20`}}>
            <Utensils size={24} color={Colors.catering} />
          </View>
          <View>
            <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>Catering Service</Text>
            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Setup your menu & packages</Text>
          </View>
        </View>
      </View>

      {/* Form Content */}
      <ScrollView className='flex-1 px-5 py-6' showsVerticalScrollIndicator={false}>
        {/* Common Fields */}
        <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
          <Text className='text-lg font-extrabold mb-4' style={{color: Colors.textPrimary}}>Basic Information</Text>
          
          <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Business Name *</Text>
          <TextInput
            style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
            placeholder="e.g., Karachi Foods Catering"
            placeholderTextColor={Colors.textTertiary}
            value={placeName}
            onChangeText={setPlaceName}
          />

          <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Location *</Text>
          <TextInput
            style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
            placeholder="e.g., Garden West, Karachi"
            placeholderTextColor={Colors.textTertiary}
            value={location}
            onChangeText={setLocation}
          />

          <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Nearby Landmark (Optional)</Text>
          <TextInput
            style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
            placeholder="e.g., Near Nursery"
            placeholderTextColor={Colors.textTertiary}
            value={nearbyLandmark}
            onChangeText={setNearbyLandmark}
          />

          <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>About Your Service *</Text>
          <TextInput
            style={[styles.input, styles.textArea, {borderColor: Colors.border, color: Colors.textPrimary}]}
            placeholder="Describe your catering service, cuisine types, and specialties..."
            placeholderTextColor={Colors.textTertiary}
            value={about}
            onChangeText={setAbout}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Packages */}
        <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-lg font-extrabold' style={{color: Colors.textPrimary}}>Menu Packages</Text>
            <Pressable 
              className='flex-row items-center gap-2 px-4 py-2 rounded-lg active:opacity-70'
              style={{backgroundColor: Colors.catering}}
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
                placeholder="e.g., Silver Menu"
                placeholderTextColor={Colors.textTertiary}
                value={pkg.packageName}
                onChangeText={(value) => updatePackage(pkg.id, 'packageName', value)}
              />

              <View className='flex-row gap-3 mt-3'>
                <View className='flex-1'>
                  <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Total Price (PKR) *</Text>
                  <TextInput
                    style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                    placeholder="120000"
                    placeholderTextColor={Colors.textTertiary}
                    value={pkg.price}
                    onChangeText={(value) => updatePackage(pkg.id, 'price', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View className='flex-1'>
                  <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Per Head (PKR) *</Text>
                  <TextInput
                    style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                    placeholder="1200"
                    placeholderTextColor={Colors.textTertiary}
                    value={pkg.pricePerHead}
                    onChangeText={(value) => updatePackage(pkg.id, 'pricePerHead', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text className='text-sm font-semibold mb-2 mt-3' style={{color: Colors.textSecondary}}>Guest Count *</Text>
              <TextInput
                style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                placeholder="200"
                placeholderTextColor={Colors.textTertiary}
                value={pkg.guestCount}
                onChangeText={(value) => updatePackage(pkg.id, 'guestCount', value)}
                keyboardType="numeric"
              />

              {/* Main Course */}
              <View className='flex-row justify-between items-center mt-4 mb-2'>
                <Text className='text-sm font-semibold' style={{color: Colors.textSecondary}}>Main Course *</Text>
                <Pressable 
                  className='flex-row items-center gap-1 px-3 py-1 rounded active:opacity-70'
                  style={{backgroundColor: Colors.catering}}
                  onPress={() => addItemToArray(pkg.id, 'mainCourse')}
                >
                  <Plus size={14} color={Colors.white} />
                  <Text className='text-xs font-bold' style={{color: Colors.white}}>Add</Text>
                </Pressable>
              </View>
              {pkg.mainCourse.map((item, idx) => (
                <View key={idx} className='flex-row gap-2 mb-2'>
                  <TextInput
                    style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary, flex: 1}]}
                    placeholder="e.g., Chicken Biryani"
                    placeholderTextColor={Colors.textTertiary}
                    value={item}
                    onChangeText={(value) => updateArrayItem(pkg.id, 'mainCourse', idx, value)}
                  />
                  {pkg.mainCourse.length > 1 && (
                    <Pressable 
                      className='justify-center items-center p-2 rounded active:opacity-70'
                      style={{backgroundColor: '#ff000020'}}
                      onPress={() => removeItemFromArray(pkg.id, 'mainCourse', idx)}
                    >
                      <X size={18} color="#ff0000" />
                    </Pressable>
                  )}
                </View>
              ))}

              {/* Desserts */}
              <View className='flex-row justify-between items-center mt-3 mb-2'>
                <Text className='text-sm font-semibold' style={{color: Colors.textSecondary}}>Desserts</Text>
                <Pressable 
                  className='flex-row items-center gap-1 px-3 py-1 rounded active:opacity-70'
                  style={{backgroundColor: Colors.catering}}
                  onPress={() => addItemToArray(pkg.id, 'desserts')}
                >
                  <Plus size={14} color={Colors.white} />
                  <Text className='text-xs font-bold' style={{color: Colors.white}}>Add</Text>
                </Pressable>
              </View>
              {pkg.desserts.map((item, idx) => (
                <View key={idx} className='flex-row gap-2 mb-2'>
                  <TextInput
                    style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary, flex: 1}]}
                    placeholder="e.g., Ice Cream, Kheer"
                    placeholderTextColor={Colors.textTertiary}
                    value={item}
                    onChangeText={(value) => updateArrayItem(pkg.id, 'desserts', idx, value)}
                  />
                  {pkg.desserts.length > 1 && (
                    <Pressable 
                      className='justify-center items-center p-2 rounded active:opacity-70'
                      style={{backgroundColor: '#ff000020'}}
                      onPress={() => removeItemFromArray(pkg.id, 'desserts', idx)}
                    >
                      <X size={18} color="#ff0000" />
                    </Pressable>
                  )}
                </View>
              ))}

              {/* Drinks */}
              <View className='flex-row justify-between items-center mt-3 mb-2'>
                <Text className='text-sm font-semibold' style={{color: Colors.textSecondary}}>Drinks</Text>
                <Pressable 
                  className='flex-row items-center gap-1 px-3 py-1 rounded active:opacity-70'
                  style={{backgroundColor: Colors.catering}}
                  onPress={() => addItemToArray(pkg.id, 'drinks')}
                >
                  <Plus size={14} color={Colors.white} />
                  <Text className='text-xs font-bold' style={{color: Colors.white}}>Add</Text>
                </Pressable>
              </View>
              {pkg.drinks.map((item, idx) => (
                <View key={idx} className='flex-row gap-2 mb-2'>
                  <TextInput
                    style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary, flex: 1}]}
                    placeholder="e.g., Cold Drink, Lassi"
                    placeholderTextColor={Colors.textTertiary}
                    value={item}
                    onChangeText={(value) => updateArrayItem(pkg.id, 'drinks', idx, value)}
                  />
                  {pkg.drinks.length > 1 && (
                    <Pressable 
                      className='justify-center items-center p-2 rounded active:opacity-70'
                      style={{backgroundColor: '#ff000020'}}
                      onPress={() => removeItemFromArray(pkg.id, 'drinks', idx)}
                    >
                      <X size={18} color="#ff0000" />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Optional Dishes */}
        <View className='rounded-2xl p-5 mb-4' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
          <View className='flex-row justify-between items-center mb-4'>
            <View>
              <Text className='text-lg font-extrabold' style={{color: Colors.textPrimary}}>Optional Dishes</Text>
              <Text className='text-xs font-medium mt-1' style={{color: Colors.textSecondary}}>Add extra food items clients can order</Text>
            </View>
            <Pressable 
              className='flex-row items-center gap-2 px-4 py-2 rounded-lg active:opacity-70'
              style={{backgroundColor: Colors.catering}}
              onPress={addOptionalDish}
            >
              <Plus size={18} color={Colors.white} />
              <Text className='text-sm font-bold' style={{color: Colors.white}}>Add</Text>
            </Pressable>
          </View>

          {optionalDishes.map((dish, index) => (
            <View key={dish.id} className='mb-3 p-3 rounded-xl' style={{backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border}}>
              <View className='flex-row justify-between items-center mb-2'>
                <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>Dish {index + 1}</Text>
                {optionalDishes.length > 1 && (
                  <Pressable onPress={() => removeOptionalDish(dish.id)} className='p-1 rounded active:opacity-70' style={{backgroundColor: '#ff000020'}}>
                    <Trash2 size={16} color="#ff0000" />
                  </Pressable>
                )}
              </View>
              
              <Text className='text-xs font-semibold mb-1' style={{color: Colors.textSecondary}}>Dish Name</Text>
              <TextInput
                style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary, marginBottom: 8}]}
                placeholder="e.g., Mutton Karhai, BBQ Platter, Seafood"
                placeholderTextColor={Colors.textTertiary}
                value={dish.name}
                onChangeText={(value) => updateOptionalDish(dish.id, 'name', value)}
              />
              
              <Text className='text-xs font-semibold mb-1' style={{color: Colors.textSecondary}}>Price (PKR)</Text>
              <TextInput
                style={[styles.input, {borderColor: Colors.border, color: Colors.textPrimary}]}
                placeholder="15000"
                placeholderTextColor={Colors.textTertiary}
                value={dish.price}
                onChangeText={(value) => updateOptionalDish(dish.id, 'price', value)}
                keyboardType="numeric"
              />
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <Pressable 
          className='rounded-xl py-4 items-center active:opacity-80'
          style={{backgroundColor: Colors.catering, marginBottom: 40}}
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
