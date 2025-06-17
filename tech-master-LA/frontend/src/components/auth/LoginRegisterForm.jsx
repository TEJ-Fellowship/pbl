import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
const LoginRegisterForm = ({ isLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add your authentication logic here
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username (Register only) */}
        {!isLogin && (
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              autoComplete="current-username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-300"
              required={!isLogin}
            />
          </div>
        )}

        {/* Email */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Mail className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            autoComplete="current-email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-300"
            required
          />
        </div>

        {/* Password */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-300"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Confirm Password (Register only) */}
        {!isLogin && (
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-300"
              required={!isLogin}
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg hover:shadow-red-500/25"
        >
          <span>{isLogin ? "Sign In" : "Create Account"}</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
        </button>

        {/* Terms (Register only) */}
        {!isLogin && (
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            By creating an account, you agree to our{" "}
            <button className="text-red-500 hover:underline">
              Terms of Service
            </button>{" "}
            and{" "}
            <button className="text-red-500 hover:underline">
              Privacy Policy
            </button>
          </p>
        )}
      </form>
    </>
  );
};

export default LoginRegisterForm;
