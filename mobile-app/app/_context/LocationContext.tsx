import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as Location from "expo-location"
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const LOCATION_CACHE_KEY = '@user_location_cache_v3'
const WEB_GEOLOCATION_SOURCE = 'browser-geolocation'
const CACHE_MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const parseNominatimAddress = (addr: any) => {
    const road = addr.road || addr.pedestrian || addr.footway || addr.path || ""
    const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential || addr.city_district || ""
    const district = addr.county || addr.district || addr.state_district || neighbourhood || ""
    const city = addr.city || addr.town || addr.village || addr.municipality || "Karachi"
    const name = addr.building || addr.amenity || addr.residential || addr.neighbourhood || road || ""

    return {
        city,
        district,
        country: addr.country || "Pakistan",
        name: name || road || neighbourhood || city,
        street: road,
        subregion: neighbourhood,
    }
}

export interface LocationContextType {
    result: any
    error: string
    latitude: number | undefined
    longitude: number | undefined
    loading: boolean
    refreshLocation: (forceRequestPermission?: boolean) => Promise<void>
    setManualLocation: (location: { address: string; latitude: number; longitude: number }) => Promise<void>
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined)

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [error, setError] = useState("")
    const [latitude, setLatitude] = useState<number | undefined>(undefined)
    const [longitude, setLongitude] = useState<number | undefined>(undefined)
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const getCachedLocation = useCallback(async () => {
        try {
            const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY)
            if (cached) {
                const cachedData = JSON.parse(cached)

                // Reject expired cache
                if (cachedData.timestamp && (Date.now() - cachedData.timestamp > CACHE_MAX_AGE_MS)) {
                    console.log("Location cache expired, fetching fresh location")
                    await AsyncStorage.removeItem(LOCATION_CACHE_KEY)
                    return null
                }

                // Invalidate cache if coordinates are missing or invalid
                if (!cachedData.latitude || !cachedData.longitude) {
                    console.log("Location cache is missing coordinates, clearing cache...")
                    await AsyncStorage.removeItem(LOCATION_CACHE_KEY)
                    return null
                }

                setLatitude(cachedData.latitude)
                setLongitude(cachedData.longitude)
                setResult(cachedData.result)
                console.log("Using cached location from context:", cachedData.result)
                return cachedData
            }
        } catch (error) {
            console.log("Error reading cached location:", error)
        }
        return null
    }, [])

    const cacheLocation = useCallback(async (lat: number, lon: number, locationResult: any, source?: string) => {
        try {
            const cacheData = {
                latitude: lat,
                longitude: lon,
                result: locationResult,
                timestamp: Date.now(),
                source: source || 'unknown',
            }
            await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData))
            console.log("Location cached successfully")
        } catch (error) {
            console.log("Error caching location:", error)
        }
    }, [])

    const applyKarachiFallback = useCallback(async () => {
        const fallbackResponse = [{
            city: "Karachi",
            district: "Karachi",
            country: "Pakistan",
            name: "Karachi, Pakistan (Default)"
        }]
        setLatitude(24.8607)
        setLongitude(67.0011)
        setResult(fallbackResponse)
        setError("")
        await cacheLocation(24.8607, 67.0011, fallbackResponse, 'karachi-fallback')
        console.log("Applied default Karachi location fallback and cached it")
    }, [cacheLocation])

    const setManualLocation = useCallback(async (loc: { address: string; latitude: number; longitude: number }) => {
        const parts = loc.address.split(',').map(s => s.trim()).filter(Boolean);
        const mainArea = parts[0] || "Custom Location";
        const cityPart = parts.find(p => p.toLowerCase().includes('karachi')) || parts[parts.length - 1] || "Karachi";

        const response = [{
            city: cityPart,
            district: mainArea,
            name: loc.address,
            street: mainArea,
            subregion: mainArea,
            country: "Pakistan"
        }];

        setLatitude(loc.latitude);
        setLongitude(loc.longitude);
        setResult(response);
        setError("");
        await cacheLocation(loc.latitude, loc.longitude, response, 'manual-picker');
    }, [cacheLocation]);

    const fetchIpLocationFallback = useCallback(async () => {
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
                console.log(`Trying IP location fallback from: ${api.url}`)
                const res = await fetch(api.url)
                if (!res.ok) continue
                const data = await res.json()
                const parsed = api.parse(data)
                if (parsed.latitude && parsed.longitude) {
                    const response = [{
                        city: parsed.city || "Karachi",
                        district: parsed.region || "Karachi",
                        country: parsed.country || "Pakistan",
                        name: [parsed.city, parsed.region].filter(Boolean).join(', ') || "IP Location"
                    }]
                    setLatitude(parsed.latitude)
                    setLongitude(parsed.longitude)
                    setResult(response)
                    setError("")
                    await cacheLocation(parsed.latitude, parsed.longitude, response, 'ip-geolocation')
                    console.log("IP Geolocation fallback successful:", response)
                    return true
                }
            } catch (err) {
                console.log(`Failed to fetch IP location from ${api.url}:`, err)
            }
        }
        return false
    }, [cacheLocation])

    const getUserLocation = useCallback(async (forceRequestPermission = false) => {
        try {
            setLoading(true)
            
            // Try to load cached location first (returns null if expired/invalid)
            const cachedData = await getCachedLocation()
            const hasCached = cachedData !== null
            
            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined' && window.navigator && window.navigator.geolocation) {
                    const getPosition = (highAccuracy: boolean): Promise<GeolocationPosition> => {
                        return new Promise((resolve, reject) => {
                            window.navigator.geolocation.getCurrentPosition(resolve, reject, {
                                enableHighAccuracy: highAccuracy,
                                timeout: highAccuracy ? 8000 : 15000,
                                maximumAge: 60000 // Allow cached position up to 1 min
                            });
                        });
                    };

                    (async () => {
                        let position: GeolocationPosition | null = null;
                        try {
                            console.log('[LocationContext] Trying high accuracy browser geolocation...');
                            position = await getPosition(true);
                        } catch (err: any) {
                            console.warn('[LocationContext] High accuracy browser geolocation failed:', err);
                            try {
                                console.log('[LocationContext] Retrying with low accuracy browser geolocation...');
                                position = await getPosition(false);
                            } catch (lowAccErr) {
                                console.error('[LocationContext] Low accuracy browser geolocation failed:', lowAccErr);
                            }
                        }

                        if (position) {
                            const { latitude, longitude } = position.coords;
                            console.log(`[LocationContext] Browser geolocation succeeded: ${latitude}, ${longitude}`);

                            if (cachedData && haversineDistance(
                                cachedData.latitude, cachedData.longitude,
                                latitude, longitude
                            ) > 2) {
                                console.log("Location shifted significantly from cache, updating...")
                            }

                            setLatitude(latitude);
                            setLongitude(longitude);
                            try {
                                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
                                // Omit User-Agent header on web to avoid browser security block/error
                                const res = await fetch(url);
                                const data = await res.json();
                                if (data && data.address) {
                                    const parsed = parseNominatimAddress(data.address);
                                    const response = [parsed];
                                    setResult(response);
                                    await cacheLocation(latitude, longitude, response, WEB_GEOLOCATION_SOURCE);
                                    setError("");
                                } else {
                                    throw new Error("No reverse geocoding results found");
                                }
                            } catch (err: any) {
                                console.log("Web geocoding failed, using fallback:", err);
                                if (!hasCached) {
                                    const fallbackResponse = [{
                                        city: "Karachi",
                                        district: "Karachi",
                                        country: "Pakistan",
                                        name: `Pinned Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                                    }];
                                    setResult(fallbackResponse);
                                    setError("");
                                    await cacheLocation(latitude, longitude, fallbackResponse, 'browser-geolocation-fallback');
                                }
                            } finally {
                                setLoading(false);
                            }
                        } else {
                            console.log("Web Geolocation failed completely, trying IP fallback...");
                            if (!hasCached) {
                                const success = await fetchIpLocationFallback()
                                if (!success) {
                                    await applyKarachiFallback()
                                }
                            }
                            setLoading(false);
                        }
                    })();
                } else {
                    console.log("Geolocation API not available, trying IP fallback...");
                    if (!hasCached) {
                        const success = await fetchIpLocationFallback()
                        if (!success) {
                            await applyKarachiFallback()
                        }
                    }
                    setLoading(false);
                }
                return;
            }

            // Native iOS/Android implementation
            console.log('[LocationContext] Checking existing foreground permissions...');
            let { status } = await Location.getForegroundPermissionsAsync()
            console.log('[LocationContext] Existing permission status:', status);

            // Only request permission if explicitly asked (e.g. from LocationPermissionScreen)
            if (status !== 'granted' && forceRequestPermission) {
                console.log('[LocationContext] Requesting foreground permissions...');
                const requested = await Location.requestForegroundPermissionsAsync()
                console.log('[LocationContext] Request permission response:', JSON.stringify(requested, null, 2));
                status = requested.status
            }

            if (status !== 'granted') {
                console.warn('[LocationContext] Location permission not granted. Current status:', status);
                setError("Permission denied - using cached location if available")
                if (!hasCached) {
                    await applyKarachiFallback()
                }
                setLoading(false)
                return
            }

            let coords: Location.LocationObjectCoords | null = null;

            // Attempt to get last known position first for quick availability
            try {
                const lastKnown = await Location.getLastKnownPositionAsync();
                if (lastKnown && lastKnown.coords) {
                    coords = lastKnown.coords;
                    console.log('[LocationContext] Fast lastKnown position acquired:', coords);
                }
            } catch (lastKnownError) {
                console.log('[LocationContext] getLastKnownPositionAsync failed:', lastKnownError);
            }

            // Fetch fresh GPS position
            try {
                const positionPromise = Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                const timeoutPromise = new Promise<null>((resolve) => 
                    setTimeout(() => resolve(null), 8000)
                );

                const locationObj = await Promise.race([positionPromise, timeoutPromise]);
                if (locationObj && locationObj.coords) {
                    coords = locationObj.coords;
                    console.log('[LocationContext] Fresh GPS position acquired:', coords);
                } else if (!coords) {
                    console.log("[LocationContext] getCurrentPositionAsync timed out and no lastKnown coords available.");
                }
            } catch (posError) {
                console.log("[LocationContext] getCurrentPositionAsync failed:", posError);
            }

            if (coords) {
                const {latitude, longitude} = coords;
                setLatitude(latitude)
                setLongitude(longitude)
                
                try {
                    let response: any[] = []
                    try {
                        response = await Location.reverseGeocodeAsync({
                            latitude,
                            longitude
                        })
                    } catch (nativeGeocodeErr) {
                        console.log("Native reverse geocoding failed, trying Nominatim fallback:", nativeGeocodeErr);
                        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                        const res = await fetch(url, {
                            headers: {
                                'User-Agent': 'Asaan-Taqreeb-App/1.0'
                            }
                        })
                        const data = await res.json()
                        if (data && data.address) {
                            response = [parseNominatimAddress(data.address)]
                        }
                    }
                    
                    if (response && response.length > 0) {
                        setResult(response)
                        await cacheLocation(latitude, longitude, response, 'native-gps')
                        console.log("Fresh location fetched in context: ", response)
                        setError("")
                    } else {
                        throw new Error("No reverse geocoding results found");
                    }
                } catch (geocodeError) {
                    console.log("Geocoding service unavailable:", geocodeError)
                    if (!hasCached) {
                        const fallbackResponse = [{
                            city: "Karachi",
                            district: "Karachi",
                            country: "Pakistan",
                            name: `Pinned Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                        }];
                        setResult(fallbackResponse);
                        setError("");
                        await cacheLocation(latitude, longitude, fallbackResponse, 'native-gps-fallback');
                    }
                }
            } else {
                console.log("Failed to retrieve coordinates from GPS, attempting IP location fallback...");
                const ipSuccess = await fetchIpLocationFallback();
                if (!ipSuccess && !hasCached) {
                    await applyKarachiFallback();
                }
            }
        } catch (error) {
            console.log("Error getting location:", error)
            setError("Error fetching location - using cached if available")
        } finally {
            if (Platform.OS !== 'web') {
                setLoading(false)
            }
        }
    }, [cacheLocation, getCachedLocation, fetchIpLocationFallback, applyKarachiFallback])

    const refreshLocation = useCallback(async (forceRequestPermission = false) => {
        await getUserLocation(forceRequestPermission)
    }, [getUserLocation])

    useEffect(() => {
        getUserLocation(false)
    }, [getUserLocation])

    return (
        <LocationContext.Provider value={{ result, error, latitude, longitude, loading, refreshLocation, setManualLocation }}>
            {children}
        </LocationContext.Provider>
    )
}

export const useLocationContext = () => {
    const context = useContext(LocationContext)
    if (!context) {
        throw new Error('useLocationContext must be used within LocationProvider')
    }
    return context
}
