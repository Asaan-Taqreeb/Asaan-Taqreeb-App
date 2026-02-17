import * as Location from "expo-location"
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const LOCATION_CACHE_KEY = '@user_location_cache'

const useLocation = () => {
    const [error, setError] = useState("")
    const [latitude, setLatitude] = useState<number | undefined>(undefined)
    const [longitude, setLongitude] = useState<number | undefined>(undefined)
    const [result, setResult] = useState({})
    const [loading, setLoading] = useState(true)

    const getCachedLocation = async () => {
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
    }

    const cacheLocation = async (lat: number, lon: number, locationResult: any) => {
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
    }

    const getUserLocation = async () => {
        try {
            setLoading(true)
            
            // Try to load cached location first
            const hasCached = await getCachedLocation()
            
            let {status} = await Location.requestForegroundPermissionsAsync()

            if (status !== 'granted') {
                setError("Permission denied - using cached location if available")
                setLoading(false)
                // If permission denied but we have cache, that's OK
                if (hasCached) {
                    return
                }
                return
            }

            // Get fresh location
            let {coords} = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            })

            if(coords) {
                const {latitude, longitude} = coords;
                setLatitude(latitude)
                setLongitude(longitude)
                let response = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude
                })
                setResult(response)
                
                // Cache the location
                await cacheLocation(latitude, longitude, response)
                
                console.log("Fresh location fetched: ", response)
                setError("") // Clear any previous errors
            }
        } catch (error) {
            console.log("Error getting location:", error)
            setError("Error fetching location - using cached if available")
        } finally {
            setLoading(false)
        }
    }
    
    useEffect(() => {
        getUserLocation()
    }, [])
    
  return {result, error, latitude, longitude, loading}
}

export default useLocation