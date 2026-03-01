import LoginScreen from '@/app/_auth/LoginScreen'

// Vendor Login Screen Wrapper
const VendorLoginScreen = () => {
    return (
        <LoginScreen 
            role='vendor'
            signupRoute='/screens/vendor/VendorSignupScreen'
            homeScreenRoute='/screens/vendor/VendorHomeScreen'
        />
    )
}

export default VendorLoginScreen
