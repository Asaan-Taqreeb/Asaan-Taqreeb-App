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
    Platform,
    ViewStyle,
    TextStyle,
    ScrollView
} from 'react-native';
import { Search, MapPin, Navigation, X, Check, Map as MapIcon } from 'lucide-react-native';
import * as Location from 'expo-location';
import GoogleMapView, { GoogleMapMethods } from './GoogleMapView';
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

const KARACHI_FALLBACKS = [
    { keys: ['clifton'], name: 'Clifton, Karachi', latitude: 24.8138, longitude: 67.0336 },
    { keys: ['defence', 'dha'], name: 'DHA, Karachi', latitude: 24.8238, longitude: 67.0681 },
    { keys: ['gulshan', 'iqbal'], name: 'Gulshan-e-Iqbal, Karachi', latitude: 24.9180, longitude: 67.0971 },
    { keys: ['north nazimabad'], name: 'North Nazimabad, Karachi', latitude: 24.9372, longitude: 67.0416 },
    { keys: ['saddar', 'tariq', 'pechs'], name: 'Saddar, Karachi', latitude: 24.8615, longitude: 67.0423 },
    { keys: ['fb area', 'federal b'], name: 'Federal B Area, Karachi', latitude: 24.9312, longitude: 67.0794 },
    { keys: ['bahria'], name: 'Bahria Town, Karachi', latitude: 25.0252, longitude: 67.3294 },
    { keys: ['malir'], name: 'Malir, Karachi', latitude: 24.8986, longitude: 67.1908 },
    { keys: ['korangi'], name: 'Korangi, Karachi', latitude: 24.8322, longitude: 67.1265 },
    { keys: ['nazimabad'], name: 'Nazimabad, Karachi', latitude: 24.9122, longitude: 67.0265 },
    { keys: ['johar', 'gulistan-e-johar'], name: 'Gulistan-e-Johar, Karachi', latitude: 24.9114, longitude: 67.1353 },
];

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
        <View style={styles.container as ViewStyle}>
            <TouchableOpacity 
                style={StyleSheet.flatten([styles.trigger, { borderColor: address ? Colors.primary : '#E5E7EB' }]) as ViewStyle} 
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <View style={styles.triggerIcon as ViewStyle}>
                    <MapPin size={20} color={address ? Colors.primary : '#9CA3AF'} />
                </View>
                <Text 
                    style={StyleSheet.flatten([styles.triggerText, { color: address ? '#111827' : '#9CA3AF' }]) as TextStyle} 
                    numberOfLines={1}
                >
                    {address || "Tap to select location on map..."}
                </Text>
                <View style={styles.triggerAction as ViewStyle}>
                    <Text style={styles.triggerActionText as TextStyle}>{address ? "Change" : "Select"}</Text>
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
    const mapRef = useRef<GoogleMapMethods>(null);
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
    const [suggestions, setSuggestions] = useState<{label: string, lat: number, lon: number}[]>([]);
    const shouldFetchSuggestions = useRef(false);

    useEffect(() => {
        if (!shouldFetchSuggestions.current || searchQuery.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            const fetchSuggestions = async () => {
                try {
                    let query = searchQuery.trim();
                    if (!query.toLowerCase().includes('karachi')) {
                        query += ', Karachi, Pakistan';
                    }
                    
                    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
                    const response = await fetch(url, {
                        headers: { 'User-Agent': 'AsaanTaqreebApp/1.0' }
                    });
                    
                    if (!response.ok) return;
                    const data = await response.json();
                    
                    if (Array.isArray(data)) {
                        const mapped = data.map((item: any) => ({
                            label: item.display_name,
                            lat: parseFloat(item.lat),
                            lon: parseFloat(item.lon)
                        }));
                        setSuggestions(mapped);
                    }
                } catch (error) {
                    console.log("Suggestions fetch failed:", error);
                }
            };
            fetchSuggestions();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    useEffect(() => {
        if (visible && initialLocation.latitude && initialLocation.longitude) {
            setTimeout(() => {
                animateToRegion(initialLocation.latitude!, initialLocation.longitude!);
            }, 500);
        }
    }, [visible]);

    const animateToRegion = (lat: number, lng: number) => {
        // Updated to match GoogleMapView's (lat, lng, zoom) interface
        mapRef.current?.animateToRegion(lat, lng, 15);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSuggestions([]);
        shouldFetchSuggestions.current = false;
        
        let geocodeQuery = searchQuery.trim();
        if (!geocodeQuery.toLowerCase().includes('karachi')) {
            geocodeQuery += ', Karachi, Pakistan';
        }

        try {
            const results = await Location.geocodeAsync(geocodeQuery);
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
                throw new Error("No results");
            }
        } catch (error) {
            // Try Nominatim search fallback if native geocoding fails
            try {
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geocodeQuery)}&format=json&limit=1`;
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'AsaanTaqreebApp/1.0' }
                });
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    animateToRegion(lat, lon);
                    setMarkerPosition({ latitude: lat, longitude: lon });
                    setTempAddress(data[0].display_name || searchQuery);
                } else {
                    throw new Error("Nominatim fallback failed");
                }
            } catch (fallbackErr) {
                // Local fallback match to resolve "no internet / Google Services" issues in Karachi
                const lower = searchQuery.toLowerCase();
                const matched = KARACHI_FALLBACKS.find(item => 
                    item.keys.some(k => lower.includes(k))
                );
                
                if (matched) {
                    // Move map to the matched area, but KEEP their custom typed search query as the address!
                    animateToRegion(matched.latitude, matched.longitude);
                    setMarkerPosition({ latitude: matched.latitude, longitude: matched.longitude });
                    setTempAddress(searchQuery);
                } else {
                    // Fallback to Karachi center, but KEEP their custom typed search query as the address!
                    animateToRegion(24.8607, 67.0011);
                    setMarkerPosition({ latitude: 24.8607, longitude: 67.0011 });
                    setTempAddress(searchQuery);
                }
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleMapPress = async (e: any) => {
        const latitude = e?.nativeEvent?.coordinate?.latitude;
        const longitude = e?.nativeEvent?.coordinate?.longitude;
        
        if (latitude === undefined || longitude === undefined) return;

        shouldFetchSuggestions.current = false;
        setMarkerPosition({ latitude, longitude });
        setSearchQuery("Loading address...");
        try {
            const results = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (results.length > 0) {
                const addr = results[0];
                const formatted = [addr.name, addr.street, addr.district, addr.city].filter(Boolean).join(', ');
                setTempAddress(formatted);
                setSearchQuery(formatted);
            } else {
                throw new Error("No native reverse geocode result");
            }
        } catch (error) {
            // Try Nominatim fallback
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'AsaanTaqreebApp/1.0' }
                });
                const data = await res.json();
                if (data && data.display_name) {
                    setTempAddress(data.display_name);
                    setSearchQuery(data.display_name);
                } else {
                    throw new Error("Nominatim failed");
                }
            } catch (err) {
                setTempAddress(`Pinned Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}), Karachi`);
                setSearchQuery(`Pinned Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}), Karachi`);
            }
        }
    };

    const getCurrentLocation = async () => {
        setIsLocating(true);
        shouldFetchSuggestions.current = false;

        if (Platform.OS === 'web') {
            const fetchIpLocation = async () => {
                const apis = [
                    {
                        url: 'https://freeipapi.com/api/json',
                        parse: (data: any) => ({
                            latitude: Number(data.latitude),
                            longitude: Number(data.longitude),
                            city: data.cityName || "",
                            region: data.regionName || "",
                            country: data.countryName || ""
                        })
                    },
                    {
                        url: 'https://ipapi.co/json/',
                        parse: (data: any) => ({
                            latitude: Number(data.latitude),
                            longitude: Number(data.longitude),
                            city: data.city || "",
                            region: data.region || "",
                            country: data.country_name || ""
                        })
                    },
                    {
                        url: 'https://ipinfo.io/json',
                        parse: (data: any) => {
                            const [lat, lon] = String(data.loc || '').split(',');
                            return {
                                latitude: Number(lat),
                                longitude: Number(lon),
                                city: data.city || "",
                                region: data.region || "",
                                country: data.country || ""
                            };
                        }
                    }
                ];

                for (const api of apis) {
                    try {
                        const res = await fetch(api.url);
                        if (!res.ok) continue;
                        const data = await res.json();
                        const parsed = api.parse(data);
                        if (parsed.latitude && parsed.longitude) {
                            setMarkerPosition({ latitude: parsed.latitude, longitude: parsed.longitude });
                            if (isMapReady) {
                                animateToRegion(parsed.latitude, parsed.longitude);
                            }
                            const formatted = [parsed.city, parsed.region, parsed.country].filter(Boolean).join(', ');
                            setTempAddress(formatted);
                            setSearchQuery(formatted);
                            setIsLocating(false);
                            return;
                        }
                    } catch (err) {
                        console.log(`Failed to fetch IP location in picker from ${api.url}:`, err);
                    }
                }

                Alert.alert("Location Error", "Could not retrieve your location.");
                setIsLocating(false);
            };

            if (typeof window !== 'undefined' && window.navigator && window.navigator.geolocation) {
                window.navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        setMarkerPosition({ latitude, longitude });
                        if (isMapReady) {
                            animateToRegion(latitude, longitude);
                        }
                        setSearchQuery("Loading address...");
                        try {
                            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
                            const res = await fetch(url, {
                                headers: { 'User-Agent': 'AsaanTaqreebApp/1.0' }
                            });
                            const data = await res.json();
                            if (data && data.display_name) {
                                setTempAddress(data.display_name);
                                setSearchQuery(data.display_name);
                            } else {
                                throw new Error("reverse geocode empty");
                            }
                        } catch (err) {
                            setTempAddress(`Pinned Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
                            setSearchQuery(`Pinned Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
                        } finally {
                            setIsLocating(false);
                        }
                    },
                    (geoError) => {
                        console.log("Web geolocation failed in LocationPicker, trying IP fallback...", geoError);
                        fetchIpLocation();
                    },
                    { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
                );
            } else {
                fetchIpLocation();
            }
            return;
        }

        try {
            const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Location.requestForegroundPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                return Alert.alert("Permission Denied", "Please enable location services in your device settings.");
            }
            
            // Get current location with high accuracy, falling back to last known position on timeout/error
            let coords = null;
            try {
                const positionPromise = Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                const timeoutPromise = new Promise<null>((resolve) => 
                    setTimeout(() => resolve(null), 6000)
                );

                const locationObj = await Promise.race([positionPromise, timeoutPromise]);
                if (locationObj) {
                    coords = locationObj.coords;
                } else {
                    console.log("getCurrentPositionAsync timed out in LocationPicker, trying getLastKnownPositionAsync...");
                }
            } catch (posError) {
                console.log("getCurrentPositionAsync failed in LocationPicker, trying getLastKnownPositionAsync...", posError);
            }

            if (!coords) {
                try {
                    const lastKnown = await Location.getLastKnownPositionAsync();
                    if (lastKnown) {
                        coords = lastKnown.coords;
                    }
                } catch (lastKnownError) {
                    console.log("getLastKnownPositionAsync failed in LocationPicker:", lastKnownError);
                }
            }

            if (!coords) {
                throw new Error("Could not retrieve coordinates from GPS");
            }

            const { latitude, longitude } = coords;
            
            // Update map and marker
            if (isMapReady) {
                animateToRegion(latitude, longitude);
            }
            setMarkerPosition({ latitude, longitude });
            
            // Get address
            setSearchQuery("Loading address...");
            try {
                const results = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (results.length > 0) {
                    const addr = results[0];
                    const formatted = [addr.name, addr.street, addr.district, addr.city].filter(Boolean).join(', ');
                    setTempAddress(formatted);
                    setSearchQuery(formatted);
                } else {
                    throw new Error("No native reverse geocode result");
                }
            } catch (geocodeError) {
                console.log("Native reverse geocoding failed in getCurrentLocation, trying Nominatim fallback:", geocodeError);
                try {
                    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'AsaanTaqreebApp/1.0' }
                    });
                    const data = await res.json();
                    if (data && data.display_name) {
                        setTempAddress(data.display_name);
                        setSearchQuery(data.display_name);
                    } else {
                        throw new Error("Nominatim failed");
                    }
                } catch (err) {
                    setTempAddress(`Pinned Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}), Karachi`);
                    setSearchQuery(`Pinned Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}), Karachi`);
                }
            }
        } catch (error) {
            console.error("Location error:", error);
            Alert.alert(
                "Location Error", 
                "Could not determine your location. Placed marker at Karachi center.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            animateToRegion(24.8607, 67.0011);
                            setMarkerPosition({ latitude: 24.8607, longitude: 67.0011 });
                            setTempAddress("Karachi Center, Karachi");
                            setSearchQuery("Karachi Center, Karachi");
                        }
                    }
                ]
            );
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
            <SafeAreaView style={styles.modalContainer as ViewStyle}>
                {/* Header */}
                <View style={styles.modalHeader as ViewStyle}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton as ViewStyle}>
                        <X size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle as TextStyle}>Select Location</Text>
                    <TouchableOpacity 
                        onPress={() => {
                            if (markerPosition && tempAddress) {
                                onConfirm({ address: tempAddress, ...markerPosition });
                            } else {
                                Alert.alert("Selection Required", "Please pin a location on the map first.");
                            }
                        }}
                        style={StyleSheet.flatten([styles.confirmBtn, !markerPosition && { opacity: 0.5 }]) as ViewStyle}
                        disabled={!markerPosition}
                    >
                        <Text style={styles.confirmBtnText as TextStyle}>Confirm</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.modalSearchContainer as ViewStyle}>
                    <View style={styles.searchInner as ViewStyle}>
                        <Search size={20} color="#9CA3AF" />
                        <TextInput 
                            style={styles.modalSearchInput as TextStyle}
                            placeholder="Search area, landmark or city..."
                            value={searchQuery}
                            onChangeText={(text) => {
                                shouldFetchSuggestions.current = true;
                                setSearchQuery(text);
                            }}
                            onSubmitEditing={handleSearch}
                            placeholderTextColor="#9CA3AF"
                        />
                        {isSearching ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => { 
                                    shouldFetchSuggestions.current = false;
                                    setSearchQuery(''); 
                                    setSuggestions([]); 
                                }}>
                                    <X size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                </View>

                {/* Suggestions List Overlay */}
                {suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer as ViewStyle}>
                        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
                            {suggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem as ViewStyle}
                                    onPress={() => {
                                        shouldFetchSuggestions.current = false;
                                        setMarkerPosition({ latitude: item.lat, longitude: item.lon });
                                        setTempAddress(item.label);
                                        setSearchQuery(item.label);
                                        animateToRegion(item.lat, item.lon);
                                        setSuggestions([]);
                                    }}
                                >
                                    <MapPin size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={styles.suggestionText as TextStyle} numberOfLines={2}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Map Area */}
                <View style={styles.modalMapWrapper as ViewStyle}>
                    {!isMapReady && (
                        <View style={styles.modalLoading as ViewStyle}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    )}
                    <GoogleMapView
                        ref={mapRef}
                        style={styles.modalMap}
                        latitude={initialLocation.latitude || DEFAULT_REGION.latitude}
                        longitude={initialLocation.longitude || DEFAULT_REGION.longitude}
                        markerPosition={markerPosition}
                        onMapReady={() => setIsMapReady(true)}
                        onMapPress={(lat, lng) => handleMapPress({ nativeEvent: { coordinate: { latitude: lat, longitude: lng } } })}
                    />

                    {/* Controls */}
                    <TouchableOpacity 
                        style={styles.modalLocBtn as ViewStyle} 
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
                    <View style={styles.addressFooter as ViewStyle}>
                        <View style={styles.addressFooterHeader as ViewStyle}>
                            <MapIcon size={18} color={Colors.primary} />
                            <Text style={styles.addressFooterTitle as TextStyle}>Selected Address</Text>
                        </View>
                        <Text style={styles.addressFooterText as TextStyle}>{tempAddress}</Text>
                        <Text style={styles.coordsText as TextStyle}>
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
        justifyContent: 'space-between',
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
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 130,
        left: 15,
        right: 15,
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        maxHeight: 250,
        zIndex: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 10,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
});