import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Location from 'expo-location';
import { useTheme } from '@/app/_context/ThemeContext';

interface LocationPermissionScreenProps {
  onPermissionGranted: () => void;
  onBack: () => void;
}

export default function LocationPermissionScreen({ onPermissionGranted, onBack }: LocationPermissionScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [requesting, setRequesting] = React.useState(false);

  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        onPermissionGranted();
      } else {
        Alert.alert(
          'Location Required',
          'We need your location to show nearby event organizers, catering, and venues. Please enable it in settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Error requesting location permission:', error);
      Alert.alert('Error', 'An error occurred while requesting permission.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Header Back Button */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} className="active:opacity-60">
          <ArrowLeft color={Colors.textPrimary} size={24} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Globe Illustration Container */}
        <View style={styles.illustrationContainer}>
          <Svg width={160} height={160} viewBox="0 0 120 120">
            {/* Blue Ocean Globe */}
            <Circle cx={60} cy={60} r={48} fill="#93C5FD" />
            
            {/* Continent 1 */}
            <Path 
              d="M30,35 C42,20 65,30 55,50 C48,65 30,70 25,50 C22,40 25,35 30,35 Z" 
              fill="#4ADE80" 
            />
            {/* Continent 2 */}
            <Path 
              d="M75,30 C90,20 100,35 95,50 C90,65 70,85 60,70 C55,60 65,40 75,30 Z" 
              fill="#4ADE80" 
            />
            {/* Continent 3 (bottom chunk) */}
            <Path 
              d="M35,80 C45,75 55,85 50,95 C45,100 35,95 35,80 Z" 
              fill="#4ADE80" 
            />

            {/* Pink Marker Shadow/Base on Globe */}
            <Circle cx={76} cy={36} r={8} fill="rgba(244, 63, 94, 0.2)" />
          </Svg>
          
          {/* Floating Pink Location Pin */}
          <View style={styles.markerContainer}>
            <Svg width={36} height={36} viewBox="0 0 24 24">
              <Path 
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                fill="#EC4899" 
              />
              <Circle cx={12} cy={9} r={3} fill="#FFFFFF" />
            </Svg>
          </View>
        </View>

        {/* Text Details */}
        <Text style={styles.title}>Allow location access</Text>
        <Text style={styles.subtitle}>
          We use this to show nearby stores. You can edit access in your phone's settings.
        </Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Text style={styles.disclaimer}>
          By allowing access, you consent to share your personal info with Google Maps as stated in the{' '}
          <Text style={styles.privacyLink}>Privacy Policy</Text>
        </Text>

        <Pressable 
          style={styles.button} 
          onPress={handleRequestPermission}
          disabled={requesting}
          className="active:opacity-80"
        >
          {requesting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Allow access</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 20,
    height: 48,
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  illustrationContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  markerContainer: {
    position: 'absolute',
    top: 10,
    right: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textTertiary,
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  privacyLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary, // Midnight Navy
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
});
