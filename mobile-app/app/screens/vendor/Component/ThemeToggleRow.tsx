// ThemeToggleRow.tsx – row to toggle light/dark theme
import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '@/app/_context/ThemeContext';

type ThemeToggleRowProps = {
  title?: string;
};

export default function ThemeToggleRow({ title = 'Dark Mode' }: ThemeToggleRowProps) {
  const { isDark, setThemePreference, colors } = useTheme();

  const handleToggle = () => {
    setThemePreference(isDark ? 'light' : 'dark');
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleToggle}
      className="rounded-2xl p-4 mt-3"
      style={{
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>{title}</Text>
        <Switch
          value={isDark}
          onValueChange={handleToggle}
          trackColor={{ false: '#D1D5DB', true: colors.accent + '60' }}
          thumbColor={isDark ? colors.accent : '#F3F4F6'}
        />
      </View>
    </TouchableOpacity>
  );
}

