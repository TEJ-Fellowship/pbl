import { useState } from "react";

const SignUp = ({ onSwitchToLogin, onGoogleAuth }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage(""); // clear previous error first
    setSuccessMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setSuccessMessage("Signup successful!");
    console.log("Form is valid!");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">Sign Up</h1>
        <button
          type="button"
          onClick={onGoogleAuth}
          className="w-full flex items-center justify-center gap-3 border border-terracotta/20 bg-white text-gray-700 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer my-4"
        >
          Sign up with Google
        </button>

        <div className="my-4 flex items-center">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="px-3 text-xs text-gray-500">
            Or with email and password
          </span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {errorMessage && (
            <div className="mb-4 text-sm text-red-600">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="mb-4 text-sm text-green-600">{successMessage}</div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-700 text-white py-2 text-sm font-medium rounded-lg hover:bg-blue-900 cursor-pointer"
          >
            Sign Up
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-700 font-medium hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
