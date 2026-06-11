import { Alert, View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MessageSquare } from "lucide-react-native";
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
