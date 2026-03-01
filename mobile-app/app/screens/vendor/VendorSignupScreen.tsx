import SignupScreen from '@/app/_auth/SignupScreen'

// Vendor Signup Screen Wrapper
const VendorSignupScreen = () => {
    return (
        <SignupScreen 
            role='vendor'
            loginRoute='/screens/vendor/VendorLoginScreen'
        />
    )
}

export default VendorSignupScreen
