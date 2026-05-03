import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    Alert, 
    Modal, 
    SafeAreaView,
    Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Search, MapPin, Navigation, X, Check, Map as MapIcon } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';

interface LocationPickerProps {
    onLocationSelect: (location: {
        address: string;
        latitude: number;
        longitude: number;
    }) => void;
    initialLocation?: {
        address?: string;
        latitude?: number;
        longitude?: number;
    };
}

const DEFAULT_REGION = {
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

export default function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [address, setAddress] = useState(initialLocation?.address || '');
    const [latitude, setLatitude] = useState(initialLocation?.latitude);
    const [longitude, setLongitude] = useState(initialLocation?.longitude);

    const handleConfirm = (loc: { address: string; latitude: number; longitude: number }) => {
        setAddress(loc.address);
        setLatitude(loc.latitude);
        setLongitude(loc.longitude);
        onLocationSelect(loc);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={[styles.trigger, { borderColor: address ? Colors.primary : '#E5E7EB' }]} 
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <View style={styles.triggerIcon}>
                    <MapPin size={20} color={address ? Colors.primary : '#9CA3AF'} />
                </View>
                <Text 
                    style={[styles.triggerText, { color: address ? '#111827' : '#9CA3AF' }]} 
                    numberOfLines={1}
                >
                    {address || "Tap to select location on map..."}
                </Text>
                <View style={styles.triggerAction}>
                    <Text style={styles.triggerActionText}>{address ? "Change" : "Select"}</Text>
                </View>
            </TouchableOpacity>

            <FullMapModal 
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onConfirm={handleConfirm}
                initialLocation={{ address, latitude, longitude }}
            />
        </View>
    );
}

interface FullMapModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (loc: { address: string; latitude: number; longitude: number }) => void;
    initialLocation: { address: string; latitude?: number; longitude?: number };
}

