import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Github,
  Mail,
  Lock,
  AlertCircle,
  Code,
  ArrowRight,
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleGitHubLogin = () => {
    window.location.href = `${
      import.meta.env.VITE_API_URL || "http://localhost:5001"
    }/api/auth/github`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-b-2 animate-spin border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Login Form */}
      <div className="flex flex-col justify-center w-full px-4 sm:px-6 lg:px-8 xl:w-1/2">
        <div className="mx-auto w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center items-center mx-auto w-12 h-12 rounded-xl bg-primary-600 animate-scale">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to continue your coding journey
            </p>
          </div>

          <div className="mt-8 space-y-6 animate-slide-up">
            {error && (
              <div className="flex items-center p-4 space-x-3 text-red-600 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* GitHub OAuth Login */}
            <button
              onClick={handleGitHubLogin}
              className="relative flex w-full items-center justify-center px-6 py-3 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <Github className="w-5 h-5 text-gray-700" />
              <span className="mx-3">Continue with GitHub</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="pl-10 w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="pl-10 w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative flex w-full items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2">Signing in...</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="space-y-2 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Sign up
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Have an invitation?{" "}
                <Link
                  to="/accept-invite"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Accept invitation
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Feature Showcase */}
      <div className="hidden xl:block xl:w-1/2">
        <div className="relative flex items-center justify-center h-full bg-gradient-to-br from-primary-500 to-primary-700">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z' fill='rgba(255,255,255,0.07)'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
          ></div>
          <div className="relative px-8 text-center text-white">
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold">TEJ Bootcamp Platform</h2>
              <p className="mt-4 text-lg text-white/90">
                Showcase your projects, collaborate with peers, and track your
                progress in one place.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div
                className="p-6 text-left rounded-xl bg-white/10 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: "100ms" }}
              >
                <h3 className="text-lg font-semibold">Project Showcase</h3>
                <p className="mt-2 text-sm text-white/80">
                  Share your work with the community and get feedback from peers
                  and mentors.
                </p>
              </div>
              <div
                className="p-6 text-left rounded-xl bg-white/10 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: "200ms" }}
              >
                <h3 className="text-lg font-semibold">
                  Real-time Collaboration
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  Work together with your team in real-time and track progress
                  efficiently.
                </p>
              </div>
              <div
                className="p-6 text-left rounded-xl bg-white/10 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: "300ms" }}
              >
                <h3 className="text-lg font-semibold">Progress Tracking</h3>
                <p className="mt-2 text-sm text-white/80">
                  Monitor your learning journey and celebrate your achievements
                  along the way.
                </p>
              </div>
              <div
                className="p-6 text-left rounded-xl bg-white/10 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: "400ms" }}
              >
                <h3 className="text-lg font-semibold">Expert Feedback</h3>
                <p className="mt-2 text-sm text-white/80">
                  Get valuable insights from industry experts and improve your
                  skills.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
