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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';

export default function ClientAboutMeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Mock data - in real app, fetch from backend
  const [fullName, setFullName] = useState('Mirza Zain');
  const [phoneNumber, setPhoneNumber] = useState('+92 300 1234567');
  const [email, setEmail] = useState('mirzazain269@gmail.com');
  const [address, setAddress] = useState('Lahore, Pakistan');
  const [bio, setBio] = useState('');
  const [preferences, setPreferences] = useState('');

  const handleSave = () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
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

    const profileData = {
      fullName,
      phoneNumber,
      email,
      address,
      bio,
      preferences,
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
              style={{ backgroundColor: Colors.primary + '15' }}
            >
              <ArrowLeft size={22} color={Colors.primary} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold" style={{ color: Colors.textPrimary }}>
              About Me
            </Text>
            <View className="w-11" />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        >
          {/* Full Name */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Full Name *
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
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
              placeholder="your.email@example.com"
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
              placeholder="Your address"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl px-4 py-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                color: Colors.textPrimary,
              }}
            />
          </View>

          {/* Bio */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Bio
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us a little about yourself (optional)"
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

          {/* Event Preferences */}
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
              Event Preferences
            </Text>
            <TextInput
              value={preferences}
              onChangeText={setPreferences}
              placeholder="What types of events are you planning? (e.g., weddings, corporate events)"
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

          {/* Info Note */}
          <View className="bg-blue-50 rounded-xl p-4 mb-5">
            <Text className="text-sm text-blue-900 leading-5">
              💡 Complete your profile to help vendors understand your needs better and provide personalized recommendations.
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="px-5 pb-5 pt-3 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSave}
            className="rounded-2xl py-4 items-center justify-center flex-row"
            style={{ backgroundColor: Colors.primary }}
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
