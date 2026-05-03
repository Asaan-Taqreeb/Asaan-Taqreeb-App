import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';
import { useUser } from '@/app/_context/UserContext';

export default function AboutMeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // Initialize with user data from context, fallback to empty values
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [about, setAbout] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [website, setWebsite] = useState('');
  const [experience, setExperience] = useState('');

  useEffect(() => {
    if (user) {
      setBusinessName(user.name || user.businessName || '')
      setEmail(user.email || '')
      // Other fields from user if available
      if (user.phoneNumber) setPhoneNumber(user.phoneNumber)
      if (user.address) setAddress(user.address)
      if (user.about) setAbout(user.about)
      if (user.workingHours) setWorkingHours(user.workingHours)
      if (user.website) setWebsite(user.website)
      if (user.experience) setExperience(user.experience)
    }
  }, [user])

  const handleSave = () => {
    // Validation
    if (!businessName.trim()) {
      Alert.alert('Error', 'Please enter your business name');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!about.trim()) {
      Alert.alert('Error', 'Please write something about your business');
      return;
    }

    const profileData = {
      businessName,
      phoneNumber,
      email,
      address,
      about,
      workingHours,
      website,
      experience,
    };

    console.log('Profile Data:', profileData);
    Alert.alert('Success', 'Profile updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
    // In real app, save to backend
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
              About My Business
            </Text>
            <View className="w-11" />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        >
          {/* Business Name */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Business Name *
            </Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Your business name"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
              }}
            />
          </View>

          {/* Phone Number */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Phone Number *
            </Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+92 300 1234567"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
              }}
            />
          </View>

          {/* Email */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Email *
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="contact@yourbusiness.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
              }}
            />
          </View>

          {/* Address */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Address
            </Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Your business address"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
              }}
            />
          </View>

          {/* About */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              About Your Business *
            </Text>
            <TextInput
              value={about}
              onChangeText={setAbout}
              placeholder="Tell customers about your business, services, and what makes you unique"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
                minHeight: 150,
              }}
            />
          </View>

          {/* Working Hours */}
          <View className="mb-5">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
                Working Hours
              </Text>
              <TouchableOpacity onPress={() => router.push('/screens/vendor/Component/TimeSlotsScreen')}>
                <Text className="text-xs font-bold" style={{ color: Colors.vendor }}>MANAGE SLOTS</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={workingHours}
              onChangeText={setWorkingHours}
              placeholder="e.g., 9:00 AM - 11:00 PM"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
              }}
            />
          </View>

          {/* Website */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Website
            </Text>
            <TextInput
              value={website}
              onChangeText={setWebsite}
              placeholder="www.yourbusiness.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="url"
              autoCapitalize="none"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
              }}
            />
          </View>

          {/* Experience */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Years of Experience
            </Text>
            <TextInput
              value={experience}
              onChangeText={setExperience}
              placeholder="e.g., 10+ years"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
              }}
            />
          </View>

          {/* Info Note */}
          <View className="bg-blue-50 rounded-xl p-4 mb-5">
            <Text className="text-sm text-blue-900 leading-5">
              💡 Complete your profile to help customers learn more about your business and build trust.
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="px-5 pb-5 pt-3 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSave}
            className="rounded-2xl py-4 items-center justify-center flex-row"
            style={{ backgroundColor: Colors.vendor }}
            activeOpacity={0.8}
          >
            <Save size={20} color="#FFFFFF" />
            <Text className="text-white text-base font-bold ml-2">
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
