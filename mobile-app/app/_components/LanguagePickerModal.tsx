import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Check, Globe, X } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { LanguageCode, LanguageOption } from '@/app/_utils/localization';

type Props = {
  visible: boolean;
  currentLanguage: LanguageCode;
  options: LanguageOption[];
  onSelect: (language: LanguageCode) => void;
  onClose: () => void;
};

export default function LanguagePickerModal({
  visible,
  currentLanguage,
  options,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close language selector"
        />
        <View style={[styles.modalCard, Shadows.large]}>
          {/* Header */}
          <View className="px-6 py-5 border-b border-gray-100 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center"
                style={{ backgroundColor: `${Colors.primary}12` }}
              >
                <Globe size={20} color={Colors.primary} />
              </View>
              <View>
                <Text className="text-lg font-extrabold" style={{ color: Colors.textPrimary }}>
                  Choose Language
                </Text>
                <Text className="text-xs font-medium text-gray-400">
                  Select your preferred language
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="p-2 rounded-full bg-gray-100 active:opacity-70"
            >
              <X size={18} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {/* Options */}
          <ScrollView
            style={{ maxHeight: 380 }}
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {options.map((option) => {
              const isSelected = option.code === currentLanguage;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => onSelect(option.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  className="p-4 mb-2.5 rounded-2xl flex-row items-center justify-between border active:opacity-80"
                  style={{
                    backgroundColor: isSelected ? `${Colors.primary}0C` : Colors.white,
                    borderColor: isSelected ? Colors.primary : Colors.border,
                  }}
                >
                  <View>
                    <Text
                      className="text-base font-bold"
                      style={{ color: isSelected ? Colors.primary : Colors.textPrimary }}
                    >
                      {option.nativeLabel}
                    </Text>
                    <Text className="text-xs mt-0.5 uppercase tracking-wider text-gray-400 font-semibold">
                      {option.label}
                    </Text>
                  </View>
                  {isSelected ? (
                    <View
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: Colors.primary }}
                    >
                      <Check size={16} color={Colors.white} />
                    </View>
                  ) : (
                    <View className="w-7 h-7 rounded-full border border-gray-300" />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View className="p-4 pt-2 border-t border-gray-100">
            <Pressable
              onPress={onClose}
              className="rounded-2xl py-3.5 items-center justify-center bg-gray-100 active:opacity-80"
            >
              <Text className="font-bold text-sm" style={{ color: Colors.textPrimary }}>
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: 28,
    overflow: 'hidden',
  },
});
