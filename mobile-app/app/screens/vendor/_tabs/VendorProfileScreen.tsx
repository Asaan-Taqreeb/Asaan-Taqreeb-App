import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  User,
  Star,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';

export default function VendorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const ProfileOption = ({ icon: Icon, title, subtitle, onPress }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between"
      style={Shadows.small}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: Colors.vendor + '20' }}
        >
          <Icon size={20} color={Colors.vendor} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>
          )}
        </View>
      </View>
      <ChevronRight size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9FAFB' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View className="bg-white px-5 py-6 border-b border-gray-100">
          <Text className="text-2xl font-bold mb-1" style={{ color: Colors.textPrimary }}>
            Profile
          </Text>
          <Text className="text-sm text-gray-500">
            Manage your vendor account
          </Text>
        </View>

        {/* Profile Card */}
        <View className="px-5 mt-5">
          <View
            className="bg-white rounded-3xl p-6"
            style={{ backgroundColor: Colors.vendor, ...Shadows.medium }}
          >
            <View className="flex-row items-center">
              <Image
                source={{ uri: 'https://i.pravatar.cc/150?img=60' }}
                className="w-20 h-20 rounded-full border-4 border-white"
              />
              <View className="ml-4 flex-1">
                <Text className="text-white text-xl font-bold">
                  Royal Banquet Hall
                </Text>
                <View className="flex-row items-center mt-2">
                  <Star size={16} color="#FCD34D" fill="#FCD34D" />
                  <Text className="text-white text-sm ml-1.5 font-semibold">
                    4.8
                  </Text>
                  <Text className="text-white/80 text-sm ml-1">
                    (127 reviews)
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-4 pt-4 border-t border-white/20">
              <View className="flex-row items-center mb-2">
                <MapPin size={16} color="#FFFFFF" />
                <Text className="text-white text-sm ml-2">
                  Gulberg, Lahore
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Phone size={16} color="#FFFFFF" />
                <Text className="text-white text-sm ml-2">
                  +92 300 1234567
                </Text>
              </View>
              <View className="flex-row items-center">
                <Mail size={16} color="#FFFFFF" />
                <Text className="text-white text-sm ml-2">
                  contact@royalbanquet.com
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View className="px-5 mt-6">
          <Text className="text-xs font-semibold text-gray-400 mb-3 ml-1 tracking-wider">
            ACCOUNT
          </Text>
          <ProfileOption
            icon={User}
            title="Edit Profile"
            subtitle="Update your business information"
            onPress={() => {}}
          />
          <ProfileOption
            icon={User}
            title="About My Business"
            subtitle="Tell customers about your services"
            onPress={() => router.push('/screens/vendor/Component/AboutMeScreen')}
          />
          <ProfileOption
            icon={Settings}
            title="Settings"
            subtitle="App preferences and privacy"
            onPress={() => router.push('/screens/vendor/Component/VendorSettingsScreen')}
          />
          <ProfileOption
            icon={Bell}
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => {}}
          />
        </View>

        {/* Support Section */}
        <View className="px-5 mt-6">
          <Text className="text-xs font-semibold text-gray-400 mb-3 ml-1 tracking-wider">
            SUPPORT
          </Text>
          <ProfileOption
            icon={HelpCircle}
            title="Help & Support"
            subtitle="Get help with your account"
            onPress={() => {}}
          />
        </View>

        {/* Logout */}
        <View className="px-5 mt-6">
          <TouchableOpacity
            onPress={() => {
              // Handle logout
              router.push('/');
            }}
            activeOpacity={0.8}
            className="bg-red-50 rounded-2xl p-4 flex-row items-center justify-center"
            style={Shadows.small}
          >
            <LogOut size={20} color="#EF4444" />
            <Text className="text-red-500 text-base font-semibold ml-2">
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-xs text-gray-400 mt-8">
          Asaan Taqreeb v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
