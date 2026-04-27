import ForgotPasswordScreen from '@/app/_auth/ForgotPasswordScreen'

// Vendor Forgot Password Screen Wrapper
const VendorForgotPasswordScreen = () => {
    return (
        <ForgotPasswordScreen
            role='vendor'
            loginRoute='/screens/vendor/VendorLoginScreen'
        />
    )
}

export default VendorForgotPasswordScreen
