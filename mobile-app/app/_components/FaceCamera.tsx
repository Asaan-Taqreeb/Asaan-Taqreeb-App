import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { Colors } from '@/app/_constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

interface FaceCameraProps {
  onCapture: (uri: string, livenessConfidence: number) => void;
  onCancel: () => void;
  type?: 'front' | 'back';
}

const FaceCamera: React.FC<FaceCameraProps> = ({ onCapture, onCancel, type = 'front' }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLivenessPassed, setIsLivenessPassed] = useState(false);
  const [instructions, setInstructions] = useState('Position your face in the oval');
  const [livenessStage, setLivenessStage] = useState<'position' | 'blink' | 'smile'>('position');
  const cameraRef = useRef<CameraView>(null);

  // For liveness check
  const [lastBlinkTime, setLastBlinkTime] = useState(0);
  const [hasSmiled, setHasSmiled] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text>Camera permission is required for identity verification.</Text>
        <Pressable onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const handleFacesDetected = ({ faces }: { faces: any[] }) => {
    if (faces.length === 0) {
      setFaceDetected(false);
      setInstructions('Face not detected');
      return;
    }

    if (faces.length > 1) {
      setFaceDetected(false);
      setInstructions('Multiple faces detected. Please be alone.');
      return;
    }

    const face = faces[0];
    setFaceDetected(true);

    // Stage 1: Position
    if (livenessStage === 'position') {
      const { x, y, width: faceWidth, height: faceHeight } = face.bounds;
      // Basic check if face is somewhat centered and large enough
      if (faceWidth > width * 0.4) {
        setLivenessStage('blink');
        setInstructions('Now, blink your eyes');
      } else {
        setInstructions('Move closer to the camera');
      }
    }

    // Stage 2: Blink Detection (Simplified)
    if (livenessStage === 'blink') {
      if (face.leftEyeOpenProbability < 0.3 && face.rightEyeOpenProbability < 0.3) {
        setLivenessStage('smile');
        setInstructions('Great! Now, give us a big smile');
      }
    }

    // Stage 3: Smile Detection
    if (livenessStage === 'smile') {
      if (face.smilingProbability > 0.7) {
        setIsLivenessPassed(true);
        setInstructions('Liveness verified! Hold still...');
        takePicture();
      }
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            base64: false,
        });
        if (photo) {
            onCapture(photo.uri, 100); // 100% confidence if they passed the blinking/smiling tests
        }
      } catch (e) {
        console.error('Failed to take picture:', e);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={type}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.accurate,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        <View style={styles.overlay}>
          {/* Oval Guide */}
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
            
            {/* Progress indicators */}
            <View style={styles.progressDots}>
               <View style={[styles.dot, livenessStage !== 'position' && styles.activeDot]} />
               <View style={[styles.dot, livenessStage === 'smile' && styles.activeDot]} />
               <View style={[styles.dot, isLivenessPassed && styles.activeDot]} />
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
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
