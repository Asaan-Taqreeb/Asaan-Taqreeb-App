import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '@/app/_constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { submitKyc } from '@/app/_utils/authApi';
import { uploadToCloudinary } from '@/app/_utils/cloudinaryUpload';
import FaceCamera from '@/app/_components/FaceCamera';

type KycStep = 'instructions' | 'selfie' | 'submitting';

const KycScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [step, setStep] = useState<KycStep>('instructions');
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [livenessConfidence, setLivenessConfidence] = useState(0);

    const handleSelfieCapture = async (uri: string, confidence: number) => {
        setSelfieImage(uri);
        setLivenessConfidence(confidence);
        await handleSubmit(uri, confidence);
    };

    const handleSubmit = async (uri: string, confidence: number) => {
        setStep('submitting');
        try {
            console.log('Uploading Selfie to Cloudinary...');
            const selfieUrl = await uploadToCloudinary(uri);

            console.log('Submitting KYC data to backend...');
            await submitKyc({
                selfieImage: selfieUrl,
                livenessConfidence: confidence
            });

            Alert.alert('Success', 'Your identity verification has been submitted and is under review.', [
                { text: 'Great!', onPress: () => router.replace('/') }
            ]);
        } catch (error) {
            console.error('KYC submission error:', error);
            Alert.alert('Submission Failed', 'Something went wrong while uploading your photo. Please try again.');
            setStep('instructions');
        }
    };

    if (step === 'selfie') {
        return (
            <FaceCamera 
                onCapture={handleSelfieCapture} 
                onCancel={() => setStep('instructions')} 
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
                            To prevent scams and ensure a professional experience, we require all users to verify their identity using a live selfie.
                        </Text>
                        <View style={styles.checklist}>
                            <View style={styles.checkItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                <Text style={styles.checkText}>Good lighting</Text>
                            </View>
                            <View style={styles.checkItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                <Text style={styles.checkText}>Real-time facial verification</Text>
                            </View>
                        </View>
                        <Pressable style={styles.primaryButton} onPress={() => setStep('selfie')}>
                            <Text style={styles.primaryButtonText}>TAKE A SELFIE</Text>
                        </Pressable>
                    </View>
                )}

                {step === 'submitting' && (
                    <View style={styles.stepContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingTitle}>Processing...</Text>
                        <Text style={styles.loadingDesc}>Uploading and verifying facial data. This may take a few seconds.</Text>
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
