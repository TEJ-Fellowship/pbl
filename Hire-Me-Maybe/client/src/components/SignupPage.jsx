import Signup from './Signup';

const SignupPage = ({ onSignup, onBackToHome, onGoToLogin }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Back to Home Button */}
                <div className="mb-6">
                    <button
                        onClick={onBackToHome}
                        className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Home
                    </button>
                </div>

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            Hire Me Maybe
                        </div>
                    </div>
                </div>

                {/* Page Title */}
                <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
                    Create your account
                </h2>
                <p className="text-center text-sm text-gray-600 mb-8">
                    Join thousands of professionals who use our AI-powered resume builder
                </p>
            </div>

            {/* Signup Form */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <Signup onSignup={onSignup} />

                    {/* Login link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={onGoToLogin}
                                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                            >
                                Sign in here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage; 