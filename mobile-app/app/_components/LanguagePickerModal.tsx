import React from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { Colors } from '@/app/_constants/theme'
import { LanguageCode, LanguageOption } from '@/app/_utils/localization'

type Props = {
  visible: boolean
  currentLanguage: LanguageCode
  options: LanguageOption[]
  onSelect: (language: LanguageCode) => void
  onClose: () => void
}

export default function LanguagePickerModal({ visible, currentLanguage, options, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable className='flex-1' style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)' }} onPress={onClose}>
        <Pressable
          className='absolute left-4 right-4 top-24 rounded-3xl bg-white overflow-hidden'
          onPress={() => undefined}
        >
          <View className='px-5 py-4 border-b border-gray-100'>
            <Text className='text-lg font-extrabold' style={{ color: Colors.textPrimary }}>
              Choose app language
            </Text>
            <Text className='text-sm mt-1' style={{ color: Colors.textSecondary }}>
              Your choice will be saved and used across the app.
            </Text>
          </View>

          <ScrollView style={{ maxHeight: 420 }}>
            {options.map((option) => {
              const isSelected = option.code === currentLanguage
              return (
                <Pressable
                  key={option.code}
                  onPress={() => onSelect(option.code)}
                  className='px-5 py-4 flex-row items-center justify-between border-b border-gray-100'
                  style={{ backgroundColor: isSelected ? Colors.primary + '08' : Colors.white }}
                >
                  <View>
                    <Text className='text-base font-semibold' style={{ color: Colors.textPrimary }}>
                      {option.nativeLabel}
                    </Text>
                    <Text className='text-xs mt-1 uppercase tracking-widest' style={{ color: Colors.textTertiary }}>
                      {option.label}
                    </Text>
                  </View>
                  {isSelected ? <Check size={20} color={Colors.primary} /> : null}
                </Pressable>
              )
            })}
          </ScrollView>

          <View className='p-4 border-t border-gray-100'>
            <Pressable
              onPress={onClose}
              className='rounded-2xl py-3 items-center justify-center'
              style={{ backgroundColor: Colors.lightGray }}
            >
              <Text className='font-bold' style={{ color: Colors.textPrimary }}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
