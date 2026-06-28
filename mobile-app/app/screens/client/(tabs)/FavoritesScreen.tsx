import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MapPin, Star, Users, Heart, ArrowLeft } from 'lucide-react-native'
import { router } from 'expo-router'
import { Colors, Shadows, Spacing, getCategoryColor } from '@/app/_constants/theme'
import { ServiceListItem, getConciseAddress } from '@/app/_utils/servicesApi'
import { getMyFavorites, toggleFavorite } from '@/app/_utils/favoritesApi'
import { useUser } from '@/app/_context/UserContext'

export default function FavoritesScreen() {
    const insets = useSafeAreaInsets()
    const { user } = useUser()
    const [favorites, setFavorites] = useState<ServiceListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadFavorites = useCallback(async () => {
        if (user?.isGuest) {
            setFavorites([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)
            const favs = await getMyFavorites()
            setFavorites(favs)
        } catch (apiError: any) {
            setError(apiError?.message || 'Failed to load favorites')
        } finally {
            setLoading(false)
        }
    }, [user?.isGuest])

    useFocusEffect(
        useCallback(() => {
            loadFavorites()
        }, [loadFavorites])
    )

    const handleRemoveFavorite = async (serviceId: string) => {
        try {
            // Optimistically update UI
            setFavorites(prev => prev.filter(f => f.id !== serviceId && f.serviceId !== serviceId))
            await toggleFavorite(serviceId)
        } catch (error) {
            console.error('Failed to remove favorite', error)
            // Revert on failure by reloading
            loadFavorites()
        }
    }

    return (
        <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
            <View className='px-5 py-4 flex-row items-center gap-3' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}>
                <Pressable onPress={() => router.back()} className="p-1.5 rounded-full active:bg-gray-100">
                    <ArrowLeft size={20} color={Colors.textPrimary} />
                </Pressable>
                <View>
                    <Text className='text-xl font-bold' style={{color: Colors.textPrimary}}>My Favorites</Text>
                    <Text className='text-xs font-medium mt-0.5' style={{color: Colors.textSecondary}}>Saved vendors and services</Text>
                </View>
            </View>

            <View className='flex-1'>
                {user?.isGuest && (
                    <View className='px-5 mt-4'>
                        <View className='rounded-2xl p-5' style={{backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, ...Shadows.small}}>
                            <Text className='text-lg font-bold text-center' style={{color: Colors.textPrimary}}>Sign In Required</Text>
                            <Text className='text-sm font-medium text-center mt-2' style={{color: Colors.textSecondary}}>
                                Sign in to save and view your favorite vendors.
                            </Text>
                            <Pressable
                                className='mt-4 py-3 rounded-xl active:opacity-85'
                                style={{backgroundColor: Colors.primary}}
                                onPress={() => router.push('/screens/client/Component/LoginScreen')}
                            >
                                <Text className='text-center font-bold text-sm' style={{color: Colors.white}}>Sign In</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {!user?.isGuest && loading && (
                    <View className='px-5 py-4'>
                        <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>Loading favorites...</Text>
                    </View>
                )}
                {!user?.isGuest && error && !loading && (
                    <View className='px-5 py-4'>
                        <Text className='text-sm font-medium' style={{color: Colors.error}}>{error}</Text>
                    </View>
                )}
                
                {!user?.isGuest && !loading && favorites.length === 0 ? (
                    <View className='flex-1 items-center justify-center py-20'>
                        <View className='w-20 h-20 rounded-full items-center justify-center mb-4' style={{backgroundColor: Colors.lightGray}}>
                            <Heart size={32} color={Colors.textTertiary} />
                        </View>
                        <Text className='text-lg font-bold mb-2' style={{color: Colors.textSecondary}}>No favorites yet</Text>
                        <Text className='text-sm text-center px-8' style={{color: Colors.textTertiary}}>Browse vendors and tap the heart icon to save them here.</Text>
                        <Pressable 
                            className='mt-6 py-3 px-6 rounded-xl active:opacity-80'
                            style={{backgroundColor: Colors.primary}}
                            onPress={() => router.push('/screens/client/Component/VendorListView')}
                        >
                            <Text className='font-bold text-white'>Browse Vendors</Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        data={favorites}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}
                        renderItem={({item}) => {
                            const catColor = getCategoryColor(item.key)
                            return (
                            <Pressable className="mb-4 active:opacity-90" onPress={() => router.push({
                                pathname: "/screens/client/Component/DetailScreenPage",
                                params: { vendor: encodeURIComponent(JSON.stringify(item)), category: item.key }
                            })}>
                                <View 
                                    className="rounded-3xl p-4 flex-row items-center gap-4 relative" 
                                    style={[
                                        {backgroundColor: Colors.white, borderLeftWidth: 6, borderLeftColor: catColor}, 
                                        Shadows.medium
                                    ]}
                                > 
                                    <Image 
                                        className="rounded-2xl" 
                                        source={{ uri: item.images[0] }}
                                        accessibilityLabel={item.name} 
                                        style={{ width: 100, height: 110 }} 
                                        resizeMode="cover" 
                                    />
                                    <View className="flex-col flex-1 justify-between py-1">
                                        <View>
                                            <View className="flex-row justify-between items-start mb-1 pr-6">
                                                <Text className="text-base font-black flex-1 mr-2" style={{color: Colors.textPrimary}} numberOfLines={1}>{item.name}</Text>
                                            </View>
                                            <View className="flex-row items-center gap-1 mb-2 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 self-start">
                                                <Star size={10} fill={Colors.rating} color={Colors.rating} />
                                                <Text className="text-[10px] font-black" style={{color: Colors.rating}}>{item.rating}</Text>
                                            </View>
                                            
                                            <View className="flex-row items-center mb-1.5">
                                                <MapPin size={12} color={Colors.textTertiary} />
                                                <Text className="text-xs font-bold ml-1 flex-1" style={{color: Colors.textSecondary}} numberOfLines={1}>{getConciseAddress(item.location)}</Text>
                                            </View>

                                            {item.category === "banquet" && (
                                                <View className="flex-row items-center mb-1.5">
                                                    <Users size={12} color={Colors.textTertiary} />
                                                    <Text className="text-xs font-bold ml-1" style={{color: Colors.textSecondary}}>{item.minGuests}-{item.maxGuests} Guests</Text>
                                                </View>
                                            )}
                                        </View>

                                        <View className="flex-row justify-between items-center mt-auto">
                                            <View className="bg-gray-50 px-2 py-1 rounded-lg">
                                                <Text className="text-[10px] font-black uppercase tracking-widest" style={{color: Colors.textTertiary}}>Starting From</Text>
                                            </View>
                                            <Text className="text-base font-black" style={{color: Colors.primary}}>
                                                PKR {item.category === "banquet" ? (item.price ?? 0).toLocaleString() : (item.packages?.[0]?.price ?? 0).toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>

                                    <Pressable 
                                        className='absolute top-2 right-2 p-2 active:opacity-60'
                                        onPress={() => handleRemoveFavorite(item.id as string)}
                                    >
                                        <Heart size={20} color={Colors.error} fill={Colors.error} />
                                    </Pressable>
                                </View>
                            </Pressable>
                        )}}
                    />
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
})
