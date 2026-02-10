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
      title: "I want to Book",
      subText: "Venues, Food, Parlor & more.",
      icon: "calendar-day",
      color: "#4546E5",
      borderColor: "#6366F1",
      link: "/screens/client/Component/OnBoardingScreen" as const
    },
    {
      keyRole: "Vendor",
      title: "I am a Vendor",
      subText: "List services and get orders.",
      icon: "briefcase",
      color: "#F59E0B",
      borderColor: "#FBBF24",
      link: "/screens/vendor/VendorHomeScreen" as const
    }
  ]

  return (
    <>
      <View style={[style.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} >
        <View className="bg-indigo-600 rounded-b-[100] p-12 mb-20">
          <View className="flex flex-row justify-start items-center gap-2 mb-5">
            <View className="bg-[#F8FAFC] rounded-xl px-2 py-2 border border-[#64748B]">
              <PartyPopper size={20} color={"#7C3AED"} />
            </View>
            <Text className="text-lg font-medium text-[#FAFAFA]">Asaan Taqreeb</Text>
          </View>
          <Text className="text-4xl font-bold text-[#FAFAFA] mb-2">Welcome!</Text>
          <Text className="text-3xl font-medium text-[#FAFAFA]">Who are you today?</Text>
        </View>

          {roles.map(role => (
            <Pressable 
              key={role.keyRole} 
              onPress={() => router.push(role.link)}
              className="active:opacity-85"
            >
              <View 
                className="w-11/12 py-10 bg-[#FAFAFA] self-center rounded-[30] mb-12"
                style={style.cardShadow}
              >
                <View className="flex-row justify-evenly items-center ">
                  <View className="px-4 py-3 rounded-2xl bg-gray-100" style={{borderWidth: 1, borderColor: role.borderColor}} >
                    <Icon name={role.icon} color={role.color} size={35} />
                  </View>
                  <View>
                    <Text className="text-2xl font-bold">{role.title}</Text>
                    <Text className="text-lg text-gray-400">{role.subText}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
      </View>
    </>
  )
};

const style = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FAFAFA",
  },
  cardShadow: {
    shadowColor: "black",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8, // For Android
  },
  backBorder: {
    borderWidth: 1
  }
})