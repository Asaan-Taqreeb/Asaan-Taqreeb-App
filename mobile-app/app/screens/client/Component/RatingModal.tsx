import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Pressable, Animated } from 'react-native';
import { Star, X, CheckCircle2 } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';

interface RatingModalProps {
  isVisible: boolean;
  onClose: () => void;
  vendorName: string;
  onConfirm: (rating: number, comment: string) => void;
}

export default function RatingModal({ isVisible, onClose, vendorName, onConfirm }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const starsScale = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current];

  const handleStarPress = (index: number) => {
    setRating(index + 1);
    Animated.sequence([
      Animated.spring(starsScale[index], { toValue: 1.5, useNativeDriver: true }),
      Animated.spring(starsScale[index], { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    setIsSubmitted(true);
    setTimeout(() => {
      onConfirm(rating, comment);
      setIsSubmitted(false);
      setRating(0);
      setComment('');
      onClose();
    }, 1500);
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {!isSubmitted ? (
            <>
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold" style={{ color: Colors.textPrimary }}>Rate Your Experience</Text>
                <TouchableOpacity onPress={onClose} className="p-2">
                  <X size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <Text className="text-sm text-gray-500 mb-6 text-center">
                How was your experience with <Text className="font-bold" style={{ color: Colors.primary }}>{vendorName}</Text>?
              </Text>

              <View className="flex-row justify-center gap-3 mb-8">
                {[0, 1, 2, 3, 4].map((index) => (
                  <Pressable key={index} onPress={() => handleStarPress(index)}>
                    <Animated.View style={{ transform: [{ scale: starsScale[index] }] }}>
                      <Star 
                        size={32} 
                        color={index < rating ? "#FCD34D" : Colors.border} 
                        fill={index < rating ? "#FCD34D" : "transparent"} 
                      />
                    </Animated.View>
                  </Pressable>
                ))}
              </View>

              <View className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100">
                <TextInput
                  placeholder="Tell us more about the service (optional)..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                  style={styles.textInput}
                  className="text-sm"
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={rating === 0}
                activeOpacity={0.8}
                className="py-4 rounded-2xl items-center"
                style={{ 
                  backgroundColor: rating === 0 ? Colors.border : Colors.primary,
                  ...Shadows.medium 
                }}
              >
                <Text className="text-white font-bold text-base">Submit Review</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View className="items-center py-10">
              <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6">
                <CheckCircle2 size={48} color={Colors.success} />
              </View>
              <Text className="text-xl font-bold text-center mb-2" style={{ color: Colors.textPrimary }}>
                Thank You!
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Your feedback helps us improve our community.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 24,
    width: '100%',
    ...Shadows.large,
  },
  textInput: {
    height: 100,
    textAlignVertical: 'top',
    color: Colors.textPrimary,
  },
});
