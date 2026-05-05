import VerificationScreen from '@/app/_auth/VerificationScreen'

// Client Verification Screen Wrapper
const ClientVerificationScreen = () => {
    return (
        <VerificationScreen 
            role='client'
            loginRoute='/screens/client/Component/LoginScreen'
        />
    )
}

export default ClientVerificationScreen
