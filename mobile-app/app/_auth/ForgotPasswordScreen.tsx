import { Colors } from '@/app/_constants/theme'
import { forgotPassword } from '@/app/_utils/authApi'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TextInput } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ForgotPasswordScreenProps {
    role?: 'client' | 'vendor'
    loginRoute?: string
}

const ForgotPasswordScreen = ({
    role = 'client',
    loginRoute = '/screens/client/Component/LoginScreen',
}: ForgotPasswordScreenProps) => {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const params = useLocalSearchParams()

    const userRole = (params.role as 'client' | 'vendor') || role
    const redirectLoginRoute = (params.loginRoute as string) || loginRoute

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
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
            await forgotPassword({ email: email.trim().toLowerCase() })
            Alert.alert('Success', 'If your account exists, reset instructions have been sent to your email.', [
                {
                    text: 'Back to Login',
                    onPress: () => router.push(redirectLoginRoute as any),
                },
            ])
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to send reset instructions right now.'
            Alert.alert('Error', message)
        } finally {
            setLoading(false)
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
                    <View style={styles.headerContainer}>
                        <Text style={styles.appTitle}>Assan Taqreeb</Text>
                        <Text style={styles.subtitle}>{userRole === 'vendor' ? 'Vendor Password Reset' : 'Reset Your Password'}</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.infoText}>Enter your registered email and we will send password reset instructions.</Text>

                        <TextInput
                            placeholder='Email Address'
                            style={styles.input}
                            mode='outlined'
                            outlineColor='#ddd'
                            activeOutlineColor='#4F46E5'
                            left={<TextInput.Icon icon='email' />}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType='email-address'
                            autoCapitalize='none'
                            autoCorrect={false}
                            editable={!loading}
                        />

                        <Pressable
                            onPress={handleSubmit}
                            disabled={loading}
                            style={{ backgroundColor: loading ? '#9CA3AF' : Colors.primary }}
                            className='w-4/5 self-center py-4 rounded-lg mt-4'
                        >
                            <Text className='text-center text-white font-semibold text-xl'>
                                {loading ? 'SENDING...' : 'SEND RESET LINK'}
                            </Text>
                        </Pressable>
                    </View>

                    <View className='mt-5 self-center'>
                        <Text className='text-base'>Remember your password? <Pressable onPress={() => router.push(redirectLoginRoute as any)}><Text className='text-indigo-600 font-medium underline'>Login Here</Text></Pressable></Text>
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
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    appTitle: {
        fontSize: 36,
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
    },
    infoText: {
        color: '#6B7280',
        marginBottom: 16,
        textAlign: 'center',
        fontSize: 14,
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        fontSize: 14,
    },
})
