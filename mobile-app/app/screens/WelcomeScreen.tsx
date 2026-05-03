import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, Store, ChevronRight } from "lucide-react-native"
import { useRouter } from "expo-router";
import { Colors, Shadows } from "@/app/_constants/theme";
import AppLogo from "./client/Component/AppLogo";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const roles = [
    {
      keyRole: "Client",
      title: "I want to Book",
      subText: "Venues, Food, Decor & more.",
      icon: User,
      color: Colors.accent, // Electric Blue
      bgColor: '#EFF6FF',
      link: "/screens/client/Component/LoginScreen" as const
    },
    {
      keyRole: "Vendor",
      title: "I am a Vendor",
      subText: "List services & get orders.",
      icon: Store,
      color: Colors.primary, // Electric Cyan
      bgColor: Colors.primaryMuted,
      link: "/screens/vendor/VendorLoginScreen" as const
    }
  ]

  return (
    <View style={[style.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} >
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-16">
          <AppLogo size="medium" />
        </View>

        <View className="gap-5">
          {roles.map(role => (
            <Pressable 
              key={role.keyRole} 
              onPress={() => router.push(role.link)}
              className="active:opacity-90"
            >
              <View 
                className="flex-row items-center p-6 rounded-[24px]"
                style={[style.cardShadow, { backgroundColor: Colors.white }]}
              >
                <View 
                  className="w-16 h-16 rounded-2xl items-center justify-center" 
                  style={{ backgroundColor: role.bgColor }} 
                >
                  <role.icon color={role.color} size={30} />
                </View>
                
                <View className="flex-1 ml-5">
                  <Text className="text-xl font-extrabold" style={{ color: Colors.textPrimary }}>
                    {role.title}
                  </Text>
                  <Text className="text-sm font-medium mt-1" style={{ color: Colors.textSecondary }}>
                    {role.subText}
                  </Text>
                </View>

                <ChevronRight size={20} color={Colors.textTertiary} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <Text className="text-center text-xs font-bold mb-4 uppercase tracking-widest" style={{ color: Colors.textTertiary }}>
        Asaan Taqreeb • Premium
      </Text>
    </View>
  )
};

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  logoBox: {
    backgroundColor: Colors.vendor, // Midnight Navy
    borderRadius: 24,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardShadow: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
})