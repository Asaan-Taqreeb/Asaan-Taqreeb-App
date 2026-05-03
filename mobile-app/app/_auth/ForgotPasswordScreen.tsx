import { Colors } from '@/app/_constants/theme'
import { forgotPassword, verifyOtp, resetPassword } from '@/app/_utils/authApi'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TextInput } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ForgotPasswordScreenProps {
    role?: 'client' | 'vendor'
    loginRoute?: string
}

type Step = 'email' | 'otp' | 'reset'

const ForgotPasswordScreen = ({
    role = 'client',
    loginRoute = '/screens/client/Component/LoginScreen',
}: ForgotPasswordScreenProps) => {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const params = useLocalSearchParams()

    const userRole = (params.role as 'client' | 'vendor') || role
    const redirectLoginRoute = (params.loginRoute as string) || loginRoute

    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleEmailSubmit = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Please enter a valid email address')
            return
        }

        setLoading(true)
        try {
            const response = await forgotPassword({ email: email.trim().toLowerCase() })
            setStep('otp')
            Alert.alert('Verification Sent', response?.message || 'If your account exists, an OTP has been sent to your email.')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to send reset instructions.'
            Alert.alert('Error', message)
        } finally {
            setLoading(false)
        }
    }

    const handleOtpVerify = async () => {
        if (otp.length < 4) {
            Alert.alert('Error', 'Please enter a valid OTP')
            return
        }

        setLoading(true)
        try {
            await verifyOtp({ email: email.trim().toLowerCase(), otp: otp.trim() })
            setStep('reset')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'OTP verification failed.'
            Alert.alert('Error', message)
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordReset = async () => {
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long')
            return
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match')
            return
        }

        setLoading(true)
        try {
            await resetPassword({ 
                email: email.trim().toLowerCase(), 
                newPassword: newPassword 
            })
            Alert.alert('Success', 'Your password has been reset successfully.', [
                { text: 'Login Now', onPress: () => router.push(redirectLoginRoute as any) }
            ])
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Password reset failed.'
            Alert.alert('Error', message)
        } finally {
            setLoading(false)
        }
    }

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.appTitle}>Asaan Taqreeb</Text>
            <Text style={styles.subtitle}>
                {step === 'email' && (userRole === 'vendor' ? 'Vendor Password Reset' : 'Reset Your Password')}
                {step === 'otp' && 'Verify Your Email'}
                {step === 'reset' && 'Create New Password'}
            </Text>
        </View>
    )

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps='handled'>
                    {renderHeader()}

                    <View style={styles.formContainer}>
                        {step === 'email' && (
                            <>
                                <Text style={styles.infoText}>Enter your registered email and we will send password reset instructions.</Text>
                                <TextInput
                                    placeholder='Email Address'
                                    style={styles.input}
                                    mode='outlined'
                                    outlineColor='#ddd'
                                    activeOutlineColor={Colors.primary}
                                    left={<TextInput.Icon icon='email' />}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType='email-address'
                                    autoCapitalize='none'
                                    editable={!loading}
                                />
                                <Pressable
                                    onPress={handleEmailSubmit}
                                    disabled={loading}
                                    style={[styles.button, { backgroundColor: loading ? '#9CA3AF' : Colors.primary }]}
                                >
                                    <Text style={styles.buttonText}>{loading ? 'SENDING...' : 'SEND RESET CODE'}</Text>
                                </Pressable>
                            </>
                        )}

                        {step === 'otp' && (
                            <>
                                <Text style={styles.infoText}>Enter the OTP code sent to your email address {email}.</Text>
                                <TextInput
                                    placeholder='Enter OTP'
                                    style={styles.input}
                                    mode='outlined'
                                    outlineColor='#ddd'
                                    activeOutlineColor={Colors.primary}
                                    left={<TextInput.Icon icon='shield-check' />}
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType='number-pad'
                                    autoCapitalize='none'
                                    editable={!loading}
                                />
                                <Pressable
                                    onPress={handleOtpVerify}
                                    disabled={loading}
                                    style={[styles.button, { backgroundColor: loading ? '#9CA3AF' : Colors.primary }]}
                                >
                                    <Text style={styles.buttonText}>{loading ? 'VERIFYING...' : 'VERIFY CODE'}</Text>
                                </Pressable>
                                <Pressable onPress={() => setStep('email')} disabled={loading} className='mt-4'>
                                    <Text className='text-center text-gray-500 font-medium'>Use different email</Text>
                                </Pressable>
                            </>
                        )}

                        {step === 'reset' && (
                            <>
                                <Text style={styles.infoText}>Choose a strong password for your account.</Text>
                                <TextInput
                                    placeholder='New Password'
                                    style={styles.input}
                                    mode='outlined'
                                    outlineColor='#ddd'
                                    activeOutlineColor={Colors.primary}
                                    secureTextEntry={!showPassword}
                                    left={<TextInput.Icon icon='lock' />}
                                    right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    autoCapitalize='none'
                                    editable={!loading}
                                />
                                <TextInput
                                    placeholder='Confirm New Password'
                                    style={styles.input}
                                    mode='outlined'
                                    outlineColor='#ddd'
                                    activeOutlineColor={Colors.primary}
                                    secureTextEntry={!showPassword}
                                    left={<TextInput.Icon icon='lock-check' />}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    autoCapitalize='none'
                                    editable={!loading}
                                />
                                <Pressable
                                    onPress={handlePasswordReset}
                                    disabled={loading}
                                    style={[styles.button, { backgroundColor: loading ? '#9CA3AF' : Colors.primary }]}
                                >
                                    <Text style={styles.buttonText}>{loading ? 'RESETTING...' : 'RESET PASSWORD'}</Text>
                                </Pressable>
                            </>
                        )}
                    </View>

                    <View className='mt-8 self-center'>
                        <Text className='text-base text-gray-600'>
                            Remember your password?{' '}
                            <Text 
                                style={{ color: Colors.primary }} 
                                className='font-bold underline'
                                onPress={() => router.push(redirectLoginRoute as any)}
                            >
                                Login Here
                            </Text>
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    )
}

export default ForgotPasswordScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
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
        color: '#64748B',
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        fontSize: 14,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 1,
    },
})
