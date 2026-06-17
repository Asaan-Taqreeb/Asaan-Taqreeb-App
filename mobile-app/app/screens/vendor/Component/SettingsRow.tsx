// SettingsRow.tsx – reusable row for settings screen
import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '@/app/_context/ThemeContext';
import { Colors, Spacing } from '@/app/_constants/theme';

type SettingsRowProps = {
  title: string;
  description?: string;
  // If a switch is needed, pass its value and onChange. Otherwise, provide onPress for navigation.
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
};

export default function SettingsRow({ title, description, switchValue, onSwitchChange, onPress }: SettingsRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={switchValue !== undefined}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>{title}</Text>
          {description && (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{description}</Text>
          )}
        </View>
        {switchValue !== undefined && onSwitchChange && (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#D1D5DB', true: colors.accent + '60' }}
            thumbColor={switchValue ? colors.accent : '#F3F4F6'}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}
