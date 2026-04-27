import ForgotPasswordScreen from '@/app/_auth/ForgotPasswordScreen'

// Client Forgot Password Screen Wrapper
const ClientForgotPasswordScreen = () => {
    return (
        <ForgotPasswordScreen
            role='client'
            loginRoute='/screens/client/Component/LoginScreen'
        />
    )
}

export default ClientForgotPasswordScreen
