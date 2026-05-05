import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '@/app/_constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { submitKyc } from '@/app/_utils/authApi';
import { uploadToCloudinary } from '@/app/_utils/cloudinaryUpload';
import FaceCamera from '@/app/_components/FaceCamera';

type KycStep = 'instructions' | 'cnic-number' | 'cnic-front' | 'cnic-back' | 'selfie' | 'submitting';

const KycScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [step, setStep] = useState<KycStep>('instructions');
    const [cnic, setCnic] = useState('');
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [livenessConfidence, setLivenessConfidence] = useState(0);
    const [loading, setLoading] = useState(false);

    const pickImage = async (side: 'front' | 'back') => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            if (side === 'front') setFrontImage(result.assets[0].uri);
            else setBackImage(result.assets[0].uri);
        }
    };

    const handleSelfieCapture = (uri: string, confidence: number) => {
        setSelfieImage(uri);
        setLivenessConfidence(confidence);
        setStep('cnic-number'); // Move to final step after selfie
    };

    const handleSubmit = async () => {
        if (cnic.length !== 13) {
            Alert.alert('Error', 'Please enter a valid 13-digit CNIC number');
            return;
        }

        setLoading(true);
        setStep('submitting');
        try {
            // 1. Upload images to Cloudinary
            console.log('Uploading KYC documents to Cloudinary...');
            const [frontUrl, backUrl, selfieUrl] = await Promise.all([
                uploadToCloudinary(frontImage!),
                uploadToCloudinary(backImage!),
                uploadToCloudinary(selfieImage!)
            ]);

            // 2. Submit to backend
            console.log('Submitting KYC data to backend...');
            await submitKyc({
                cnic,
                idFrontImage: frontUrl,
                idBackImage: backUrl,
                selfieImage: selfieUrl,
                livenessConfidence
            });

            Alert.alert('Success', 'Your identity verification documents have been submitted and are under review.', [
                { text: 'Great!', onPress: () => router.replace('/') }
            ]);
        } catch (error) {
            console.error('KYC submission error:', error);
            Alert.alert('Submission Failed', 'Something went wrong while uploading your documents. Please try again.');
            setStep('cnic-number');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'selfie') {
        return (
            <FaceCamera 
                onCapture={handleSelfieCapture} 
                onCancel={() => setStep('cnic-back')} 
            />
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Identity <Text style={{color: Colors.primary}}>Verification</Text></Text>
                    <Text style={styles.subtitle}>Help us keep Asaan Taqreeb safe for everyone</Text>
                </View>

                {step === 'instructions' && (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="shield-checkmark" size={80} color={Colors.primary} />
                        </View>
                        <Text style={styles.stepTitle}>Why verify?</Text>
                        <Text style={styles.stepDesc}>
                            To prevent scams and ensure a professional experience, we require all users to verify their identity using their CNIC and a live selfie.
                        </Text>
                        <View style={styles.checklist}>
                            <View style={styles.checkItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                <Text style={styles.checkText}>Original CNIC card</Text>
                            </View>
                            <View style={styles.checkItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                <Text style={styles.checkText}>Good lighting</Text>
                            </View>
                            <View style={styles.checkItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                <Text style={styles.checkText}>Real-time facial verification</Text>
                            </View>
                        </View>
                        <Pressable style={styles.primaryButton} onPress={() => setStep('cnic-front')}>
                            <Text style={styles.primaryButtonText}>GET STARTED</Text>
                        </Pressable>
                    </View>
                )}

                {(step === 'cnic-front' || step === 'cnic-back') && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>
                            {step === 'cnic-front' ? 'CNIC Front Side' : 'CNIC Back Side'}
                        </Text>
                        <Text style={styles.stepDesc}>
                            Take a clear photo of the {step === 'cnic-front' ? 'front' : 'back'} of your original CNIC card.
                        </Text>
                        
                        <Pressable style={styles.imagePlaceholder} onPress={() => pickImage(step === 'cnic-front' ? 'front' : 'back')}>
                            {(step === 'cnic-front' ? frontImage : backImage) ? (
                                <Image source={{ uri: step === 'cnic-front' ? frontImage! : backImage! }} style={styles.capturedImage} />
                            ) : (
                                <View style={styles.placeholderInner}>
                                    <Ionicons name="camera" size={48} color="#94A3B8" />
                                    <Text style={styles.placeholderText}>Tap to open camera</Text>
                                </View>
                            )}
                        </Pressable>

                        <View style={styles.buttonRow}>
                             <Pressable style={styles.secondaryButton} onPress={() => setStep(step === 'cnic-front' ? 'instructions' : 'cnic-front')}>
                                <Text style={styles.secondaryButtonText}>BACK</Text>
                            </Pressable>
                            <Pressable 
                                style={[styles.primaryButton, { flex: 1, opacity: (step === 'cnic-front' ? frontImage : backImage) ? 1 : 0.5 }]} 
                                disabled={!(step === 'cnic-front' ? frontImage : backImage)}
                                onPress={() => setStep(step === 'cnic-front' ? 'cnic-back' : 'selfie')}
                            >
                                <Text style={styles.primaryButtonText}>NEXT</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {step === 'cnic-number' && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Final Step</Text>
                        <Text style={styles.stepDesc}>Please enter your 13-digit CNIC number for our records.</Text>
                        
                        <TextInput
                            label="CNIC Number"
                            placeholder="42101XXXXXXXX"
                            value={cnic}
                            onChangeText={setCnic}
                            keyboardType="number-pad"
                            maxLength={13}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#CBD5E1"
                            activeOutlineColor={Colors.primary}
                        />

                        <View style={styles.summaryContainer}>
                            <View style={styles.summaryItem}>
                                <Ionicons name="card-outline" size={20} color={Colors.primary} />
                                <Text style={styles.summaryText}>CNIC Photos Attached</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Ionicons name="person-outline" size={20} color={Colors.primary} />
                                <Text style={styles.summaryText}>Facial Liveness Verified</Text>
                            </View>
                        </View>

                        <Pressable style={styles.primaryButton} onPress={handleSubmit}>
                            <Text style={styles.primaryButtonText}>SUBMIT VERIFICATION</Text>
                        </Pressable>
                        
                        <Pressable onPress={() => setStep('selfie')} style={{ marginTop: 15 }}>
                            <Text style={styles.secondaryButtonText}>RE-TAKE SELFIE</Text>
                        </Pressable>
                    </View>
                )}

                {step === 'submitting' && (
                    <View style={styles.stepContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingTitle}>Processing...</Text>
                        <Text style={styles.loadingDesc}>Uploading documents and verifying facial data. This may take a few seconds.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
    },
    stepContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        alignItems: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    stepDesc: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    checklist: {
        width: '100%',
        marginBottom: 32,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#F1F5F9',
        padding: 12,
        borderRadius: 12,
    },
    checkText: {
        marginLeft: 12,
        fontSize: 14,
        fontWeight: '500',
        color: '#475569',
    },
    imagePlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 24,
    },
    placeholderInner: {
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        color: '#94A3B8',
        fontWeight: '600',
    },
    capturedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    secondaryButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    secondaryButtonText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        width: '100%',
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
    },
    summaryContainer: {
        width: '100%',
        marginBottom: 24,
        gap: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    summaryText: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '500',
    },
    loadingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 20,
        marginBottom: 8,
    },
    loadingDesc: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
});

export default KycScreen;
