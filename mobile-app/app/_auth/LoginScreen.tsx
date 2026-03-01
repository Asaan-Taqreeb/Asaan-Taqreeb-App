import { Colors } from '@/app/_constants/theme'
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { TextInput } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { extractRoleFromAuthPayload, getCurrentUser, loginUser } from '@/app/_utils/authApi'
import { clearAuthTokens } from '@/app/_utils/authStorage'
import { useUser } from '@/app/_context/UserContext'

interface LoginScreenProps {
    role?: 'client' | 'vendor'
    signupRoute?: string
    onLoginSuccess?: (userData: any) => void
    homeScreenRoute?: string
}

const LoginScreen = ({ 
    role = 'client', 
    signupRoute = '/screens/client/Component/SignupScreen',
    onLoginSuccess,
    homeScreenRoute = '/screens/client/Component/OnBoardingScreen'
}: LoginScreenProps) => {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const params = useLocalSearchParams()
    const { setUser } = useUser()

    // Allow role to be passed via route params or props
    const userRole = (params.role as 'client' | 'vendor') || role
    const redirectSignupRoute = (params.signupRoute as string) || signupRoute
    const redirectHomeRoute = (params.homeScreenRoute as string) || homeScreenRoute

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Please enter a valid email address')
            return
        }

        setLoading(true)
        try {
            await clearAuthTokens()
            
            console.log('Starting login...', { email: email.trim().toLowerCase() })

            const data = await loginUser({
                email: email.trim().toLowerCase(),
                password,
            })
            
            console.log('Login response received:', data)

            let authenticatedRole = extractRoleFromAuthPayload(data)
            if (!authenticatedRole) {
                console.log('Role not found in login response, fetching from /me')
                const currentUser = await getCurrentUser()
                authenticatedRole = extractRoleFromAuthPayload(currentUser)
            }

            console.log('Authenticated role:', authenticatedRole, 'Expected role:', userRole)

            if (!authenticatedRole || authenticatedRole !== userRole) {
                await clearAuthTokens()
                Alert.alert('Login Failed', 'Invalid credentials or unauthorized access.')
                return
            }

            // Store user data in context
            const userPayload = data?.data ?? data
            // Handle nested user object structure
            const userInfo = userPayload?.user ?? userPayload
            const userData = {
                id: userInfo?.id || userInfo?._id,
                name: userInfo?.name,
                email: userInfo?.email,
                role: authenticatedRole,
                ...userInfo,
            }
            console.log('Setting user context with data:', userData)
            setUser(userData)

            if (onLoginSuccess) {
                onLoginSuccess(data)
            }

            router.push(redirectHomeRoute as any)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Network error. Please check your connection.'
            Alert.alert('Error', errorMessage)
            console.error('Login error:', error)
        } finally {
            setLoading(false)
        }
    }

    const getSubtitle = () => {
        return userRole === 'vendor' ? 'Vendor Login' : 'Welcome Back!'
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
                    <Text style={styles.appTitle}>Assan Taqreeb</Text>
                    <Text style={styles.subtitle}>{getSubtitle()}</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
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

                    {/* Forgot Password */}
                    <Pressable style={styles.forgotContainer}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </Pressable>

                    {/* Login Button - PROMINENT */}
                    <Pressable
                        onPress={handleLogin}
                        disabled={loading}
                        style={{ backgroundColor: loading ? '#9CA3AF' : Colors.primary }}
                        className='w-4/5 self-center py-4 rounded-lg'
                    >
                        <Text className='text-center text-white font-semibold text-xl'>
                            {loading ? 'LOGGING IN...' : 'LOGIN'}
                        </Text>
                    </Pressable>
                </View>

                <View className='mt-5 self-center'>
                    <Text className='font-medium text-lg'>OR</Text>
                </View>

                <View className='self-center pt-5'>
                    <Text className='text-base'>Don't Have An Account? <Pressable onPress={() => router.push(redirectSignupRoute as any)}><Text className='text-indigo-600 font-medium underline'>Register Now</Text></Pressable></Text>
                </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    )
}

export default LoginScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 50,
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
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        fontSize: 14,
    },
    forgotContainer: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    forgotText: {
        color: '#4F46E5',
        fontSize: 13,
        fontWeight: '600',
    },
})
