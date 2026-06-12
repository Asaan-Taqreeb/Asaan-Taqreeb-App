import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Shadows } from '@/app/_constants/theme';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  light?: boolean;
}

export default function AppLogo({ size = 'medium', showText = true, light = false }: AppLogoProps) {
  const boxSize = size === 'small' ? 48 : size === 'medium' ? 100 : 200;
  const fontSize = size === 'small' ? 'text-lg' : size === 'medium' ? 'text-3xl' : 'text-5xl';
  const borderRadius = boxSize * 0.22; // Proportional rounded corners (similar to squircle iOS icons)
  
  // Use icon.png for small size (where big logo doesn't fit), and logo.png for medium/large sizes
  const logoSource = size === 'small'
    ? require('@/assets/images/icon.png')
    : require('@/assets/images/logo.png');

  return (
    <View className="items-center justify-center">
      <View 
        style={[
          styles.logoShadow,
          { 
            width: boxSize, 
            height: boxSize,
            borderRadius: borderRadius,
          }
        ]}
      >
        <View 
          style={[
            styles.logoBox, 
            { 
              width: boxSize, 
              height: boxSize,
              borderRadius: borderRadius,
            }
          ]}
        >
          <Image 
            source={logoSource}
            style={{ 
              width: boxSize, 
              height: boxSize,
              borderRadius: borderRadius,
            }}
            resizeMode="cover"
          />
        </View>
      </View>
      
      {showText && (
        <View className="mt-4 items-center">
          <Text 
            className={`${fontSize} font-black tracking-tighter`}
            style={{ color: light ? Colors.white : Colors.textPrimary }}
          >
            Asaan<Text style={{ color: Colors.primary }}>Taqreeb</Text>
          </Text>
          <Text 
            className="text-[10px] font-bold uppercase tracking-[4px] mt-1.5 opacity-40"
            style={{ color: light ? Colors.white : Colors.textSecondary }}
          >
            Premium Events
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoShadow: {
    ...Shadows.medium,
    backgroundColor: 'transparent',
  },
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
});
