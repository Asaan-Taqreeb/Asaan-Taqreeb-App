import React, { useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Shadows } from '@/app/_constants/theme';
import { uploadServiceImages, deleteServiceImage } from '@/app/_utils/servicesApi';

interface ImageUploaderProps {
  serviceId?: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  maxImages?: number;
}

export default function ImageUploader({
  serviceId,
  images,
  onImagesChange,
  onUploadStart,
  onUploadEnd,
  maxImages = 5
}: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const pickImages = async () => {
    try {
      setLoading(true);
      onUploadStart?.();

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultiple: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled) {
        const selectedUris = result.assets.map(asset => asset.uri);
        const availableSlots = maxImages - images.length;
        const urisToAdd = selectedUris.slice(0, availableSlots);

        if (serviceId) {
          // Upload to backend
          try {
            const response = await uploadServiceImages(serviceId, urisToAdd);
            // After successful upload, update local state with all images from backend (new + existing)
            const updatedImages = response?.images || [];
            if (Array.isArray(updatedImages)) {
              onImagesChange(updatedImages);
            }
            Alert.alert('Success', 'Images uploaded successfully');
          } catch (error: any) {
            Alert.alert('Upload Failed', error?.message || 'Failed to upload images');
          }
        } else {
          // For new services, just add to local state
          onImagesChange([...images, ...urisToAdd]);
        }

        if (selectedUris.length > availableSlots) {
          Alert.alert('Limit Reached', `You can only add ${availableSlots} more images`);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to pick images');
    } finally {
      setLoading(false);
      onUploadEnd?.();
    }
  };

  const removeImage = async (imageUrl: string) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              setDeleting(imageUrl);
              if (serviceId) {
                // Delete from backend
                await deleteServiceImage(serviceId, imageUrl);
              }
              // Remove from local state
              onImagesChange(images.filter(img => img !== imageUrl));
              Alert.alert('Success', 'Image removed successfully');
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to remove image');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: Colors.white}, Shadows.medium]}>
      <Text style={[styles.title, {color: Colors.textPrimary}]}>Service Images</Text>
      <Text style={[styles.subtitle, {color: Colors.textSecondary}]}>
        Add photos of your venue (max {maxImages} images)
      </Text>

      {/* Image Grid */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageGrid}
          scrollEventThrottle={16}
        >
          {images.map((imageUrl, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.imageItem}
              />
              <Pressable
                style={[styles.deleteButton, {backgroundColor: Colors.error || '#FF4444'}]}
                onPress={() => removeImage(imageUrl)}
                disabled={deleting === imageUrl}
              >
                {deleting === imageUrl ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Trash2 size={16} color={Colors.white} />
                )}
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add Image Button */}
      {images.length < maxImages && (
        <Pressable
          style={[styles.addButton, {backgroundColor: Colors.banquet || '#007AFF'}]}
          onPress={pickImages}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Plus size={20} color={Colors.white} />
              <Text style={[styles.addButtonText, {color: Colors.white}]}>
                Add Images ({images.length}/{maxImages})
              </Text>
            </>
          )}
        </Pressable>
      )}

      {images.length === 0 && (
        <View style={[styles.emptyState, {backgroundColor: Colors.lightGray || '#F5F5F5'}]}>
          <ImageIcon size={40} color={Colors.textTertiary} />
          <Text style={[styles.emptyText, {color: Colors.textSecondary}]}>
            No images yet. Add photos to showcase your service.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  imageGrid: {
    marginBottom: 12,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  imageItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});
