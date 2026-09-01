import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Sparkles, Plus, Trash2, X } from "lucide-react-native";
import { Colors, Shadows } from "@/app/_constants/theme";
import { showAlert } from "@/app/_utils/alert";
import { useState, useEffect } from "react";
import { createVendorService, updateVendorService, getServiceById } from '@/app/_utils/servicesApi';
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

export default function DynamicServiceForm() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { serviceId, edit, category: categoryParam, categoryName } = useLocalSearchParams<{
    serviceId?: string;
    edit?: string;
    category?: string;
    categoryName?: string;
  }>();

  const isEditMode = edit === 'true' && !!serviceId;
  const currentCategoryKey = categoryParam || 'general';
  const displayCategoryTitle = categoryName || (currentCategoryKey.charAt(0).toUpperCase() + currentCategoryKey.slice(1).replace(/_/g, ' '));

  // Common fields
  const [placeName, setPlaceName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [nearbyLandmark, setNearbyLandmark] = useState("");
  const [about, setAbout] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [slotCapacity, setSlotCapacity] = useState("1");
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Operating Hours
  const [operatingHours, setOperatingHours] = useState({ from: "09:00 AM", to: "09:00 PM" });

  // Packages
  const [packages, setPackages] = useState<Package[]>([
    { id: "1", packageName: "Standard Package", price: "", items: [""] }
  ]);

  // Optional Services
  const [optionalServices, setOptionalServices] = useState<{ id: string; name: string; price: string }[]>([
    { id: "1", name: "", price: "" }
  ]);

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
        if (data.maxGuests) setSlotCapacity(data.maxGuests.toString());
        else if ((data as any).capacity?.maxGuests) setSlotCapacity((data as any).capacity.maxGuests.toString());
        if (data.operatingHours) {
          setOperatingHours(data.operatingHours);
        }

        if (data.packages && data.packages.length > 0) {
          setPackages(
            data.packages.map((pkg, idx) => ({
              id: pkg.id?.toString() || (idx + 1).toString(),
              packageName: pkg.packageName,
              price: pkg.price.toString(),
              items: pkg.items && pkg.items.length > 0 ? pkg.items : [""]
            }))
          );
        }

        if (data.optionalServices && data.optionalServices.length > 0) {
          setOptionalServices(
            data.optionalServices.map((opt, idx) => ({
              id: (idx + 1).toString(),
              name: opt.name,
              price: opt.price.toString()
            }))
          );
        }
      }
    } catch (error) {
      console.error('Failed to load service data:', error);
      showAlert('Error', 'Failed to load existing service data.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Package handlers
  const addPackage = () => {
    setPackages([
      ...packages,
      { id: Date.now().toString(), packageName: "", price: "", items: [""] }
    ]);
  };

  const removePackage = (id: string) => {
    if (packages.length === 1) {
      showAlert("Warning", "At least one package is required");
      return;
    }
    setPackages(packages.filter(p => p.id !== id));
  };

  const updatePackageName = (id: string, name: string) => {
    setPackages(packages.map(p => p.id === id ? { ...p, packageName: name } : p));
  };

  const updatePackagePrice = (id: string, price: string) => {
    setPackages(packages.map(p => p.id === id ? { ...p, price } : p));
  };

  const addPackageItem = (packageId: string) => {
    setPackages(packages.map(p => {
      if (p.id === packageId) {
        return { ...p, items: [...p.items, ""] };
      }
      return p;
    }));
  };

  const removePackageItem = (packageId: string, index: number) => {
    setPackages(packages.map(p => {
      if (p.id === packageId) {
        return { ...p, items: p.items.filter((_, i) => i !== index) };
      }
      return p;
    }));
  };

  const updatePackageItem = (packageId: string, index: number, value: string) => {
    setPackages(packages.map(p => {
      if (p.id === packageId) {
        const newItems = [...p.items];
        newItems[index] = value;
        return { ...p, items: newItems };
      }
      return p;
    }));
  };

  // Optional Services Handlers
  const addOptionalService = () => {
    setOptionalServices([
      ...optionalServices,
      { id: Date.now().toString(), name: "", price: "" }
    ]);
  };

  const removeOptionalService = (id: string) => {
    setOptionalServices(optionalServices.filter(s => s.id !== id));
  };

  const updateOptionalServiceName = (id: string, name: string) => {
    setOptionalServices(optionalServices.map(s => s.id === id ? { ...s, name } : s));
  };

  const updateOptionalServicePrice = (id: string, price: string) => {
    setOptionalServices(optionalServices.map(s => s.id === id ? { ...s, price } : s));
  };

  const handleSubmit = async () => {
    if (!placeName.trim()) {
      showAlert("Missing Field", "Please enter business/service name");
      return;
    }
    if (!location.trim()) {
      showAlert("Missing Field", "Please select or enter your address");
      return;
    }

    const validPackages = packages.filter(p => p.packageName.trim() && p.price.trim());
    if (validPackages.length === 0) {
      showAlert("Missing Packages", "Please configure at least one complete package with name and price");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImages = [...images];
      const localImages = images.filter(img => !img.startsWith('http'));

      if (localImages.length > 0 && isCloudinaryConfigured()) {
        try {
          const uploadedUrls = await uploadMultipleToCloudinary(localImages);
          finalImages = images.map(img => {
            if (img.startsWith('http')) return img;
            const index = localImages.indexOf(img);
            return uploadedUrls[index] || img;
          });
        } catch (uploadError: any) {
          console.error("Cloudinary upload failed:", uploadError);
        }
      }

      const formattedPackages = validPackages.map(p => ({
        packageName: p.packageName.trim(),
        price: parseFloat(p.price),
        items: p.items.filter(i => i.trim() !== "")
      }));

      const formattedOptional = optionalServices
        .filter(s => s.name.trim() && s.price.trim())
        .map(s => ({
          name: s.name.trim(),
          price: parseFloat(s.price)
        }));

      const servicePayload = {
        name: placeName.trim(),
        category: currentCategoryKey.toUpperCase(),
        location: location.trim(),
        nearbyLandmark: nearbyLandmark.trim(),
        about: about.trim(),
        latitude,
        longitude,
        slotCapacity: parseInt(slotCapacity) || 1,
        images: finalImages,
        operatingHours,
        packages: formattedPackages,
        optionalServices: formattedOptional
      };

      if (isEditMode && serviceId) {
        await updateVendorService(serviceId, servicePayload);
        showAlert("Success", "Service updated successfully!", [
          { text: "OK", onPress: () => router.replace('/screens/vendor/VendorDashboardHome') }
        ]);
      } else {
        await createVendorService(servicePayload);
        showAlert("Success", "Service created successfully!", [
          { text: "OK", onPress: () => router.replace('/screens/vendor/VendorDashboardHome') }
        ]);
      }
    } catch (error: any) {
      console.error("Submit Error:", error);
      showAlert("Submission Failed", error?.message || "Failed to save service details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: Colors.textSecondary, fontWeight: '600' }}>
          Loading service details...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {isEditMode ? `Edit ${displayCategoryTitle}` : `Setup ${displayCategoryTitle}`}
          </Text>
          <Text style={styles.headerSubtitle}>
            Configure packages, business details, and gallery
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.formContainer}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business / Service Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Royal Decorators & Events"
              placeholderTextColor={Colors.textTertiary}
              value={placeName}
              onChangeText={setPlaceName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location & Map Coordinates *</Text>
            <LocationPicker
              initialLocation={{
                address: location,
                latitude,
                longitude,
              }}
              onLocationSelect={(loc) => {
                setLocation(loc.address);
                setLatitude(loc.latitude);
                setLongitude(loc.longitude);
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nearby Landmark</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Near Millennium Mall"
              placeholderTextColor={Colors.textTertiary}
              value={nearbyLandmark}
              onChangeText={setNearbyLandmark}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Concurrent Booking Capacity</Text>
            <TextInput
              style={styles.input}
              placeholder="How many simultaneous bookings can you handle per slot?"
              placeholderTextColor={Colors.textTertiary}
              value={slotCapacity}
              onChangeText={setSlotCapacity}
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>Number of teams / orders you can serve at the exact same time slot.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>About Your Services</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Highlight your experience, equipment, specialty, and what makes your service stand out..."
              placeholderTextColor={Colors.textTertiary}
              value={about}
              onChangeText={setAbout}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Gallery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio & Gallery</Text>
          <ImageUploader images={images} onImagesChange={setImages} maxImages={10} />
        </View>

        {/* Packages */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Packages & Pricing *</Text>
            <Pressable onPress={addPackage} style={styles.addButton}>
              <Plus size={16} color={Colors.white} />
              <Text style={styles.addButtonText}>Add Package</Text>
            </Pressable>
          </View>

          {packages.map((pkg, pIndex) => (
            <View key={pkg.id} style={styles.packageCard}>
              <View style={styles.packageHeader}>
                <Text style={styles.packageNumber}>Package #{pIndex + 1}</Text>
                {packages.length > 1 && (
                  <Pressable onPress={() => removePackage(pkg.id)} style={styles.deleteButton}>
                    <Trash2 size={16} color={Colors.error} />
                  </Pressable>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Package Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Gold Theme Package"
                  placeholderTextColor={Colors.textTertiary}
                  value={pkg.packageName}
                  onChangeText={(text) => updatePackageName(pkg.id, text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price (PKR) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 75000"
                  placeholderTextColor={Colors.textTertiary}
                  value={pkg.price}
                  onChangeText={(text) => updatePackagePrice(pkg.id, text)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.itemsSection}>
                <Text style={styles.label}>Included Features / Deliverables</Text>
                {pkg.items.map((item, itemIdx) => (
                  <View key={itemIdx} style={styles.itemRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="e.g. Stage Decor, Fairy Lights, Entry Gate"
                      placeholderTextColor={Colors.textTertiary}
                      value={item}
                      onChangeText={(val) => updatePackageItem(pkg.id, itemIdx, val)}
                    />
                    {pkg.items.length > 1 && (
                      <Pressable 
                        onPress={() => removePackageItem(pkg.id, itemIdx)}
                        style={styles.removeItemButton}
                      >
                        <X size={16} color={Colors.textTertiary} />
                      </Pressable>
                    )}
                  </View>
                ))}
                <Pressable onPress={() => addPackageItem(pkg.id)} style={styles.addItemButton}>
                  <Plus size={14} color={Colors.primary} />
                  <Text style={styles.addItemText}>Add Item</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Optional Add-on Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Optional Add-on Services</Text>
            <Pressable onPress={addOptionalService} style={styles.addButton}>
              <Plus size={16} color={Colors.white} />
              <Text style={styles.addButtonText}>Add Addon</Text>
            </Pressable>
          </View>

          {optionalServices.map((opt) => (
            <View key={opt.id} style={styles.optionalRow}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Addon Service Name"
                placeholderTextColor={Colors.textTertiary}
                value={opt.name}
                onChangeText={(text) => updateOptionalServiceName(opt.id, text)}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Price (PKR)"
                placeholderTextColor={Colors.textTertiary}
                value={opt.price}
                onChangeText={(text) => updateOptionalServicePrice(opt.id, text)}
                keyboardType="numeric"
              />
              <Pressable onPress={() => removeOptionalService(opt.id)} style={styles.deleteButton}>
                <Trash2 size={16} color={Colors.error} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? "Save Changes" : "Create Service Listing"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  backButton: {
    padding: 10,
    borderRadius: 99,
    backgroundColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  formContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  packageCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deleteButton: {
    padding: 6,
  },
  itemsSection: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  removeItemButton: {
    padding: 8,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  addItemText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  optionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...Shadows.medium,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
