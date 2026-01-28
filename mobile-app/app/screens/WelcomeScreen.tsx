import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome6"
import { PartyPopper } from "lucide-react-native"
import { useRouter } from "expo-router";


export default function WelcomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const roles = [
    {
      keyRole: "Client",
      title: "Plan an Event",
      subText: "Browse venues & book services",
      icon: "calendar-day",
      color: "#3B3F91",
      link: "/screens/client/ClientHomeScreen" as const
    },
    {
      keyRole: "Vendor",
      title: "List Services",
      subText: "Grow your business with us",
      icon: "briefcase",
      color: "#F7A015",
      link: "/screens/vendor/VendorHomeScreen" as const
    }
  ]

  return (
    <>
      <View style={[style.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} >
        <View className="bg-[#3B3F91] rounded-b-[70] p-12 mb-20">
          <View className="flex flex-row justify-start items-center gap-2 mb-5">
            <View className="bg-[#F7F6F2] rounded-xl px-2 py-2 border">
              <PartyPopper size={20} color={"#F7A015"} />
            </View>
            <Text className="text-lg text-white">Asaan Taqreeb</Text>
          </View>
          <Text className="text-4xl font-bold text-white mb-2">Welcome!</Text>
          <Text className="text-3xl font-normal text-white">Who are you today?</Text>
        </View>
        <View className="flex-col items-center gap-5">
          {roles.map(role => (
            <Pressable 
              key={role.keyRole} 
              onPress={() => router.push(role.link)}
              className="w-11/12 h-1/4 flex-row justify-evenly items-center bg-gray-100 self-center rounded-xl active:opacity-20"
              style={style.cardShadow}
            >
              <View className="bg-gray-200 px-2 py-2 rounded-xl">
                <Icon name={role.icon} color={role.color} size={35} />
              </View>
              <View>
                <Text className="text-2xl font-bold">{role.title}</Text>
                <Text className="text-lg text-gray-600">{role.subText}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </>
  )
};

const style = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F7F6F2",
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8, // For Android
  }
})