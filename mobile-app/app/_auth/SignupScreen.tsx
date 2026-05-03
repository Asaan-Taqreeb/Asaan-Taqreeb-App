import { Colors } from '@/app/_constants/theme'
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { TextInput } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { registerUser } from '@/app/_utils/authApi'
import AppLogo from '../screens/client/Component/AppLogo'

interface SignupScreenProps {
    role?: 'client' | 'vendor'
    loginRoute?: string
    forgotPasswordRoute?: string
}

const SignupScreen = ({ 
    role = 'client', 
    loginRoute = '/screens/client/Component/LoginScreen',
    forgotPasswordRoute = '/screens/client/Component/ForgotPasswordScreen'
}: SignupScreenProps) => {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const params = useLocalSearchParams()
    
    // Allow role to be passed via route params or props
    const userRole = (params.role as 'client' | 'vendor') || role
    const redirectLoginRoute = (params.loginRoute as string) || loginRoute
    const redirectForgotPasswordRoute = (params.forgotPasswordRoute as string) || forgotPasswordRoute

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleSignup = async () => {
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert('Error', 'Please fill in all fields')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Please enter a valid email address')
            return
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match')
            return
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            console.log('Starting registration...', { email: email.trim().toLowerCase(), role: userRole })
            
            const result = await registerUser({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                role: userRole
            })
            
            console.log('Registration successful:', result)
            Alert.alert('Success', 'Account created successfully! Please login.')
            router.push(redirectLoginRoute as any)
        } catch (error) {
            console.error('Signup error details:', error)
            const errorMessage = error instanceof Error ? error.message : 'Network error. Please check your connection.'
            Alert.alert('Registration Failed', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const getSubtitle = () => {
        return userRole === 'vendor' ? 'Register Your Business' : 'Create Your Account'
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
                    <Text style={styles.appTitle}>Asaan<Text style={{color: Colors.primary}}>Taqreeb</Text></Text>
                    <Text style={styles.subtitle}>{getSubtitle()}</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                    <TextInput
                        placeholder='Full Name'
                        style={styles.input}
                        mode='outlined'
                        outlineColor='#ddd'
                        activeOutlineColor='#4F46E5'
                        left={<TextInput.Icon icon="account" />}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize='words'
                        editable={!loading}
                    />

                    <TextInput
                        placeholder='Email Address'
                        style={styles.input}
                        mode='outlined'
                        outlineColor='#ddd'
                        activeOutlineColor='#4F46E5'
                        left={<TextInput.Icon icon="email" />}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        autoCorrect={false}
                        editable={!loading}
                    />

                    <TextInput
                        placeholder='Password'
                        style={styles.input}
                        mode='outlined'
                        outlineColor='#ddd'
                        activeOutlineColor='#4F46E5'
                        secureTextEntry={!showPassword}
                        left={<TextInput.Icon icon="lock" />}
                        right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                        value={password}
                        onChangeText={setPassword}
                        editable={!loading}
                    />

                    <TextInput
                        placeholder='Confirm Password'
                        style={styles.input}
                        mode='outlined'
                        outlineColor='#ddd'
                        activeOutlineColor='#4F46E5'
                        secureTextEntry={!showConfirmPassword}
                        left={<TextInput.Icon icon="lock" />}
                        right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!loading}
                    />

                    {/* Signup Button - PROMINENT */}
                    <Pressable
                        onPress={handleSignup}
                        disabled={loading}
                        style={{ backgroundColor: loading ? '#9CA3AF' : Colors.primary }}
                        className='w-4/5 self-center py-4 rounded-lg mt-6'
                    >
                        <Text className='text-center text-white font-semibold text-xl'>
                            {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
                        </Text>
                    </Pressable>
                </View>

                <View className='mt-5 self-center'>
                    <Text className='text-base'>Already have an account? <Pressable onPress={() => router.push(redirectLoginRoute as any)}><Text className='text-indigo-600 font-medium underline'>Login Here</Text></Pressable></Text>
                </View>

                <View className='mt-3 self-center'>
                    <Pressable onPress={() => router.push(redirectForgotPasswordRoute as any)}>
                        <Text className='text-indigo-600 font-medium underline'>Forgot Password?</Text>
                    </Pressable>
                </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    )
}

export default SignupScreen

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
    input: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        fontSize: 14,
    },
})
