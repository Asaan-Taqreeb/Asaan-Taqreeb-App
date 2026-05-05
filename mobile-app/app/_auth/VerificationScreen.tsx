import { Colors } from '@/app/_constants/theme'
import { verifyEmail, resendVerificationOtp } from '@/app/_utils/authApi'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TextInput } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AppLogo from '../screens/client/Component/AppLogo'

interface VerificationScreenProps {
    email?: string
    role?: 'client' | 'vendor'
    loginRoute?: string
}

const VerificationScreen = ({
    email: propEmail,
    role = 'client',
    loginRoute = '/screens/client/Component/LoginScreen',
}: VerificationScreenProps) => {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const params = useLocalSearchParams()

    const userEmail = (params.email as string) || propEmail || ''
    const userRole = (params.role as 'client' | 'vendor') || role
    const redirectLoginRoute = (params.loginRoute as string) || loginRoute

    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [timer, setTimer] = useState(60)

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [timer])

    const handleVerify = async () => {
        if (otp.length < 6) {
            Alert.alert('Error', 'Please enter the 6-digit verification code')
            return
        }

        setLoading(true)
        try {
            const response = await verifyEmail({ email: userEmail.trim().toLowerCase(), otp: otp.trim() })
            Alert.alert('Success', 'Email verified successfully! You can now login.', [
                { text: 'Login', onPress: () => router.push(redirectLoginRoute as any) }
            ])
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Verification failed.'
            Alert.alert('Error', message)
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (timer > 0) return

        setResending(true)
        try {
            await resendVerificationOtp({ email: userEmail.trim().toLowerCase() })
            setTimer(60)
            Alert.alert('Success', 'Verification code resent successfully.')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to resend code.'
            Alert.alert('Error', message)
        } finally {
            setResending(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps='handled'>
                    {/* Header Section */}
                    <View style={styles.headerContainer}>
                        <AppLogo size="small" showText={false} />
                        <Text style={styles.appTitle}>Verify <Text style={{color: Colors.primary}}>Email</Text></Text>
                        <Text style={styles.subtitle}>Check your inbox for the code</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.infoText}>
                            We've sent a 6-digit verification code to {'\n'}
                            <Text style={{ fontWeight: '700', color: '#1F2937' }}>{userEmail}</Text>
                        </Text>

                        {params.otp && (
                            <View style={{ backgroundColor: '#EEF2FF', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#C7D2FE' }}>
                                <Text style={{ color: '#4338CA', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
                                    Debug Mode: Your OTP is {params.otp}
                                </Text>
                            </View>
                        )}

                        <TextInput
                            placeholder='Enter 6-digit code'
                            style={styles.input}
                            mode='outlined'
                            outlineColor='#ddd'
                            activeOutlineColor={Colors.primary}
                            left={<TextInput.Icon icon='shield-check' />}
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType='number-pad'
                            maxLength={6}
                            autoCapitalize='none'
                            editable={!loading}
                        />

                        <Pressable
                            onPress={handleVerify}
                            disabled={loading}
                            style={[styles.button, { backgroundColor: loading ? '#9CA3AF' : Colors.primary }]}
                        >
                            <Text style={styles.buttonText}>{loading ? 'VERIFYING...' : 'VERIFY'}</Text>
                        </Pressable>

                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>Didn't receive the code? </Text>
                            <Pressable onPress={handleResend} disabled={timer > 0 || resending}>
                                <Text style={[
                                    styles.resendLink, 
                                    { color: timer > 0 || resending ? '#9CA3AF' : Colors.primary }
                                ]}>
                                    {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    <View className='mt-8 self-center'>
                        <Pressable onPress={() => router.push(redirectLoginRoute as any)}>
                            <Text className='text-base text-gray-600 font-medium underline'>
                                Back to Login
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    )
}

export default VerificationScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6B7280',
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    infoText: {
        color: '#6B7280',
        marginBottom: 24,
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
    },
    input: {
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 8,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    resendText: {
        color: '#6B7280',
        fontSize: 14,
    },
    resendLink: {
        fontWeight: '700',
        fontSize: 14,
    },
})
