import { Alert, View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Bot } from 'lucide-react-native'
import Header from '../Component/Header'
import CategoriesView from '../Component/CategoriesView'
import FeaturedVendors from '../Component/FeaturedVendors'
import { useUser } from '@/app/_context/UserContext'
import { useLanguage } from '@/app/_context/LanguageContext'

const S = {
  gray50: '#FAFAFA',
  blue:   '#2563EB',
  white:  '#FFFFFF',
  border: '#E4E4E7',
}

export default function ClientHomeScreen() {
  const insets    = useSafeAreaInsets()
  const { user }  = useUser()
  const { t }     = useLanguage()

  const handleOpenAIChat = () => {
    if (user?.isGuest) {
      Alert.alert('Guest Mode', t('signInToUseChat'))
      return
    }
    router.push('/screens/client/Component/AIChatScreen')
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        <CategoriesView />
        <FeaturedVendors />
      </ScrollView>

      {/* ── AI Chat FAB ─────────────────────────────────────────── */}
      <Pressable
        style={styles.fab}
        onPress={handleOpenAIChat}
      >
        <Bot color={S.white} size={22} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: S.gray50,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: S.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
