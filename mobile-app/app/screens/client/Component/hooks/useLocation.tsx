import * as Location from "expo-location"
import { useEffect, useState, useCallback } from 'react'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const LOCATION_CACHE_KEY = '@user_location_cache'

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
                setLatitude(cachedData.latitude)
                setLongitude(cachedData.longitude)
                setResult(cachedData.result)
                console.log("Using cached location:", cachedData.result)
                return true
            }
        } catch (error) {
            console.log("Error reading cached location:", error)
        }
        return false
    }, [])

    const cacheLocation = useCallback(async (lat: number, lon: number, locationResult: any) => {
        try {
            const cacheData = {
                latitude: lat,
                longitude: lon,
                result: locationResult,
                timestamp: Date.now()
            }
            await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData))
            console.log("Location cached successfully")
        } catch (error) {
            console.log("Error caching location:", error)
        }
    }, [])

    const getUserLocation = useCallback(async () => {
        try {
            setLoading(true)
            
            // Try to load cached location first
            const hasCached = await getCachedLocation()
            
            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined' && window.navigator && window.navigator.geolocation) {
                    window.navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;
                            setLatitude(latitude);
                            setLongitude(longitude);
                            try {
                                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
                                const res = await fetch(url, {
                                    headers: {
                                        'User-Agent': 'Asaan-Taqreeb-App/1.0'
                                    }
                                });
                                const data = await res.json();
                                if (data && data.address) {
                                    const addr = data.address;
                                    const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || "";
                                    const district = addr.county || addr.city_district || addr.district || addr.state || "";
                                    const response = [{
                                        city: city,
                                        district: district,
                                        country: addr.country || "",
                                        name: addr.road || addr.suburb || ""
                                    }];
                                    setResult(response);
                                    await cacheLocation(latitude, longitude, response);
                                    setError("");
                                } else {
                                    throw new Error("No reverse geocoding results found");
                                }
                            } catch (err: any) {
                                console.log("Web geocoding failed:", err);
                                if (!hasCached) {
                                    setError("Geocoding failed");
                                }
                            } finally {
                                setLoading(false);
                            }
                        },
                        (geoError) => {
                            console.log("Web Geolocation failed:", geoError);
                            if (!hasCached) {
                                setError("Location permission denied or unavailable");
                            }
                            setLoading(false);
                        },
                        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
                    );
                } else {
                    if (!hasCached) {
                        setError("Geolocation not supported by browser");
                    }
                    setLoading(false);
                }
                return;
            }

            // Native iOS/Android implementation
            let {status} = await Location.requestForegroundPermissionsAsync()

            if (status !== 'granted') {
                setError("Permission denied - using cached location if available")
                setLoading(false)
                return
            }

            // Get fresh location with a 6-second timeout to prevent infinite hanging
            const positionPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            const timeoutPromise = new Promise<null>((resolve) => 
                setTimeout(() => resolve(null), 6000)
            );

            const locationObj = await Promise.race([positionPromise, timeoutPromise]);
            let coords = null;

            if (locationObj) {
                coords = locationObj.coords;
            } else {
                console.log("getCurrentPositionAsync timed out, trying getLastKnownPositionAsync...");
                const lastKnown = await Location.getLastKnownPositionAsync();
                if (lastKnown) {
                    coords = lastKnown.coords;
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
                        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
                        const res = await fetch(url, {
                            headers: {
                                'User-Agent': 'Asaan-Taqreeb-App/1.0'
                            }
                        })
                        const data = await res.json()
                        if (data && data.address) {
                            const addr = data.address
                            const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || ""
                            const district = addr.county || addr.city_district || addr.district || addr.state || ""
                            response = [{
                                city: city,
                                district: district,
                                country: addr.country || "",
                                name: addr.road || addr.suburb || ""
                            }]
                        }
                    }
                    
                    if (response && response.length > 0) {
                        setResult(response)
                        await cacheLocation(latitude, longitude, response)
                        console.log("Fresh location fetched: ", response)
                        setError("") // Clear any previous errors
                    } else {
                        throw new Error("No reverse geocoding results found");
                    }
                } catch (geocodeError) {
                    console.log("Geocoding service unavailable:", geocodeError)
                    if (!hasCached) {
                        setError("Location service unavailable")
                    }
                }
            } else {
                console.log("Failed to retrieve coordinates from GPS/Browser");
                if (!hasCached) {
                    setError("Location coordinates unavailable")
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
    }, [cacheLocation, getCachedLocation])
    
    useEffect(() => {
        getUserLocation()
    }, [getUserLocation])
    
  return {result, error, latitude, longitude, loading}
}

export default useLocation