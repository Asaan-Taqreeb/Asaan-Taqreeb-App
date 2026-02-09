import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../Component/Header";
import CategoriesView from "../Component/CategoriesView";
import FeaturedVendors from "../Component/FeaturedVendors";

export default function ClientHomeScreen() {
    const insets = useSafeAreaInsets()

  return (
    <View style={[style.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <Header />
      <ScrollView>
        <CategoriesView />
        <FeaturedVendors />
      </ScrollView>
    </View>
  )
}

const style = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "#FAFAFA"
    },
})
