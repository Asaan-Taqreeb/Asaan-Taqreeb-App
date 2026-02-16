import * as Location from "expo-location"
import { useEffect, useState } from 'react'

const useLocation = () => {
    const [error, setError] = useState("")
    const [latitude, setLatitude] = useState<number | undefined>(undefined)
    const [longitude, setLongitude] = useState<number | undefined>(undefined)
    const [result, setResult] = useState({})

    const getUserLocation = async () => {
        let {status} = await Location.requestForegroundPermissionsAsync()

        if (status !== 'granted') {
            setError("Permission in location was not granted")
            return
        }

        let {coords} = await Location.getCurrentPositionAsync()

        if(coords) {
            const {latitude, longitude} = coords;
            setLatitude(latitude)
            setLongitude(longitude)
            let response = await Location.reverseGeocodeAsync({
                latitude,
                longitude
            })
            setResult(response)
            console.log("User Location: ", response)
        }
    }
    useEffect(() => {
        getUserLocation()
    }, [])
  return {result, error}
}

export default useLocation