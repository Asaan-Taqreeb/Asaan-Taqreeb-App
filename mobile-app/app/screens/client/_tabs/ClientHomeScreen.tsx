import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bot } from "lucide-react-native";
import Header from "../Component/Header";
import CategoriesView from "../Component/CategoriesView";
import FeaturedVendors from "../Component/FeaturedVendors";
import { Colors, Shadows } from "@/app/_constants/theme";

export default function ClientHomeScreen() {
    const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        <CategoriesView />
        <FeaturedVendors />
      </ScrollView>

      {/* Floating AI Chat Button */}
      <Pressable
        className='absolute bottom-6 right-6 rounded-full p-4 active:opacity-80'
        style={[{backgroundColor: Colors.primary}, Shadows.large]}
        onPress={() => router.push("/screens/client/Component/AIChatScreen")}
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
