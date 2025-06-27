import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Code,
  Github,
  Users,
  Star,
} from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    const result = await register(formData);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleGitHubRegister = () => {
    window.location.href = `${
      import.meta.env.VITE_API_URL || "http://localhost:5001"
    }/api/auth/github`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Panel - Registration Form */}
      <div className="flex flex-col justify-center px-4 w-full sm:px-6 lg:px-8 xl:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center">
            <div className="flex justify-center items-center mx-auto w-12 h-12 rounded-xl bg-primary-600">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join the TEJ Bootcamp project showcase
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <div className="flex items-center p-4 space-x-3 text-red-600 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* GitHub OAuth Register */}
            <button
              onClick={handleGitHubRegister}
              className="flex relative justify-center items-center px-6 py-3 w-full text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <Github className="w-5 h-5 text-gray-700" />
              <span className="mx-3">Continue with GitHub</span>
            </button>

            <div className="relative">
              <div className="flex absolute inset-0 items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="flex relative justify-center text-sm">
                <span className="px-2 text-gray-500 bg-gray-50">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="px-4 py-3 pl-10 w-full text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

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
                    required
                    className="px-4 py-3 pl-10 w-full text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
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
                    required
                    className="px-4 py-3 pl-10 w-full text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="px-4 py-3 pl-10 w-full text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex relative justify-center items-center px-6 py-3 w-full text-base font-medium text-white rounded-lg bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                    <span className="ml-2">Creating Account...</span>
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="space-y-2 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Sign in
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
        <div className="flex relative justify-center items-center h-full bg-gradient-to-br from-primary-500 to-primary-700">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z' fill='rgba(255,255,255,0.07)'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
          ></div>
          <div className="relative px-8 text-center text-white">
            <div>
              <h2 className="text-3xl font-bold">Join Our Community</h2>
              <p className="mt-4 text-lg text-white/90">
                Showcase your projects, collaborate with peers, and grow your
                skills with TEJ Bootcamp.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="p-6 text-left rounded-xl backdrop-blur-sm bg-white/10">
                <div className="flex items-center mb-3">
                  <Code className="mr-2 w-5 h-5" />
                  <h3 className="text-lg font-semibold">Project Showcase</h3>
                </div>
                <p className="text-sm text-white/80">
                  Share your work with the community and get valuable feedback
                  from peers.
                </p>
              </div>
              <div className="p-6 text-left rounded-xl backdrop-blur-sm bg-white/10">
                <div className="flex items-center mb-3">
                  <Users className="mr-2 w-5 h-5" />
                  <h3 className="text-lg font-semibold">Collaboration</h3>
                </div>
                <p className="text-sm text-white/80">
                  Connect with fellow developers and work together on exciting
                  projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
