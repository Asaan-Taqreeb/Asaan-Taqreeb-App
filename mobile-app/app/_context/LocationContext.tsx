import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as Location from "expo-location"
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const LOCATION_CACHE_KEY = '@user_location_cache_v2'
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
    const district = addr.suburb || addr.neighbourhood || addr.city_district || addr.county || addr.district || addr.state || ""
    const city = addr.city || addr.town || addr.village || addr.municipality || ""
    const name = addr.road || addr.neighbourhood || addr.suburb || ""

    return {
        city,
        district,
        country: addr.country || "",
        name,
    }
}

export interface LocationContextType {
    result: any
    error: string
    latitude: number | undefined
    longitude: number | undefined
    loading: boolean
    refreshLocation: (forceRequestPermission?: boolean) => Promise<void>
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
                    window.navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;

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
                                const res = await fetch(url, {
                                    headers: {
                                        'User-Agent': 'Asaan-Taqreeb-App/1.0'
                                    }
                                });
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
                        },
                        async (geoError) => {
                            console.log("Web Geolocation failed, trying IP fallback...", geoError);
                            if (!hasCached) {
                                const success = await fetchIpLocationFallback()
                                if (!success) {
                                    await applyKarachiFallback()
                                }
                            }
                            setLoading(false);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        }
                    );
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
            let { status } = await Location.getForegroundPermissionsAsync()

            // If not granted and we want to force permission prompt (e.g. from user action)
            if (status !== 'granted' && forceRequestPermission) {
                const requested = await Location.requestForegroundPermissionsAsync()
                status = requested.status
            }

            if (status !== 'granted') {
                setError("Permission denied - using cached location if available")
                if (!hasCached) {
                    await applyKarachiFallback()
                }
                setLoading(false)
                return
            }

            let coords = null;
            try {
                const positionPromise = Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                const timeoutPromise = new Promise<null>((resolve) => 
                    setTimeout(() => resolve(null), 6000)
                );

                const locationObj = await Promise.race([positionPromise, timeoutPromise]);
                if (locationObj) {
                    coords = locationObj.coords;
                } else {
                    console.log("getCurrentPositionAsync timed out, trying getLastKnownPositionAsync...");
                }
            } catch (posError) {
                console.log("getCurrentPositionAsync failed, trying getLastKnownPositionAsync...", posError);
            }

            if (!coords) {
                try {
                    const lastKnown = await Location.getLastKnownPositionAsync();
                    if (lastKnown) {
                        coords = lastKnown.coords;
                    }
                } catch (lastKnownError) {
                    console.log("getLastKnownPositionAsync failed:", lastKnownError);
                }
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
                console.log("Failed to retrieve coordinates from GPS/Browser");
                if (!hasCached) {
                    await applyKarachiFallback()
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
        <LocationContext.Provider value={{ result, error, latitude, longitude, loading, refreshLocation }}>
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
