import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
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
  Clock,
  Calendar,
  Package,
} from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { useUser } from '@/app/_context/UserContext';
import Avatar from '@/app/_components/Avatar';
import { logoutUser, deleteUserAccount } from '@/app/_utils/authApi';
import { useLanguage } from '@/app/_context/LanguageContext';
import VendorHeader from '../Component/VendorHeader';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VendorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();
  const { t } = useLanguage();

  const [avgRating, setAvgRating] = React.useState(4.8)
  const [totalReviews, setTotalReviews] = React.useState(127)
  const [ratingDistribution, setRatingDistribution] = React.useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })

  const loadProfileStats = React.useCallback(async () => {
    try {
      const savedRatings = await AsyncStorage.getItem('client_rated_bookings');
      if (savedRatings) {
        const ratings = JSON.parse(savedRatings);
        const ratingArray = Object.values(ratings);
        if (ratingArray.length > 0) {
          const sum = ratingArray.reduce((acc: number, curr: any) => acc + curr.rating, 0);
          setAvgRating(Number((sum / ratingArray.length).toFixed(1)));
          setTotalReviews(ratingArray.length);

          const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          ratingArray.forEach((r: any) => {
            const rounded = Math.round(r.rating);
            if (rounded >= 1 && rounded <= 5) {
              dist[rounded as 1|2|3|4|5] += 1;
            }
          });
          setRatingDistribution(dist);
        } else {
          setAvgRating(0);
          setTotalReviews(0);
          setRatingDistribution({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        }
      } else {
        setAvgRating(0);
        setTotalReviews(0);
        setRatingDistribution({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      }
    } catch (e) {
      console.warn("Failed to load profile reviews stats:", e);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfileStats();
    }, [loadProfileStats])
  );

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Quietly handle logout error
    } finally {
      setUser(null);
      router.replace('/screens/WelcomeScreen');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your vendor account? All your services and bookings will be removed. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount();
              setUser(null);
              router.replace('/screens/WelcomeScreen');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete account');
            }
          }
        }
      ]
    );
  };

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
      style={{borderWidth: 1, borderColor: Colors.border, ...Shadows.small}}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: Colors.vendor + '15' }}
        >
          <Icon size={20} color={Colors.vendor} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-bold" style={{ color: Colors.textPrimary }}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs font-medium text-gray-500 mt-0.5">{subtitle}</Text>
          )}
        </View>
      </View>
      <ChevronRight size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: Colors.background }}>
      {/* Header */}
      <VendorHeader title={t('businessSettings') || 'Business Settings'} subtitle={t('managePartnerAccount') || 'Manage your partner account'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >

        {/* Profile Card */}
        <View className="px-5 mt-6">
          <View
            className="rounded-3xl p-6"
            style={{ backgroundColor: Colors.vendor, ...Shadows.medium }}
          >
            <View className="flex-row items-center">
              <Avatar name={user?.name || 'V'} size="lg" />
              <View className="ml-4 flex-1">
                <Text className="text-white text-xl font-bold">
                  {user?.name || 'Vendor Partner'}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Star size={14} color="#FCD34D" fill="#FCD34D" />
                  <Text className="text-white text-xs ml-1.5 font-bold">
                    {totalReviews > 0 ? avgRating : '0.0'}
                  </Text>
                  <Text className="text-white/70 text-xs ml-1 font-medium">
                    ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-6 pt-5 border-t border-white/15">
              <View className="flex-row items-center mb-2.5">
                <MapPin size={14} color="rgba(255,255,255,0.7)" />
                <Text className="text-white/80 text-xs font-medium ml-2">
                  Location not specified
                </Text>
              </View>
              <View className="flex-row items-center mb-2.5">
                <Phone size={14} color="rgba(255,255,255,0.7)" />
                <Text className="text-white/80 text-xs font-medium ml-2">
                  No phone added
                </Text>
              </View>
              <View className="flex-row items-center">
                <Mail size={14} color="rgba(255,255,255,0.7)" />
                <Text className="text-white/80 text-xs font-medium ml-2" numberOfLines={1}>
                  {user?.email || 'business@email.com'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rating Breakdown Section */}
        <View className="px-5 mt-6">
          <Text className="text-[10px] font-bold text-gray-400 mb-3 ml-1 tracking-widest">
            REVIEW PERFORMANCE
          </Text>
          <View className="bg-white rounded-3xl p-5" style={{borderWidth: 1, borderColor: Colors.border, ...Shadows.small}}>
            <View className="flex-row items-center mb-4 gap-4">
              <View className="items-center justify-center p-3 bg-amber-50 rounded-2xl border border-amber-100" style={{minWidth: 70}}>
                <Text className="text-3xl font-black text-amber-500">{totalReviews > 0 ? avgRating : '0.0'}</Text>
                <Text className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-wider">Out of 5</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-slate-700">Overall Rating</Text>
                <Text className="text-xs font-semibold text-slate-400 mt-1">
                  {totalReviews > 0 ? `Based on ${totalReviews} customer reviews` : 'No customer reviews yet'}
                </Text>
              </View>
            </View>

            <View className="gap-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const total = totalReviews || 1;
                const count = ratingDistribution[star] || 0;
                const percentage = totalReviews > 0 ? Math.round((count / total) * 100) : 0;
                
                return (
                  <View key={star} className="flex-row items-center gap-3">
                    <View className="flex-row items-center w-8 justify-end gap-1">
                      <Text className="text-xs font-bold text-slate-600">{star}</Text>
                      <Star size={10} fill="#F59E0B" color="#F59E0B" />
                    </View>
                    <View className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <View className="h-full rounded-full bg-amber-500" style={{ width: `${percentage}%` }} />
                    </View>
                    <View className="w-10">
                      <Text className="text-xs font-bold text-slate-400 text-right">{percentage}%</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View className="px-5 mt-8">
          <Text className="text-[10px] font-bold text-gray-400 mb-3 ml-1 tracking-widest">
            BUSINESS ACCOUNT
          </Text>
          <ProfileOption
            icon={Package}
            title="Manage My Services"
            subtitle="Edit, update, or add new services"
            onPress={() => router.push('/screens/vendor/Component/ManageServicesScreen')}
          />
          <ProfileOption
            icon={Calendar}
            title="Calendar Management"
            subtitle="Block dates and manage availability"
            onPress={() => router.push('/screens/vendor/Component/VendorCalendarScreen')}
          />
          <ProfileOption
            icon={Clock}
            title="Operating Times"
            subtitle="Manage your daily time slots"
            onPress={() => router.push('/screens/vendor/Component/TimeSlotsScreen')}
          />
          <ProfileOption
            icon={User}
            title="Business Profile"
            subtitle="Update your business and contact info"
            onPress={() => router.push('/screens/vendor/Component/AboutMeScreen')}
          />
          <ProfileOption
            icon={Settings}
            title="Settings & Privacy"
            subtitle="App alerts, privacy, and theme"
            onPress={() => router.push('/screens/vendor/Component/VendorSettingsScreen')}
          />
        </View>

        {/* Support Section */}
        <View className="px-5 mt-6">
          <Text className="text-[10px] font-bold text-gray-400 mb-3 ml-1 tracking-widest">
            SUPPORT
          </Text>
          <ProfileOption
            icon={HelpCircle}
            title="Partner Support"
            subtitle="Get help with your bookings"
            onPress={() => {
              Alert.alert('Help & Support', 'Contact us at asaantaqreebhelpline@outlook.com')
            }}
          />
        </View>

        {/* Logout & Delete */}
        <View className="px-5 mt-8 gap-3">
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            className="rounded-2xl p-4 flex-row items-center justify-center"
            style={{backgroundColor: Colors.errorLight + '40', borderWidth: 1, borderColor: Colors.error + '15'}}
          >
            <LogOut size={18} color={Colors.error} />
            <Text className="text-red-600 text-sm font-bold ml-2">
              Sign Out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
            className="p-4"
          >
            <Text className="text-gray-400 text-xs font-bold text-center">
              CLOSE VENDOR ACCOUNT
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-[10px] font-bold text-gray-300 mt-4 tracking-widest">
          ASAN TAQREEB VENDOR V1.0.4
        </Text>
      </ScrollView>
    </View>
  )
}
