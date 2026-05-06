import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets, useSharedValue } from 'react-native-worklets-core';
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
  const [instructions, setInstructions] = useState('Position your face in the oval');
  const [livenessStage, setLivenessStage] = useState<'position' | 'blink' | 'smile'>('position');
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLivenessPassed, setIsLivenessPassed] = useState(false);

  // Use shared values for worklet state
  const stageShared = useSharedValue<'position' | 'blink' | 'smile'>('position');
  const faceDetectedShared = useSharedValue<boolean>(false);

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    contourMode: 'none',
    landmarkMode: 'none',
    classificationMode: 'all',
  });

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  // JS Thread function to update UI from Worklet
  const updateStateFromWorklet = Worklets.createRunOnJS((newFaceDetected: boolean, newStage: 'position' | 'blink' | 'smile', pass: boolean) => {
    if (faceDetected !== newFaceDetected) setFaceDetected(newFaceDetected);
    
    if (livenessStage !== newStage) {
      setLivenessStage(newStage);
      if (newStage === 'position') setInstructions('Position your face in the oval');
      else if (newStage === 'blink') setInstructions('Now, blink your eyes');
      else if (newStage === 'smile') setInstructions('Great! Now, give us a big smile');
    }

    if (pass && !isLivenessPassed && !isProcessing) {
      setIsLivenessPassed(true);
      setInstructions('Liveness verified! Hold still...');
      takePicture(100);
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);

    if (faces.length === 0 || faces.length > 1) {
      if (faceDetectedShared.value !== false) {
        faceDetectedShared.value = false;
        stageShared.value = 'position';
        updateStateFromWorklet(false, 'position', false);
      }
      return;
    }

    const face = faces[0];
    let newStage = stageShared.value;
    let passed = false;
    
    if (faceDetectedShared.value !== true) {
      faceDetectedShared.value = true;
    }

    if (newStage === 'position') {
      const faceWidth = face.bounds.width;
      // Basic size check
      if (faceWidth > frame.width * 0.3) {
        newStage = 'blink';
      }
    } else if (newStage === 'blink') {
      if (face.leftEyeOpenProbability < 0.3 && face.rightEyeOpenProbability < 0.3) {
        newStage = 'smile';
      }
    } else if (newStage === 'smile') {
      if (face.smilingProbability > 0.7) {
        passed = true;
      }
    }

    if (newStage !== stageShared.value || passed) {
      stageShared.value = newStage;
      updateStateFromWorklet(true, newStage, passed);
    }
  }, [detectFaces]);

  const takePicture = async (confidence: number = 0) => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePhoto({
            qualityPrioritization: 'speed',
            flash: 'off'
        });
        if (photo) {
            onCapture(`file://${photo.path}`, confidence);
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
        <Text>Camera permission is required for identity verification.</Text>
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
        isActive={!isLivenessPassed && !isProcessing}
        frameProcessor={frameProcessor}
        photo={true}
      />
        <View style={styles.overlay}>
          <View style={[
            styles.guide, 
            { borderColor: isLivenessPassed ? '#22C55E' : faceDetected ? Colors.primary : '#FFFFFF' }
          ]} />
          
          <View style={styles.topControls}>
             <Pressable onPress={onCancel} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="white" />
             </Pressable>
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>{instructions}</Text>
            </View>
            
            <View style={styles.progressDots}>
               <View style={[styles.dot, livenessStage !== 'position' && styles.activeDot]} />
               <View style={[styles.dot, livenessStage === 'smile' && styles.activeDot]} />
               <View style={[styles.dot, isLivenessPassed && styles.activeDot]} />
            </View>

            {/* Manual fallback capture button just in case */}
            <Pressable 
                style={[styles.captureButton, isProcessing && styles.captureButtonDisabled, { marginTop: 20 }]} 
                onPress={() => takePicture(50)}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <ActivityIndicator color={Colors.primary} />
                ) : (
                    <View style={styles.captureButtonInner} />
                )}
            </Pressable>
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
    marginBottom: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    backgroundColor: Colors.primary,
  },
  captureButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
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
