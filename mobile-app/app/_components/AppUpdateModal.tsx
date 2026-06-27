import React from 'react'
import { Linking, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { Download, RefreshCw, X } from 'lucide-react-native'
import { Colors } from '@/app/_constants/theme'

type Props = {
  visible: boolean
  currentVersion: string
  latestVersion: string | null
  releaseNotes: string | null
  apkUrl: string | null
  forceUpdate: boolean
  onClose: () => void
}

export default function AppUpdateModal({
  visible,
  currentVersion,
  latestVersion,
  releaseNotes,
  apkUrl,
  forceUpdate,
  onClose,
}: Props) {
  const handleUpdateNow = async () => {
    if (!apkUrl) return

    try {
      await Linking.openURL(apkUrl)
    } catch (error) {
      console.error('Unable to open update link:', error)
    }
  }

  const canDismiss = !forceUpdate

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={canDismiss ? onClose : () => undefined}>
      <Pressable
        className='flex-1 justify-center px-5'
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
        onPress={canDismiss ? onClose : undefined}
      >
        <Pressable
          className='overflow-hidden rounded-[28px] bg-white'
          onPress={() => undefined}
        >
          <View style={{ padding: 20, backgroundColor: Colors.primary }}>
            <View className='flex-row items-start justify-between'>
              <View className='flex-1 pr-4'>
                <View className='mb-3 h-12 w-12 items-center justify-center rounded-2xl' style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}>
                  <RefreshCw size={22} color={Colors.textLight} />
                </View>
                <Text className='text-2xl font-extrabold' style={{ color: Colors.textLight }}>
                  Update available
                </Text>
                <Text className='mt-2 text-sm' style={{ color: Colors.textLight }}>
                  A newer version of the app is ready to download.
                </Text>
              </View>
              {canDismiss ? (
                <Pressable onPress={onClose} className='h-10 w-10 items-center justify-center rounded-full' style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}>
                  <X size={18} color={Colors.textLight} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ padding: 20 }}>
            <View className='rounded-2xl px-4 py-3' style={{ backgroundColor: Colors.lightGray }}>
              <Text className='text-xs font-bold uppercase tracking-[0.2em]' style={{ color: Colors.textTertiary }}>
                Installed version
              </Text>
              <Text className='mt-1 text-lg font-extrabold' style={{ color: Colors.textPrimary }}>
                {currentVersion}
              </Text>
            </View>

            <View className='mt-3 rounded-2xl px-4 py-3' style={{ backgroundColor: Colors.warningLight }}>
              <Text className='text-xs font-bold uppercase tracking-[0.2em]' style={{ color: Colors.textTertiary }}>
                Latest version
              </Text>
              <Text className='mt-1 text-lg font-extrabold' style={{ color: Colors.textPrimary }}>
                {latestVersion || 'Unknown'}
              </Text>
            </View>

            {releaseNotes ? (
              <View className='mt-4 rounded-2xl border px-4 py-3' style={{ borderColor: Colors.border, backgroundColor: Colors.white }}>
                <Text className='text-sm font-bold' style={{ color: Colors.textPrimary }}>
                  What’s new
                </Text>
                <Text className='mt-2 text-sm leading-6' style={{ color: Colors.textSecondary }}>
                  {releaseNotes}
                </Text>
              </View>
            ) : null}

            <Text className='mt-4 text-xs leading-5' style={{ color: Colors.textTertiary }}>
              {Platform.OS === 'android'
                ? 'Tap update now to download the new APK. After download, open the file to install the update.'
                : 'Tap update now to open the latest download link.'}
            </Text>
          </ScrollView>

          <View className='gap-3 border-t border-gray-100 p-5'>
            <Pressable
              onPress={handleUpdateNow}
              className='flex-row items-center justify-center rounded-2xl px-4 py-4'
              style={{ backgroundColor: Colors.primary }}
            >
              <Download size={18} color={Colors.textLight} />
              <Text className='ml-2 text-base font-bold' style={{ color: Colors.textLight }}>
                Update now
              </Text>
            </Pressable>

            {canDismiss ? (
              <Pressable
                onPress={onClose}
                className='rounded-2xl px-4 py-4'
                style={{ backgroundColor: Colors.lightGray }}
              >
                <Text className='text-center text-base font-bold' style={{ color: Colors.textPrimary }}>
                  Later
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
