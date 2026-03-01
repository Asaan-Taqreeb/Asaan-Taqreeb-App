import LoginScreen from '@/app/_auth/LoginScreen'

// Client Login Screen Wrapper
const ClientLoginScreen = () => {
    return (
        <LoginScreen 
            role='client'
            signupRoute='/screens/client/Component/SignupScreen'
            homeScreenRoute='/screens/client/Component/OnBoardingScreen'
        />
    )
}

export default ClientLoginScreen