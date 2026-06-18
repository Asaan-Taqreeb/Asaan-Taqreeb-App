import { Alert, View, StyleSheet, ScrollView, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MessageSquare, Map as MapIcon } from "lucide-react-native";
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
        Alert.alert('Guest Mode', t('signInToUseChat') || 'Sign in to use the Event Concierge.')
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
          className="mx-5 my-2 rounded-3xl p-5 overflow-hidden flex-row items-center justify-between"
          style={[{ backgroundColor: Colors.primary + '12', borderWidth: 1, borderColor: Colors.primary + '20' }]}
          onPress={() => router.push({
            pathname: "/screens/client/Component/VendorListView",
            params: { mapMode: 'true' }
          })}
        >
          <View className="flex-1 mr-4">
            <Text className="text-base font-black" style={{ color: Colors.primary }}>Explore Vendors on Map</Text>
            <Text className="text-xs font-semibold mt-1" style={{ color: Colors.textSecondary }}>Find venues, caterers, and salons near you visually</Text>
          </View>
          <View className="p-3 rounded-2xl bg-white" style={Shadows.small}>
            <MapIcon color={Colors.primary} size={22} />
          </View>
        </Pressable>

        <FeaturedVendors />
      </ScrollView>

      {/* Floating AI Chat Button */}
      <Pressable
        className='absolute bottom-6 right-6 rounded-full p-4 active:opacity-80'
        style={[{backgroundColor: Colors.primary}, Shadows.large]}
        onPress={handleOpenAIChat}
      >
        <MessageSquare color={Colors.white} size={28} />
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
