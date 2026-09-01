import React from 'react';
import { Platform, Modal, View, Image, TouchableOpacity, Pressable, Text, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  images: string[];
  index?: number;
  onRequestClose: () => void;
};

export default function ImageViewerModal({ visible, images, index = 0, onRequestClose }: Props) {
  const data = images.map((uri) => ({ uri }));

  if (Platform.OS === 'web') {
    if (!visible) return null;
    const currentImage = images[index] || images[0];

    return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onRequestClose}>
        <View style={styles.webContainer} accessibilityViewIsModal>
          <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} accessibilityLabel="Close image viewer" />
          <TouchableOpacity style={styles.closeButton} onPress={onRequestClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close image viewer">
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          {currentImage ? (
            <Image
              source={{ uri: currentImage }}
              style={styles.webImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    );
  }

  // Dynamic import on native platforms to prevent runtime issues
  const ImageViewing = require('react-native-image-viewing').default;

  return (
    <ImageViewing
      images={data}
      imageIndex={index}
      visible={visible}
      onRequestClose={onRequestClose}
    />
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 30,
    zIndex: 99,
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  webImage: {
    width: '90%',
    height: '85%',
  },
});
