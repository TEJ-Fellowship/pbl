import Navbar from './Navbar';

const LandingPage = ({ onLoginClick, onGetStartedClick }) => {
    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <Navbar onLoginClick={onLoginClick} onGetStartedClick={onGetStartedClick} />

            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                    <div className="text-center">
                        {/* Main Heading */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
                            Optimize Your Resume with AI
                        </h1>

                        {/* Subheading */}
                        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
                            Get personalized resume analysis, job-tailored versions, and smart job recommendations powered by advanced AI technology.
                        </p>

                        {/* CTA Button */}
                        <div className="flex justify-center mb-8 sm:mb-12">
                            <button
                                onClick={onGetStartedClick}
                                className="bg-black hover:bg-gray-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Start Optimizing Now
                            </button>
                        </div>
                    </div>


                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="py-12 sm:py-16 lg:py-20 bg-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8 sm:mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Powerful Features
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Feature 1 - Resume Analysis */}
                        <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="text-center mb-4 sm:mb-6">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Resume Analysis</h3>
                                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                                    Upload your resume and get AI-powered insights on skills, experience, and formatting
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 text-sm sm:text-base">Skills gap analysis</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 text-sm sm:text-base">Keyword optimization</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 text-sm sm:text-base">Format improvements</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 - Job-Tailored Resumes */}
                        <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="text-center mb-4 sm:mb-6">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Job-Tailored Resumes</h3>
                                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                                    Generate customized resume versions for specific job applications
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 text-sm sm:text-base">Job-specific customization</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 text-sm sm:text-base">Side-by-side comparison</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 text-sm sm:text-base">Multiple versions</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 - Job Recommendations */}
                        <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="text-center mb-4 sm:mb-6">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M10,2L8,4H5A2,2 0 0,0 3,6V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V6A2,2 0 0,0 19,4H16L14,2H10M5,6H19V19H5V6M12,7A3,3 0 0,0 9,10A3,3 0 0,0 12,13A3,3 0 0,0 15,10A3,3 0 0,0 12,7M7,16A1,1 0 0,0 6,17A1,1 0 0,0 7,18H17A1,1 0 0,0 18,17A1,1 0 0,0 17,16H7Z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Job Recommendations</h3>
                                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                                    Discover perfect job matches based on your skills and preferences
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 text-sm sm:text-base">AI-powered matching</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 text-sm sm:text-base">Match percentages</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 text-sm sm:text-base">Personalized suggestions</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action Section */}
            <div className="py-12 sm:py-16 lg:py-20 bg-blue-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                        Ready to Land Your Dream Job?
                    </h2>
                    <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
                        Join thousands of professionals who've optimized their resumes with AI
                    </p>
                    <button
                        onClick={onGetStartedClick}
                        className="bg-white hover:bg-gray-100 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Get Started Free
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage; 