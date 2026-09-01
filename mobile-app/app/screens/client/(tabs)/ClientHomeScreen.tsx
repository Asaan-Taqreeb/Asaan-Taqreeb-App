import { Alert, View, StyleSheet, ScrollView, Pressable, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bot, Map as MapIcon } from "lucide-react-native";
import Header from "../Component/Header";
import CategoriesView from "../Component/CategoriesView";
import FeaturedVendors from "../Component/FeaturedVendors";
import { Colors, Shadows } from "@/app/_constants/theme";
import { useUser } from "@/app/_context/UserContext";
import { useLanguage } from '@/app/_context/LanguageContext';

export default function ClientHomeScreen() {
    const insets = useSafeAreaInsets()
    const { user } = useUser()
    const { t } = useLanguage()

    const handleOpenAIChat = () => {
      if (user?.isGuest) {
        if (Platform.OS === 'web') {
          const shouldSignIn = window.confirm((t('signInToUseChat') || 'Sign in to use the Event Concierge.') + ' Click OK to sign in.')
          if (shouldSignIn) {
            router.push('/screens/client/Component/LoginScreen')
          }
        } else {
          Alert.alert('Guest Mode', t('signInToUseChat') || 'Sign in to use the Event Concierge.')
        }
        return
      }

      router.push("/screens/client/Component/AIChatScreen")
    }

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <CategoriesView />

        {/* Explore on Map Banner */}
        <Pressable
          className="mx-5 my-2.5 rounded-3xl p-5 overflow-hidden flex-row items-center justify-between bg-white border border-gray-100 active:opacity-85"
          style={Shadows.medium}
          onPress={() =>
            router.push({
              pathname: '/screens/client/Component/VendorListView',
              params: { mapMode: 'true' },
            })
          }
        >
          <View className="flex-1 mr-4">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                Live Interactive Map
              </Text>
            </View>
            <Text className="text-base font-extrabold" style={{ color: Colors.textPrimary }}>
              Explore Vendors Near You
            </Text>
            <Text className="text-xs font-medium text-gray-400 mt-0.5">
              Locate luxury venues, caterers, and salons on the map
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: `${Colors.primary}12` }}
          >
            <MapIcon color={Colors.primary} size={22} />
          </View>
        </Pressable>

        <FeaturedVendors />
      </ScrollView>

      {/* Floating AI Chat Button */}
      <Pressable
        className='absolute right-6 rounded-full p-4 active:opacity-80'
        style={[{
          backgroundColor: Colors.primary,
          bottom: insets.bottom > 0 ? insets.bottom + 90 : 100
        }, Shadows.large]}
        onPress={handleOpenAIChat}
      >
        <Bot color={Colors.white} size={28} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.background
    },
})
