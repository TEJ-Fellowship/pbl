import backgroundImage from '../assets/bg1.png';
import { useNavigate, Link } from 'react-router-dom';
export default function LandingPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Navbar */}
            <header className="flex items-center justify-between px-8 py-4 shadow-sm">
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-black rounded-full" />
                    <span className="font-bold text-lg">ResumeOptimizer</span>
                </div>

                <nav className="hidden md:flex space-x-6 text-gray-600 font-medium ">
                    <Link to="/home" className="hover:text-blue-600 ml-[990px]">
                        Upload
                    </Link>

                    <Link to="/resume" className="hover:text-blue-600">
                        My Resume
                    </Link>
                </nav>

                <div className="flex space-x-3">
                    <button onClick={() => navigate("/login", { state: { initialForm: "login" } })}
                        className="px-5 py-1 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                        Login
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative flex-grow flex items-center justify-center px-6 py-12">
                <div className="relative max-w-4xl w-full aspect-video rounded-xl overflow-hidden shadow-md text-center md:text-left">
                    {/* Background image */}
                    <img
                        src={backgroundImage}
                        alt="Background"
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center p-8 space-y-6 text-center min-h-screen">
                        <h1 className="text-4xl md:text-3xl font-extrabold text-gray-900">
                            Craft a Resume That Gets You Hired
                        </h1>
                        <p className="text-lg text-gray-700">
                            Optimize your resume with our AI-powered tools to stand out from the
                            competition.
                        </p>
                        <button onClick={() => navigate("/signup", { state: { initialForm: "signup" } })} className="px-6 py-3 ml-12 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                            Get Started
                        </button>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-gray-500 text-sm border-t">
                <p>© 2025 ResumeOptimizer. All rights reserved.</p>
            </footer>
        </div>
    );
}
