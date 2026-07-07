import React from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import Svg, { Rect, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  light?: boolean;
  useMonogram?: boolean;
}

export default function AppLogo({ size = 'medium', showText = true, light = false, useMonogram = false }: AppLogoProps) {
  const { width } = useWindowDimensions();
  const screenScale = width < 360 ? 0.88 : width < 768 ? 0.95 : 1;
  const baseBoxSize = size === 'small' ? 48 : size === 'medium' ? 100 : 200;
  const boxSize = Math.round(baseBoxSize * screenScale);
  const fontSize = size === 'small' ? 'text-lg' : size === 'medium' ? (screenScale < 1 ? 'text-2xl' : 'text-3xl') : (screenScale < 1 ? 'text-4xl' : 'text-5xl');
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
              backgroundColor: useMonogram ? '#111808' : Colors.white,
            }
          ]}
        >
          {useMonogram ? (
            <Svg width={boxSize} height={boxSize} viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#BF953F" />
                  <Stop offset="25%" stopColor="#FCF6BA" />
                  <Stop offset="50%" stopColor="#B38728" />
                  <Stop offset="75%" stopColor="#FBF5B7" />
                  <Stop offset="100%" stopColor="#AA771C" />
                </LinearGradient>
              </Defs>
              {/* Background Canvas (Green Waterloo) */}
              <Rect width="100" height="100" fill="#111808" />
              
              {/* Elegant Outer Rings */}
              <Circle cx="50" cy="50" r="41" stroke="url(#gold-grad)" strokeWidth="1.2" fill="none" opacity="0.85" />
              <Circle cx="50" cy="50" r="37" stroke="url(#gold-grad)" strokeWidth="0.6" strokeDasharray="3 2" fill="none" opacity="0.6" />
              
              {/* Serif Intertwined AT Monogram */}
              <SvgText
                x="50"
                y="60"
                fontSize="34"
                fontFamily="Times New Roman, Georgia, serif"
                fontWeight="bold"
                textAnchor="middle"
                fill="url(#gold-grad)"
                letterSpacing="-2"
              >
                AT
              </SvgText>
            </Svg>
          ) : (
            <Image 
              source={logoSource}
              style={{ 
                width: boxSize, 
                height: boxSize,
                borderRadius: borderRadius,
              }}
              resizeMode="cover"
            />
          )}
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
