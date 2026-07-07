import { Alert, Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import { User, Store, ChevronRight, Compass } from "lucide-react-native"
import { useRouter } from "expo-router";
import { Colors, Shadows } from "@/app/_constants/theme";
import AppLogo from "./client/Component/AppLogo";
import { useUser } from "@/app/_context/UserContext";
import { clearAuthTokens } from "@/app/_utils/authStorage";
import { useLanguage } from "@/app/_context/LanguageContext";
import LanguagePickerModal from "@/app/_components/LanguagePickerModal";
import { useState } from "react";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const router = useRouter()
  const { setUser } = useUser()
  const { language, languageLabel, languageOptions, setLanguage, t } = useLanguage()
  const [showLanguagePicker, setShowLanguagePicker] = useState(false)
  const compact = width < 380

  const roles = [
    {
      keyRole: "Client",
      title: t('bookRoleTitle'),
      subText: t('welcomeSubtitleClient'),
      icon: User,
      color: Colors.accent, // Electric Blue
      bgColor: '#EFF6FF',
      link: "/screens/client/Component/LoginScreen" as const
    },
    {
      keyRole: "Vendor",
      title: t('vendorRoleTitle'),
      subText: t('welcomeSubtitleVendor'),
      icon: Store,
      color: Colors.primary, // Electric Cyan
      bgColor: Colors.primaryMuted,
      link: "/screens/vendor/VendorLoginScreen" as const
    }
  ]

  const handleContinueAsGuest = async () => {
    try {
      await clearAuthTokens()
      setUser({
        id: 'guest-user',
        name: 'Guest',
        role: 'client',
        isGuest: true,
      })
      router.replace('/screens/client/ClientHomeScreen')
    } catch {
      Alert.alert('Guest Mode Unavailable', 'Please try again.')
    }
  }

  return (
    <View style={[style.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: compact ? 12 : 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          <View className={compact ? "items-center mb-8" : "items-center mb-10"}>
            <AppLogo size="large" />
            <Pressable
              onPress={() => setShowLanguagePicker(true)}
              className={compact ? "mt-4 px-3 py-2 rounded-full" : "mt-5 px-4 py-2 rounded-full"}
              style={{ backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border }}
            >
              <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: Colors.textPrimary }}>
                {t('appLanguage')}: {languageLabel}
              </Text>
            </Pressable>
          </View>

          <View className={compact ? "gap-4 mb-5" : "gap-5 mb-6"}>
            {roles.map(role => (
              <Pressable 
                key={role.keyRole} 
                onPress={() => router.push(role.link)}
                className="active:opacity-90"
              >
                <View 
                    className={compact ? "flex-row items-center p-5 rounded-[24px]" : "flex-row items-center p-6 rounded-[24px]"}
                  style={[style.cardShadow, { backgroundColor: Colors.white }]}
                >
                  <View 
                      className={compact ? "w-14 h-14 rounded-2xl items-center justify-center" : "w-16 h-16 rounded-2xl items-center justify-center"} 
                    style={{ backgroundColor: role.bgColor }} 
                  >
                      <role.icon color={role.color} size={compact ? 26 : 30} />
                  </View>
                  
                  <View className="flex-1 ml-5">
                      <Text className={compact ? "text-lg font-extrabold" : "text-xl font-extrabold"} style={{ color: Colors.textPrimary }}>
                      {role.title}
                    </Text>
                      <Text className={compact ? "text-xs font-medium mt-1" : "text-sm font-medium mt-1"} style={{ color: Colors.textSecondary }}>
                      {role.subText}
                    </Text>
                  </View>

                  <ChevronRight size={20} color={Colors.textTertiary} />
                </View>
              </Pressable>
            ))}

            <Pressable
              onPress={handleContinueAsGuest}
              className="active:opacity-90"
            >
              <View
                className={compact ? "flex-row items-center p-5 rounded-[24px] border border-dashed" : "flex-row items-center p-6 rounded-[24px] border border-dashed"}
                style={[style.cardShadow, { backgroundColor: '#F8FAFC', borderColor: Colors.border }]}
              >
                <View
                  className={compact ? "w-14 h-14 rounded-2xl items-center justify-center" : "w-16 h-16 rounded-2xl items-center justify-center"}
                  style={{ backgroundColor: '#E0F2FE' }}
                >
                  <Compass color={Colors.primary} size={compact ? 26 : 30} />
                </View>

                <View className="flex-1 ml-5">
                  <Text className={compact ? "text-lg font-extrabold" : "text-xl font-extrabold"} style={{ color: Colors.textPrimary }}>
                    {t('continueAsGuest')}
                  </Text>
                  <Text className={compact ? "text-xs font-medium mt-1" : "text-sm font-medium mt-1"} style={{ color: Colors.textSecondary }}>
                    {t('guestDescription')}
                  </Text>
                </View>

                <ChevronRight size={20} color={Colors.textTertiary} />
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Text className={compact ? "text-center text-[10px] font-bold mb-4 uppercase tracking-widest" : "text-center text-xs font-bold mb-4 uppercase tracking-widest"} style={{ color: Colors.textTertiary }}>
        Asaan Taqreeb • Premium
      </Text>

      <LanguagePickerModal
        visible={showLanguagePicker}
        currentLanguage={language}
        options={languageOptions}
        onSelect={(nextLanguage) => {
          setLanguage(nextLanguage)
          setShowLanguagePicker(false)
        }}
        onClose={() => setShowLanguagePicker(false)}
      />
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