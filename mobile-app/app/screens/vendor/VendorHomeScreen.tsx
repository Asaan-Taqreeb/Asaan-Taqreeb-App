import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Building2, Utensils, Camera, Sparkles } from "lucide-react-native";
import { Colors, Shadows } from "@/app/_constants/theme";

interface ServiceType {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  route: string;
}

export default function VendorHomeScreen() {
  const insets = useSafeAreaInsets();

  const services: ServiceType[] = [
    {
      id: 'banquet',
      title: 'Banquet Hall',
      description: 'Manage venue bookings, capacity, and hall packages',
      icon: Building2,
      color: Colors.banquet,
      route: '/screens/vendor/BanquetServiceForm'
    },
    {
      id: 'catering',
      title: 'Catering Service',
      description: 'Set up menu packages, pricing, and food services',
      icon: Utensils,
      color: Colors.catering,
      route: '/screens/vendor/CateringServiceForm'
    },
    {
      id: 'photography',
      title: 'Photography Service',
      description: 'Create photography packages and showcase portfolio',
      icon: Camera,
      color: Colors.photo,
      route: '/screens/vendor/PhotographyServiceForm'
    },
    {
      id: 'parlor',
      title: 'Parlor/Salon',
      description: 'Manage beauty services, bridal packages, and styling',
      icon: Sparkles,
      color: Colors.parlor,
      route: '/screens/vendor/ParlorServiceForm'
    }
  ];

  const handleServiceSelect = (service: ServiceType) => {
    router.push(service.route);
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      {/* Header */}
      <View className='px-6 py-6' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
        <Text className='text-3xl font-extrabold' style={{color: Colors.textPrimary}}>Welcome Vendor! 👋</Text>
        <Text className='text-base font-medium mt-2' style={{color: Colors.textSecondary}}>
          Select the type of service you want to offer
        </Text>
      </View>

      {/* Service Selection */}
      <ScrollView 
        className='flex-1 px-6 py-6'
        showsVerticalScrollIndicator={false}
      >
        <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>
          Choose Your Service Category
        </Text>

        <View className='gap-4'>
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Pressable
                key={service.id}
                className='rounded-2xl overflow-hidden active:opacity-90'
                style={[
                  {
                    backgroundColor: Colors.white,
                    borderWidth: 2,
                    borderColor: Colors.border,
                  },
                  Shadows.medium
                ]}
                onPress={() => handleServiceSelect(service)}
              >
                <View className='flex-row items-center p-5'>
                  {/* Icon */}
                  <View 
                    className='rounded-2xl p-4 mr-4'
                    style={{backgroundColor: `${service.color}20`}}
                  >
                    <Icon size={32} color={service.color} />
                  </View>

                  {/* Content */}
                  <View className='flex-1'>
                    <Text className='text-xl font-extrabold mb-1' style={{color: Colors.textPrimary}}>
                      {service.title}
                    </Text>
                    <Text className='text-sm font-medium leading-relaxed' style={{color: Colors.textSecondary}}>
                      {service.description}
                    </Text>
                  </View>

                  {/* Arrow Indicator */}
                  <View className='ml-2'>
                    <View 
                      className='rounded-full p-2'
                      style={{backgroundColor: service.color}}
                    >
                      <Text className='text-white text-lg font-bold'>→</Text>
                    </View>
                  </View>
                </View>

                {/* Color Accent Bar */}
                <View style={{height: 4, backgroundColor: service.color}} />
              </Pressable>
            );
          })}
        </View>

        {/* Info Box */}
        <View 
          className='rounded-2xl p-5 mt-6 mb-4'
          style={{backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#93c5fd'}}
        >
          <Text className='text-base font-bold mb-2' style={{color: Colors.info}}>
            💡 Getting Started
          </Text>
          <Text className='text-sm leading-relaxed' style={{color: Colors.info}}>
            Select your service category to fill in your business details, create packages, and start receiving booking requests from clients.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background
  }
});
