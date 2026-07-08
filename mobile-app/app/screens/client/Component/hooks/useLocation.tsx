import * as Location from "expo-location"
import { useEffect, useState, useCallback } from 'react'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const LOCATION_CACHE_KEY = '@user_location_cache_v2'
const WEB_GEOLOCATION_SOURCE = 'browser-geolocation'
const CACHE_MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes

// Haversine distance in km between two lat/lon pairs
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Parse Nominatim reverse geocoding response into a standardised location object.
 *
 * Nominatim's `city_district` field for Karachi returns administrative "Towns"
 * (e.g. "Gulshan Town") that cover very large areas and don't match what
 * residents consider their actual neighbourhood.  `suburb` and `neighbourhood`
 * are usually far more accurate (e.g. "North Nazimabad", "PECHS Block 6").
 */
const parseNominatimAddress = (addr: any) => {
    // For Karachi, suburb/neighbourhood is the real local area name
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

const useLocation = () => {
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
                console.log("Using cached location:", cachedData.result)
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

    const getUserLocation = useCallback(async () => {
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

                            // If cached location is far from the real position (>2 km),
                            // clear it immediately so the UI updates
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
                            enableHighAccuracy: false, // Don't enforce hardware GPS on desktop web to avoid hanging
                            timeout: 8000,            // 8s timeout
                            maximumAge: 0             // Always get a fresh location
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
            let {status} = await Location.requestForegroundPermissionsAsync()

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
                // Get fresh location with a 6-second timeout to prevent infinite hanging
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
                        console.log("Fresh location fetched: ", response)
                        setError("") // Clear any previous errors
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
    
    useEffect(() => {
        getUserLocation()
    }, [getUserLocation])
    
  return {result, error, latitude, longitude, loading}
}

export default useLocation