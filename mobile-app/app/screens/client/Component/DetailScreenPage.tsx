import { router, useLocalSearchParams } from 'expo-router'
import { CircleAlert, Dot, MapPin, Star, Circle, ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react-native'
import { useState } from 'react'
import { Dimensions, ScrollView, Modal } from 'react-native'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function DetailScreenPage() {
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams()
    const [expandedPackages, setExpandedPackages] = useState<{[key: number]: boolean}>({})
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [expandedImage, setExpandedImage] = useState(false)
    const imageHeight = Math.max(220, Math.round(Dimensions.get('window').height * 0.28))

    const togglePackage = (packageId: number) => {
        setExpandedPackages(prev => ({
            ...prev,
            [packageId]: !prev[packageId]
        }))
    }

    let vendor = null
    if (params.vendor) {
        try {
            vendor = JSON.parse(params.vendor as string)
        } catch (e) {
            vendor = null
        }
    }

    const imageUrls = vendor?.images?.length ? vendor.images : []
    const safeImageIndex = imageUrls.length ? Math.min(currentImageIndex, imageUrls.length - 1) : 0

    const handlePrevImage = () => {
        if (imageUrls.length) {
            setCurrentImageIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))
        }
    }

    const handleNextImage = () => {
        if (imageUrls.length) {
            setCurrentImageIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1))
        }
    }

    if (!vendor) {
        return (
            <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
                <Text className='text-center mt-10 text-lg'>Vendor details not available</Text>
            </View>
        )
    }


  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View className='m-5 flex-row justify-normal items-center gap-5'>
            <Pressable className='bg-gray-100 rounded-full px-2 py-2' onPress={() => router.push("/screens/client/Component/VendorListView")}>
                <ArrowLeft color={"#4546E5"} />
            </Pressable>
            <Text className='text-2xl font-bold'>Browse Details</Text>
        </View>
        <View className='flex-1'>
            <View className='relative'>
                <Pressable className='active:opacity-90' onPress={() => setExpandedImage(true)}>
                    <Image 
                        source={{uri: imageUrls[safeImageIndex]}} 
                        style={{width: "100%", height: imageHeight}}
                        resizeMode='cover'
                    />
                </Pressable>
                {imageUrls.length > 1 && (
                    <>
                        <Pressable
                            className='absolute left-3 top-1/2 -mt-5 bg-[#0A0A0A] opacity-60 rounded-full p-2'
                            onPress={handlePrevImage}
                        >
                            <ChevronLeft color="#FAFAFA" />
                        </Pressable>
                        <Pressable
                            className='absolute right-3 top-1/2 -mt-5 bg-[#0A0A0A] opacity-60 rounded-full p-2'
                            onPress={handleNextImage}
                        >
                            <ChevronRight color="#FAFAFA" />
                        </Pressable>
                        <View className='absolute bottom-3 w-full flex-row justify-center items-center gap-2'>
                            {imageUrls.map((_: string, index: number) => (
                                <View
                                    key={index}
                                    className='w-2 h-2 rounded-full'
                                    style={{ backgroundColor: index === safeImageIndex ? "#4f46e5" : "#E2E8F0" }}
                                />
                            ))}
                        </View>
                    </>
                )}
            </View>
            <Modal
                visible={expandedImage}
                transparent={true}
                animationType='fade'
                onRequestClose={() => setExpandedImage(false)}
            >
                <View className='flex-1 bg-[#0A0A0A] justify-center items-center'>
                    <Pressable
                        className='absolute top-10 right-6 bg-[#0A0A0A] p-2 rounded-full'
                        onPress={() => setExpandedImage(false)}
                    >
                        <X color="#FAFAFA" />
                    </Pressable>
                    <Image
                        source={{uri: imageUrls[safeImageIndex]}}
                        style={{width: "95%", height: "70%"}}
                        resizeMode='contain'
                    />
                </View>
            </Modal>
            <ScrollView className='flex-1'>
                {/* Header Section */}
                <View className='flex-row justify-between items-center p-5'>
                    <View className='flex-1 mr-3'>
                        <Text className='text-2xl font-bold mb-2'>{vendor.name}</Text>
                        <Text className='text-base'><MapPin />  {vendor.location}</Text>
                    </View>
                    <View>
                        <Text className='text-xl font-medium text-indigo-600 text-center'>
                            PKR {vendor.category === "banquet" ? vendor.price.toLocaleString() : vendor.packages[0].price.toLocaleString()}
                        </Text>
                        <Text className='text-base text-center'>
                            {vendor.category === "banquet" ? "Starting Price" : "From"}
                        </Text>
                    </View>
                </View>

                {/* Rating and Info */}
                <View className='flex-row justify-normal items-center gap-2 mt-2 mx-5'>
                    <View className='bg-amber-50 px-2 py-2 rounded-lg'>
                        <Text className='text-base text-amber-600 font-medium'><Star color={"#d97706"} fill={"#d97706"} />  {vendor.rating}</Text>
                    </View>
                    <View className='bg-blue-50 px-2 py-2 rounded-lg'>
                        <Text className='text-base text-blue-600 font-medium'><CircleAlert color={"#2563eb"} />  50% Refundable</Text>
                    </View>
                </View>

                {/* About Section */}
                <View className='mt-2 mx-5'>
                    <Text className='text-xl font-semibold'>About</Text>
                    <Text className='text-base mt-2'>{vendor.about}</Text>
                </View>

                {/* Banquet Specific Info */}
                {vendor.category === "banquet" && (
                    <View className='flex-row items-center mt-4 gap-4 mx-5'>
                        <View className='bg-[#FFFFFF] w-2/5 py-4 rounded-xl' style={styles.boxShadow}>
                            <Text className='text-xl font-semibold text-center'>Min Capacity</Text>
                            <Text className='text-center text-lg font-medium'>{vendor.minGuests}{" "}
                                <Text className='text-base font-normal'>Guests</Text>
                            </Text>
                        </View>
                        <View className='bg-[#FFFFFF] w-2/5 py-4 rounded-xl' style={styles.boxShadow}>
                            <Text className='text-xl font-medium text-center'>Max Capacity</Text>
                            <Text className='text-center text-lg font-medium'>{vendor.maxGuests}{" "}
                                <Text className='text-base font-normal'>Guests</Text>
                            </Text>
                        </View>
                    </View>
                )}

                {/* Packages Section */}
                {vendor.packages && vendor.packages.length > 0 && (
                    <View className='mx-5 mt-5 mb-5'>
                        <Text className='text-xl font-medium mb-3'>
                            {vendor.category === "catering" ? "Catering Packages" : 
                             vendor.category === "photo" ? "Photography Packages" :
                             "Parlor Packages"}
                        </Text>
                        {vendor.packages.map((pkg: any) => (
                            <View key={pkg.id} className='bg-[#FFFFFF] py-5 px-5 rounded-md mb-4' style={styles.boxShadow}>
                                <Pressable className='flex-row justify-between items-start' onPress={() => togglePackage(pkg.id)}>
                                    <View className='flex-row justify-normal items-center gap-2'>
                                        <Circle size={15} color={expandedPackages[pkg.id] ? "#4f46e5" : "#0A0A0A"} fill={expandedPackages[pkg.id] ? "#4f46e5" : "#FAFAFA"} />
                                        <Text className='text-lg font-semibold underline'>{pkg.packageName}</Text>
                                    </View>
                                    <View>
                                        <Text className='text-xl font-semibold text-indigo-600 text-center'>PKR {pkg.price.toLocaleString()}</Text>
                                        {(vendor.category === "catering" || (vendor.category === "photo" && pkg.guestCount)) && (
                                            <Text className='text-base text-center'>
                                                {vendor.category === "catering" ? `PKR ${pkg.pricePerHead}/head` : ""}
                                            </Text>
                                        )}
                                    </View>
                                </Pressable>

                                {/* Catering - Show courses */}
                                {expandedPackages[pkg.id] && vendor.category === "catering" && pkg.mainCourse && (
                                    <View className='mt-4 flex-row justify-normal items-start flex-wrap gap-5'>
                                        <View>
                                            <Text className='text-lg font-medium mb-2'>Main Course</Text>
                                            <View>
                                                {pkg.mainCourse.map((item: string, idx: number) => (
                                                    <View key={idx} className='flex-row items-center'>
                                                        <Dot /> 
                                                        <Text className='text-base'>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                        <View>
                                            <Text className='text-lg font-medium mb-2'>Desserts</Text>
                                            <View>
                                                {pkg.desserts.map((item: string, idx: number) => (
                                                    <View key={idx} className='flex-row items-center'>
                                                        <Dot /> 
                                                        <Text className='text-base'>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                        <View>
                                            <Text className='text-lg font-medium mb-2'>Drinks</Text>
                                            <View>
                                                {pkg.drinks.map((item: string, idx: number) => (
                                                    <View key={idx} className='flex-row items-center'>
                                                        <Dot /> 
                                                        <Text className='text-base'>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Photography & Parlor - Show items */}
                                {expandedPackages[pkg.id] && (vendor.category === "photo" || vendor.category === "parlor") && pkg.items && (
                                    <View className='mt-3'>
                                        {pkg.items.map((item: string, idx: number) => (
                                            <View key={idx} className='flex-row items-center mb-1'>
                                                <Dot /> 
                                                <Text className='text-base ml-1'>{item}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
                <Pressable 
                    className='active:opacity-55 mt-5 self-center bg-indigo-600 rounded-xl w-11/12 py-5 mb-5'
                    style={styles.boxShadow}
                    onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}
                >
                    <Text className='text-xl text-[#FAFAFA] text-center font-bold'>Request Booking</Text>
                </Pressable>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "#FAFAFA"
    },
    boxShadow: {
        shadowColor: "#0A0A0A",
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 6
    }
})