function FullMapModal({ visible, onClose, onConfirm, initialLocation }: FullMapModalProps) {
    const mapRef = useRef<MapView>(null);
    const [searchQuery, setSearchQuery] = useState(initialLocation.address || '');
    const [markerPosition, setMarkerPosition] = useState<{ latitude: number; longitude: number } | null>(
        initialLocation.latitude && initialLocation.longitude 
        ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude } 
        : null
    );
    const [tempAddress, setTempAddress] = useState(initialLocation.address || '');
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);

    useEffect(() => {
        if (visible && initialLocation.latitude && initialLocation.longitude) {
            setTimeout(() => {
                animateToRegion(initialLocation.latitude!, initialLocation.longitude!);
            }, 500);
        }
    }, [visible]);

    const animateToRegion = (lat: number, lng: number) => {
        mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        }, 1000);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await Location.geocodeAsync(searchQuery);
            if (results.length > 0) {
                const { latitude, longitude } = results[0];
                animateToRegion(latitude, longitude);
                setMarkerPosition({ latitude, longitude });
                
                const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (reverse.length > 0) {
                    const addr = reverse[0];
                    const formatted = [addr.name, addr.street, addr.district, addr.city].filter(Boolean).join(', ');
                    setTempAddress(formatted);
                } else {
                    setTempAddress(searchQuery);
                }
            } else {
                Alert.alert("Not Found", "Try a more specific address or city.");
            }
        } catch (e) {
            Alert.alert("Error", "Search failed. Check your internet.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleMapPress = async (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkerPosition({ latitude, longitude });
        try {
            const results = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (results.length > 0) {
                const addr = results[0];
                const formatted = [addr.name, addr.street, addr.district, addr.city].filter(Boolean).join(', ');
                setTempAddress(formatted);
                setSearchQuery(formatted);
            }
        } catch (e) {}
    };

    const getCurrentLocation = async () => {
        setIsLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return Alert.alert("Permission Denied");
            
            const loc = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = loc.coords;
            animateToRegion(latitude, longitude);
            setMarkerPosition({ latitude, longitude });
            
            const results = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (results.length > 0) {
                const addr = results[0];
                const formatted = [addr.name, addr.street, addr.district, addr.city].filter(Boolean).join(', ');
                setTempAddress(formatted);
                setSearchQuery(formatted);
            }
        } catch (e) {
            Alert.alert("Error", "Could not get current location.");
        } finally {
            setIsLocating(false);
        }
    };

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Select Location</Text>
                    <TouchableOpacity 
                        onPress={() => {
                            if (markerPosition && tempAddress) {
                                onConfirm({ address: tempAddress, ...markerPosition });
                            } else {
                                Alert.alert("Selection Required", "Please pin a location on the map first.");
                            }
                        }}
                        style={[styles.confirmBtn, !markerPosition && { opacity: 0.5 }]}
                        disabled={!markerPosition}
                    >
                        <Text style={styles.confirmBtnText}>Confirm</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.modalSearchContainer}>
                    <View style={styles.searchInner}>
                        <Search size={20} color="#9CA3AF" />
                        <TextInput 
                            style={styles.modalSearchInput}
                            placeholder="Search area, landmark or city..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            placeholderTextColor="#9CA3AF"
                        />
                        {isSearching ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <X size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                </View>

                {/* Map Area */}
                <View style={styles.modalMapWrapper}>
                    {!isMapReady && (
                        <View style={styles.modalLoading}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    )}
                    <MapView
                        ref={mapRef}
                        style={styles.modalMap}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: initialLocation.latitude || DEFAULT_REGION.latitude,
                            longitude: initialLocation.longitude || DEFAULT_REGION.longitude,
                            latitudeDelta: DEFAULT_REGION.latitudeDelta,
                            longitudeDelta: DEFAULT_REGION.longitudeDelta,
                        }}
                        onMapReady={() => setIsMapReady(true)}
                        onPress={handleMapPress}
                        showsUserLocation
                        showsMyLocationButton={false}
                    >
                        {markerPosition && (
                            <Marker coordinate={markerPosition}>
                                <View style={styles.customMarker}>
                                    <View style={styles.markerPin}>
                                        <MapPin size={24} color="#FFF" fill={Colors.error} />
                                    </View>
                                    <View style={styles.markerShadow} />
                                </View>
                            </Marker>
                        )}
                    </MapView>

                    {/* Controls */}
                    <TouchableOpacity 
                        style={styles.modalLocBtn} 
                        onPress={getCurrentLocation}
                        disabled={isLocating}
                    >
                        {isLocating ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <Navigation size={24} color={Colors.primary} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Selected Address Info */}
                {markerPosition && (
                    <View style={styles.addressFooter}>
                        <View style={styles.addressFooterHeader}>
                            <MapIcon size={18} color={Colors.primary} />
                            <Text style={styles.addressFooterTitle}>Selected Address</Text>
                        </View>
                        <Text style={styles.addressFooterText}>{tempAddress}</Text>
                        <Text style={styles.coordsText}>
                            {markerPosition.latitude.toFixed(6)}, {markerPosition.longitude.toFixed(6)}
                        </Text>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 5,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 56,
        borderWidth: 1.5,
    },
    triggerIcon: {
        marginRight: 12,
    },
    triggerText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    triggerAction: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    triggerActionText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    closeButton: {
        padding: 8,
    },
    modalTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#111827',
    },
    confirmBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    confirmBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalSearchContainer: {
        padding: 15,
        backgroundColor: '#FFF',
    },
    searchInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    modalSearchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#111827',
    },
    modalMapWrapper: {
        flex: 1,
        position: 'relative',
    },
    modalMap: {
        flex: 1,
    },
    modalLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    modalLocBtn: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#FFF',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    addressFooter: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
            },
            android: {
                elevation: 10,
            }
        })
    },
    addressFooterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressFooterTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
        marginLeft: 6,
    },
    addressFooterText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        lineHeight: 22,
    },
    coordsText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    customMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerPin: {
        backgroundColor: Colors.error,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    markerShadow: {
        width: 10,
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 5,
        marginTop: 2,
    }
});