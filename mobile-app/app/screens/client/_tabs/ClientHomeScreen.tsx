import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../Component/Header";
import CategoriesView from "../Component/CategoriesView";
import FeaturedVendors from "../Component/FeaturedVendors";
import { Colors } from "@/app/constants/theme";

export default function ClientHomeScreen() {
    const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        <CategoriesView />
        <FeaturedVendors />
      </ScrollView>
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
