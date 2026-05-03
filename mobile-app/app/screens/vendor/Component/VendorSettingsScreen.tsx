import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/app/_constants/theme';

export default function VendorSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('vendor_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPushNotifications(parsed.pushNotifications ?? true);
      }
    } catch (e) {
      console.warn('Failed to load settings');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings = {
        pushNotifications,
      };
      await AsyncStorage.setItem('vendor_settings', JSON.stringify(settings));
      Alert.alert('Success', 'Settings saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
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
            Settings
          </Text>
          <View className="w-11" />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
      >
        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
            PREFERENCES
          </Text>
          <View className="bg-white rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                  App Notifications
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Receive alerts for new orders and messages
                </Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#D1D5DB', true: Colors.vendor + '60' }}
                thumbColor={pushNotifications ? Colors.vendor : '#F3F4F6'}
              />
            </View>
          </View>
        </View>

        {/* Privacy Section */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
            PRIVACY & SECURITY
          </Text>

          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3"
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to privacy policy
            }}
          >
            <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
              Privacy Policy
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Read our privacy policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-2xl p-4"
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to terms and conditions
            }}
          >
            <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
              Terms & Conditions
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Read our terms and conditions
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="items-center mb-8">
          <Text className="text-gray-400 text-sm">Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="px-5 pb-5 pt-3 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="rounded-2xl py-4 items-center justify-center flex-row"
          style={{ backgroundColor: isSaving ? '#9CA3AF' : Colors.vendor }}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <Text className="text-white text-base font-bold ml-2">
                Save Settings
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
