import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PartyPopper } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  light?: boolean;
}

export default function AppLogo({ size = 'medium', showText = true, light = false }: AppLogoProps) {
  const iconSize = size === 'small' ? 24 : size === 'medium' ? 40 : 60;
  const boxSize = size === 'small' ? 48 : size === 'medium' ? 80 : 120;
  const fontSize = size === 'small' ? 'text-lg' : size === 'medium' ? 'text-3xl' : 'text-5xl';
  
  return (
    <View className="items-center justify-center">
      <View 
        style={[
          styles.logoBox, 
          Shadows.large,
          { 
            width: boxSize, 
            height: boxSize, 
            borderRadius: boxSize * 0.3,
            backgroundColor: light ? Colors.white : Colors.vendor 
          }
        ]}
      >
        <View 
            style={styles.innerBox}
            className="items-center justify-center"
        >
            <PartyPopper 
                size={iconSize} 
                color={light ? Colors.vendor : Colors.primary} 
                strokeWidth={2.5}
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
            className="text-[10px] font-bold uppercase tracking-[4px] -mt-1 opacity-40"
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
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerBox: {
    width: '100%',
    height: '100%',
  }
});
