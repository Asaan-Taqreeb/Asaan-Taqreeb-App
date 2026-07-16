import { useLocationContext } from '@/app/_context/LocationContext'

const useLocation = () => {
  const { result, error, latitude, longitude, loading } = useLocationContext()
  return { result, error, latitude, longitude, loading }
}

export default useLocation