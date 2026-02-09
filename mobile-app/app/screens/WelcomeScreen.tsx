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
      color: "#4546E5",
      link: "/screens/client/Component/OnBoardingScreen" as const
    },
    {
      keyRole: "Vendor",
      title: "List Services",
      subText: "Grow your business with us",
      icon: "briefcase",
      color: "#F97316",
      link: "/screens/vendor/VendorHomeScreen" as const
    }
  ]

  return (
    <>
      <View style={[style.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} >
        <View className="bg-[#4546E5] rounded-b-[70] p-12 mb-20">
          <View className="flex flex-row justify-start items-center gap-2 mb-5">
            <View className="bg-[#F8FAFC] rounded-xl px-2 py-2 border border-[#64748B]">
              <PartyPopper size={20} color={"#F97316"} />
            </View>
            <Text className="text-lg font-medium text-[#F8FAFC]">Asaan Taqreeb</Text>
          </View>
          <Text className="text-4xl font-bold text-[#F8FAFC] mb-2">Welcome!</Text>
          <Text className="text-3xl font-medium text-[#F8FAFC]">Who are you today?</Text>
        </View>

        <View>
          {roles.map(role => (
            <Pressable 
              key={role.keyRole} 
              onPress={() => router.push(role.link)}
              className="active:opacity-85"
            >
              <View 
                className="px-6 py-10 bg-[#F8FAFC] self-center rounded-[30] flex justify-center items-center flex-row gap-10 mb-12"
                style={style.cardShadow}
              >
                <View className="px-4 py-3 rounded-xl bg-slate-100" >
                  <Icon name={role.icon} color={role.color} size={35} />
                </View>
                <View>
                  <Text className="text-2xl font-bold">{role.title}</Text>
                  <Text className="text-lg text-[#64748B]">{role.subText}</Text>
                </View>
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
    backgroundColor: "#F8FAFC",
  },
  cardShadow: {
    shadowColor: "black",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8, // For Android
  }
})