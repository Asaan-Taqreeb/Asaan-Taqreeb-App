import VerificationScreen from '@/app/_auth/VerificationScreen'

// Vendor Verification Screen Wrapper
const VendorVerificationScreen = () => {
    return (
        <VerificationScreen 
            role='vendor'
            loginRoute='/screens/vendor/VendorLoginScreen'
        />
    )
}

export default VendorVerificationScreen
