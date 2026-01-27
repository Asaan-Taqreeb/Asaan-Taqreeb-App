import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useLocation from "./Component/hooks/useLocation";
import Header from "./Component/Header";

export default function ClientHomeScreen() {
    const insets = useSafeAreaInsets()

  return (
    <View style={[style.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <Header />
    </View>
  )
}

const style = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "#F7F6F2"
    }
})
