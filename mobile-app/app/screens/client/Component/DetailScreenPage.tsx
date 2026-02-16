import { router, useLocalSearchParams } from 'expo-router'
import { CircleAlert, Dot, MapPin, Star, Circle, ChevronLeft, ChevronRight, X, ArrowLeft, Plus } from 'lucide-react-native'
import { useState } from 'react'
import { Dimensions, ScrollView, Modal, TextInput } from 'react-native'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, getCategoryColor, Shadows, Spacing } from '@/app/constants/theme'

export default function DetailScreenPage() {
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams()
    const [expandedPackages, setExpandedPackages] = useState<{[key: number]: boolean}>({})
    const [selectedGuestCount, setSelectedGuestCount] = useState<number | null>(null)
    const [showCustomPackage, setShowCustomPackage] = useState(false)
    const [customPackageName, setCustomPackageName] = useState('')
    const [customPackagePrice, setCustomPackagePrice] = useState('')
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [expandedImage, setExpandedImage] = useState(false)
    const imageHeight = Math.max(240, Math.round(Dimensions.get('window').height * 0.3))

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
    const categoryColor = vendor ? getCategoryColor(vendor.category) : Colors.primary

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
                <Text className='text-center mt-10 text-lg' style={{color: Colors.textPrimary}}>Vendor details not available</Text>
            </View>
        )
    }


  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View className='flex-row items-center gap-4 px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
            <Pressable className='rounded-full p-2 active:opacity-70' style={{backgroundColor: Colors.lightGray}} onPress={() => router.push("/screens/client/Component/VendorListView")}>
                <ArrowLeft color={categoryColor} size={24} />
            </Pressable>
            <Text className='text-xl font-extrabold flex-1' style={{color: Colors.textPrimary}}>Browse Details</Text>
        </View>
        <View className='flex-1'>
            <View className='relative'>
                <Pressable className='active:opacity-95' onPress={() => setExpandedImage(true)}>
                    <Image 
                        source={{uri: imageUrls[safeImageIndex]}} 
                        style={{width: "100%", height: imageHeight}}
                        resizeMode='cover'
                    />
                </Pressable>
                {imageUrls.length > 1 && (
                    <>
                        <Pressable
                            className='absolute left-3 top-1/2 -mt-6 rounded-full p-2 active:opacity-90'
                            style={{backgroundColor: Colors.overlay}}
                            onPress={handlePrevImage}
                        >
                            <ChevronLeft color={Colors.white} size={24} />
                        </Pressable>
                        <Pressable
                            className='absolute right-3 top-1/2 -mt-6 rounded-full p-2 active:opacity-90'
                            style={{backgroundColor: Colors.overlay}}
                            onPress={handleNextImage}
                        >
                            <ChevronRight color={Colors.white} size={24} />
                        </Pressable>
                        <View className='absolute bottom-4 w-full flex-row justify-center items-center gap-2'>
                            {imageUrls.map((_: string, index: number) => (
                                <View
                                    key={index}
                                    className='w-2 h-2 rounded-full'
                                    style={{ backgroundColor: index === safeImageIndex ? categoryColor : Colors.white }}
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
                <View className='flex-1 justify-center items-center' style={{backgroundColor: Colors.textPrimary}}>
                    <Pressable
                        className='absolute top-12 right-6 p-3 rounded-full active:opacity-80'
                        style={{backgroundColor: Colors.overlay}}
                        onPress={() => setExpandedImage(false)}
                    >
                        <X color={Colors.white} size={24} />
                    </Pressable>
                    <Image
                        source={{uri: imageUrls[safeImageIndex]}}
                        style={{width: "95%", height: "70%"}}
                        resizeMode='contain'
                    />
                </View>
            </Modal>
            <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View className='flex-row justify-between items-start gap-3 px-5 py-5'>
                    <View className='flex-1'>
                        <Text className='text-2xl font-extrabold mb-2 leading-tight' style={{color: Colors.textPrimary}}>{vendor.name}</Text>
                        <View className='flex-row items-start gap-2 mt-1'>
                            <MapPin size={16} color={Colors.textSecondary} className='mt-1 flex-shrink-0' />
                            <Text className='text-sm font-medium flex-1' style={{color: Colors.textSecondary}} numberOfLines={2}>{vendor.location}</Text>
                        </View>
                    </View>
                    <View className='items-end'>
                        <Text className='text-xs font-semibold mb-1' style={{color: Colors.textSecondary}}>FROM</Text>
                        <Text className='text-lg font-extrabold' style={{color: categoryColor}}>
                            PKR {vendor.category === "banquet" ? vendor.price.toLocaleString() : (vendor.packages && vendor.packages[0] ? vendor.packages[0].price.toLocaleString() : "0")}
                        </Text>
                    </View>
                </View>

                {/* Rating and Info */}
                <View className='flex-row items-center gap-3 px-5 flex-wrap mb-4'>
                    <View className='flex-row items-center gap-1 px-3 py-2 rounded-lg' style={{backgroundColor: '#fef3c7'}}>
                        <Star size={14} color={Colors.rating} fill={Colors.rating} />
                        <Text className='text-sm font-bold' style={{color: Colors.rating}}>{vendor.rating}</Text>
                    </View>
                    <View className='flex-row items-center gap-1 px-3 py-2 rounded-lg' style={{backgroundColor: '#dbeafe'}}>
                        <CircleAlert size={14} color={Colors.info} />
                        <Text className='text-xs font-bold' style={{color: Colors.info}}>50% Refundable</Text>
                    </View>
                </View>

                {/* About Section */}
                <View className='px-5 mb-5'>
                    <Text className='text-xl font-extrabold mb-3' style={{color: Colors.textPrimary}}>About</Text>
                    <Text className='text-sm leading-relaxed' style={{color: Colors.textSecondary}}>{vendor.about}</Text>
                </View>

                {/* Banquet Specific Info */}
                {vendor.category === "banquet" && (
                    <View className='px-5 mb-5'>
                        <Text className='text-lg font-extrabold mb-4' style={{color: Colors.textPrimary}}>Guest Capacity</Text>
                        <View className='flex-row gap-3'>
                            <View className='flex-1 py-4 px-3 rounded-2xl' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
                                <Text className='text-xs font-bold text-center mb-1' style={{color: Colors.textSecondary}}>MINIMUM</Text>
                                <Text className='text-center text-2xl font-extrabold my-2' style={{color: categoryColor}}>{vendor.minGuests}</Text>
                                <Text className='text-center text-xs font-medium' style={{color: Colors.textSecondary}}>Guests</Text>
                            </View>
                            <View className='flex-1 py-4 px-3 rounded-2xl' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
                                <Text className='text-xs font-bold text-center mb-1' style={{color: Colors.textSecondary}}>MAXIMUM</Text>
                                <Text className='text-center text-2xl font-extrabold my-2' style={{color: categoryColor}}>{vendor.maxGuests}</Text>
                                <Text className='text-center text-xs font-medium' style={{color: Colors.textSecondary}}>Guests</Text>
                            </View>
                        </View>

                        {/* Guest Count Selection */}
                        <View className='mt-5'>
                            <Text className='text-lg font-extrabold mb-3' style={{color: Colors.textPrimary}}>Select Guest Count</Text>
                            <View className='flex-row flex-wrap gap-2'>
                                {[200, 300, 400, 500].map((count) => (
                                    <Pressable
                                        key={count}
                                        className='flex-1 py-3 px-4 rounded-xl min-w-max active:opacity-80'
                                        style={{backgroundColor: selectedGuestCount === count ? categoryColor : Colors.lightGray}}
                                        onPress={() => setSelectedGuestCount(count)}
                                    >
                                        <Text className='text-center font-bold text-sm' style={{color: selectedGuestCount === count ? Colors.white : Colors.textPrimary}}>{count}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Catering Guest Count Selection */}
                {vendor.category === "catering" && (
                    <View className='px-5 mb-5'>
                        <Text className='text-lg font-extrabold mb-3' style={{color: Colors.textPrimary}}>Select Guest Count</Text>
                        <View className='flex-row flex-wrap gap-2'>
                            {[50, 100, 150, 200, 300, 500].map((count) => (
                                <Pressable
                                    key={count}
                                    className='py-3 px-4 rounded-xl min-w-max active:opacity-80'
                                    style={{backgroundColor: selectedGuestCount === count ? categoryColor : Colors.lightGray, flex: 1}}
                                    onPress={() => setSelectedGuestCount(count)}
                                >
                                    <Text className='text-center font-bold text-sm' style={{color: selectedGuestCount === count ? Colors.white : Colors.textPrimary}}>{count}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {/* Packages Section */}
                {vendor.packages && vendor.packages.length > 0 && (selectedGuestCount || vendor.category === "photo" || vendor.category === "parlor") && (
                    <View className='px-5 mb-6'>
                        <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>
                            {vendor.category === "banquet" ? "Banquet Packages" :
                             vendor.category === "catering" ? "Catering Packages" : 
                             vendor.category === "photo" ? "Photography Packages" :
                             "Salon Packages"}
                        </Text>

                        {/* Dishes-based pricing info for catering */}
                        {vendor.category === "catering" && selectedGuestCount && (
                            <View className='rounded-xl p-3 mb-4' style={{backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#93c5fd'}}>
                                <Text className='text-sm font-bold' style={{color: Colors.info}}>For <Text className='font-extrabold'>{selectedGuestCount} guests</Text> - prices are per head</Text>
                            </View>
                        )}

                        {vendor.packages.map((pkg: any) => (
                            <View key={pkg.id} className='py-5 px-4 rounded-2xl mb-4' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.medium]}>
                                {/* Package Header */}
                                <Pressable 
                                    className='flex-row justify-between items-start mb-3'
                                    onPress={() => togglePackage(pkg.id)}
                                >
                                    <View className='flex-row items-start gap-3 flex-1'>
                                        <Circle 
                                            size={20} 
                                            color={expandedPackages[pkg.id] ? categoryColor : Colors.borderDark} 
                                            fill={expandedPackages[pkg.id] ? categoryColor : Colors.lightGray} 
                                        />
                                        <View className='flex-1'>
                                            <Text className='text-lg font-extrabold mb-1' style={{color: Colors.textPrimary}}>{pkg.packageName}</Text>
                                            <View className='flex-row gap-2 mt-1 flex-wrap'>
                                                <Text className='text-base font-bold' style={{color: categoryColor}}>PKR {(pkg.price * (selectedGuestCount || 1)).toLocaleString()}</Text>
                                                {vendor.category === "catering" && selectedGuestCount && (
                                                    <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>(PKR {pkg.price}/per guest)</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>

                                {/* Package Details - Expandable */}
                                {expandedPackages[pkg.id] && (
                                    <View className='mb-4 pt-4' style={{borderTopWidth: 1, borderTopColor: Colors.border}}>
                                        {/* Banquet */}
                                        {vendor.category === "banquet" && pkg.items && (
                                            <View>
                                                {pkg.items.map((item: string, idx: number) => (
                                                    <View key={idx} className='flex-row items-center mb-2'>
                                                        <Dot size={16} color={categoryColor} />
                                                        <Text className='text-sm flex-1' style={{color: Colors.textSecondary}}>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}

                                        {/* Catering - Show courses */}
                                        {vendor.category === "catering" && pkg.mainCourse && (
                                            <View>
                                                <View className='mb-4'>
                                                    <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Main Course</Text>
                                                    {pkg.mainCourse.map((item: string, idx: number) => (
                                                        <View key={idx} className='flex-row items-center mb-1'>
                                                            <Dot size={14} color={categoryColor} />
                                                            <Text className='text-sm flex-1' style={{color: Colors.textSecondary}}>{item}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                                <View className='mb-4'>
                                                    <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Desserts</Text>
                                                    {pkg.desserts.map((item: string, idx: number) => (
                                                        <View key={idx} className='flex-row items-center mb-1'>
                                                            <Dot size={14} color={categoryColor} />
                                                            <Text className='text-sm flex-1' style={{color: Colors.textSecondary}}>{item}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                                <View>
                                                    <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Drinks</Text>
                                                    {pkg.drinks.map((item: string, idx: number) => (
                                                        <View key={idx} className='flex-row items-center mb-1'>
                                                            <Dot size={14} color={categoryColor} />
                                                            <Text className='text-sm flex-1' style={{color: Colors.textSecondary}}>{item}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {/* Photography & Parlor - Show items */}
                                        {(vendor.category === "photo" || vendor.category === "parlor") && pkg.items && (
                                            <View>
                                                {pkg.items.map((item: string, idx: number) => (
                                                    <View key={idx} className='flex-row items-center mb-2'>
                                                        <Dot size={16} color={categoryColor} />
                                                        <Text className='text-sm flex-1' style={{color: Colors.textSecondary}}>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Select Package Button */}
                                <Pressable 
                                    className='rounded-xl py-4 px-4 mt-3 active:opacity-85'
                                    style={{backgroundColor: categoryColor}}
                                    onPress={() => {
                                        const bookingData = {
                                            category: vendor.category,
                                            packageName: pkg.packageName,
                                            price: (vendor.category === 'catering' || vendor.category === 'banquet') 
                                                ? (pkg.price * (selectedGuestCount || 1))
                                                : pkg.price,
                                            guestCount: selectedGuestCount,
                                            vendorName: vendor.name,
                                            vendorLocation: vendor.location
                                        }
                                        router.push({
                                            pathname: "/screens/client/Component/BookingScreen",
                                            params: { bookingData: JSON.stringify(bookingData) }
                                        })
                                    }}
                                >
                                    <Text className='text-center font-extrabold text-base' style={{color: Colors.white}}>Select Package</Text>
                                </Pressable>
                            </View>
                        ))}

                        {/* Custom Package Option for Catering */}
                        {vendor.category === "catering" && selectedGuestCount && (
                            <Pressable 
                                className='rounded-2xl py-5 px-4 mb-4 flex-row items-center justify-center gap-2 active:opacity-80'
                                style={{backgroundColor: '#fff7ed', borderWidth: 2, borderStyle: 'dashed', borderColor: categoryColor}}
                                onPress={() => setShowCustomPackage(true)}
                            >
                                <Plus size={20} color={categoryColor} />
                                <Text className='text-base font-extrabold' style={{color: categoryColor}}>Create Custom Package</Text>
                            </Pressable>
                        )}
                    </View>
                )}

                {/* No Guest Count Selected Message */}
                {vendor.category === "banquet" && !selectedGuestCount && vendor.packages && vendor.packages.length > 0 && (
                    <View className='px-5 mb-5 rounded-xl p-4' style={{backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d'}}>
                        <Text className='text-sm font-bold text-center' style={{color: Colors.warning}}>Please select guest count to view packages</Text>
                    </View>
                )}

                {vendor.category === "catering" && !selectedGuestCount && vendor.packages && vendor.packages.length > 0 && (
                    <View className='px-5 mb-5 rounded-xl p-4' style={{backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d'}}>
                        <Text className='text-sm font-bold text-center' style={{color: Colors.warning}}>Please select guest count to view packages and pricing</Text>
                    </View>
                )}
            </ScrollView>
        </View>

        {/* Custom Package Modal for Catering */}
        <Modal
            visible={showCustomPackage}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowCustomPackage(false)}
        >
            <View className='flex-1 justify-end' style={{backgroundColor: Colors.overlay}}>
                <View className='rounded-t-3xl px-6 py-6' style={{backgroundColor: Colors.white, maxHeight: '80%'}}>
                    <View className='flex-row justify-between items-center mb-6' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.md}}>
                        <Text className='text-2xl font-extrabold' style={{color: Colors.textPrimary}}>Custom Package</Text>
                        <Pressable 
                            className='rounded-full p-2 active:opacity-70'
                            style={{backgroundColor: Colors.lightGray}}
                            onPress={() => {
                                setShowCustomPackage(false)
                                setCustomPackageName('')
                                setCustomPackagePrice('')
                            }}
                        >
                            <X color={categoryColor} size={24} />
                        </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className='gap-4'>
                            <View>
                                <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Package Name</Text>
                                <TextInput
                                    placeholder='e.g., Executive Menu'
                                    value={customPackageName}
                                    onChangeText={setCustomPackageName}
                                    className='rounded-xl px-4 py-4 text-base'
                                    style={{borderWidth: 2, borderColor: Colors.border, color: Colors.textPrimary}}
                                    placeholderTextColor={Colors.textTertiary}
                                />
                            </View>

                            <View>
                                <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Price Per Guest (PKR)</Text>
                                <TextInput
                                    placeholder='e.g., 2500'
                                    value={customPackagePrice}
                                    onChangeText={setCustomPackagePrice}
                                    keyboardType='numeric'
                                    className='rounded-xl px-4 py-4 text-base'
                                    style={{borderWidth: 2, borderColor: Colors.border, color: Colors.textPrimary}}
                                    placeholderTextColor={Colors.textTertiary}
                                />
                            </View>

                            <View className='rounded-xl p-4' style={{backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#93c5fd'}}>
                                <Text className='text-sm font-bold' style={{color: Colors.info}}>
                                    Total for {selectedGuestCount} guests: <Text className='text-base font-extrabold'>
                                        {customPackagePrice && selectedGuestCount ? `PKR ${(parseInt(customPackagePrice) * selectedGuestCount).toLocaleString()}` : 'Enter price'}
                                    </Text>
                                </Text>
                            </View>

                            <View className='rounded-xl p-4 mt-2' style={{backgroundColor: Colors.lightGray}}>
                                <Text className='text-sm leading-relaxed' style={{color: Colors.textSecondary}}>
                                    💡 <Text className='font-bold'>Tip:</Text> Create a package with custom items. You can specify your requirements during the booking process or contact the vendor directly.
                                </Text>
                            </View>

                            <Pressable 
                                className='py-4 rounded-xl mt-6 active:opacity-85'
                                disabled={!customPackageName || !customPackagePrice}
                                style={{backgroundColor: (!customPackageName || !customPackagePrice) ? Colors.borderDark : categoryColor}}
                                onPress={() => {
                                    const customBookingData = {
                                        category: vendor.category,
                                        packageName: customPackageName,
                                        price: parseInt(customPackagePrice) * (selectedGuestCount || 1),
                                        guestCount: selectedGuestCount || 1,
                                        vendorName: vendor.name,
                                        vendorLocation: vendor.location,
                                        isCustomPackage: true
                                    }
                                    setShowCustomPackage(false)
                                    setCustomPackageName('')
                                    setCustomPackagePrice('')
                                    router.push({
                                        pathname: "/screens/client/Component/BookingScreen",
                                        params: {
                                            bookingData: JSON.stringify(customBookingData)
                                        }
                                    })
                                }}
                            >
                                <Text className='text-center font-extrabold text-base' style={{color: Colors.white}}>Proceed with Custom Package</Text>
                            </Pressable>

                            <Pressable 
                                className='py-4 rounded-xl active:opacity-80'
                                style={{borderWidth: 2, borderColor: Colors.border}}
                                onPress={() => {
                                    setShowCustomPackage(false)
                                    setCustomPackageName('')
                                    setCustomPackagePrice('')
                                }}
                            >
                                <Text className='text-center font-bold text-base' style={{color: Colors.textPrimary}}>Cancel</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.background
    },
})