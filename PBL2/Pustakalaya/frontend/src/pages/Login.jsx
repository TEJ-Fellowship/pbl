import { useState } from "react";

const Login = ({ onSwitchToSignUp, onGoogleAuth, onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email.");
      return;
    }

    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    console.log("Login valid!", { email, password });
    onAuthSuccess?.();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">
          Log in to your account
        </h1>
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToSignUp}
            className="text-blue-700 font-medium hover:underline"
          >
            Sign up
          </button>
        </p>
        <button
          type="button"
          onClick={onGoogleAuth}
          className="w-full flex items-center justify-center gap-3 border border-terracotta/20 bg-white text-gray-700 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer my-4"
        >
          Login with Google
        </button>

        <div className="my-4 flex items-center">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="px-3 text-xs text-gray-500">
            Or with email and password
          </span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        <form onSubmit={handleSubmit} >
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-16 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 text-sm text-red-600">{errorMessage}</div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-700 text-white py-2 text-sm font-medium rounded-lg hover:bg-blue-900 cursor-pointer"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
