import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';

export default function VendorSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
            NOTIFICATIONS
          </Text>

          <View className="bg-white rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                  Push Notifications
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Receive push notifications for updates
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

          <View className="bg-white rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                  Email Notifications
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Receive email updates about your orders
                </Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#D1D5DB', true: Colors.vendor + '60' }}
                thumbColor={emailNotifications ? Colors.vendor : '#F3F4F6'}
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                  Order Alerts
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Get notified about new orders
                </Text>
              </View>
              <Switch
                value={orderAlerts}
                onValueChange={setOrderAlerts}
                trackColor={{ false: '#D1D5DB', true: Colors.vendor + '60' }}
                thumbColor={orderAlerts ? Colors.vendor : '#F3F4F6'}
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                  Message Alerts
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Get notified about new messages
                </Text>
              </View>
              <Switch
                value={messageAlerts}
                onValueChange={setMessageAlerts}
                trackColor={{ false: '#D1D5DB', true: Colors.vendor + '60' }}
                thumbColor={messageAlerts ? Colors.vendor : '#F3F4F6'}
              />
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
            APPEARANCE
          </Text>

          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                  Dark Mode
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Switch to dark theme
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#D1D5DB', true: Colors.vendor + '60' }}
                thumbColor={darkMode ? Colors.vendor : '#F3F4F6'}
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
        <View className="items-center mb-4">
          <Text className="text-gray-400 text-sm">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}
