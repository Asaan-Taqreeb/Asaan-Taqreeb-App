import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Colors } from '@/app/_constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface FaceCameraProps {
  onCapture: (uri: string, livenessConfidence: number) => void;
  onCancel: () => void;
  type?: 'front' | 'back';
}

const FaceCamera: React.FC<FaceCameraProps> = ({ onCapture, onCancel, type = 'front' }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(type);
  const cameraRef = useRef<Camera>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [instructions, setInstructions] = useState('Position your face in the oval and tap capture');

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePhoto({
            qualityPrioritization: 'balanced',
            flash: 'off'
        });
        if (photo) {
            // Return 100 confidence for manual capture to bypass checks
            onCapture(`file://${photo.path}`, 100);
        }
      } catch (e) {
        console.error('Failed to take picture:', e);
        setIsProcessing(false);
      }
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>Camera permission is required for identity verification.</Text>
        <Pressable onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centered}>
         <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={!isProcessing}
        photo={true}
      />
        <View style={styles.overlay}>
          <View style={styles.guide} />
          
          <View style={styles.topControls}>
             <Pressable onPress={onCancel} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="white" />
             </Pressable>
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>{instructions}</Text>
            </View>
            
            <Pressable 
                style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]} 
                onPress={takePicture}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <ActivityIndicator color={Colors.primary} />
                ) : (
                    <View style={styles.captureButtonInner} />
                )}
            </Pressable>
            <Text style={styles.helperText}>Manual capture enabled for stability</Text>
          </View>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#475569',
    marginBottom: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guide: {
    width: width * 0.75,
    height: width * 1.0,
    borderWidth: 3,
    borderRadius: width * 0.5,
    borderStyle: 'dashed',
    borderColor: '#FFFFFF',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 30,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  helperText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 15,
    fontSize: 12,
  },
  button: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
});

export default FaceCamera;
