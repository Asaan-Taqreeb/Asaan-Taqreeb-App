import LoginScreen from '@/app/_auth/LoginScreen'

// Client Login Screen Wrapper
const ClientLoginScreen = () => {
    return (
        <LoginScreen 
            role='client'
            signupRoute='/screens/client/Component/SignupScreen'
            forgotPasswordRoute='/screens/client/Component/ForgotPasswordScreen'
            homeScreenRoute='/screens/client/_tabs/ClientHomeScreen'
        />
    )
}

export default ClientLoginScreen