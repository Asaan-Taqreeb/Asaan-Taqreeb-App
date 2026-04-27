import SignupScreen from '@/app/_auth/SignupScreen'

// Client Signup Screen Wrapper
const ClientSignupScreen = () => {
    return (
        <SignupScreen 
            role='client'
            loginRoute='/screens/client/Component/LoginScreen'
            forgotPasswordRoute='/screens/client/Component/ForgotPasswordScreen'
        />
    )
}

export default ClientSignupScreen
