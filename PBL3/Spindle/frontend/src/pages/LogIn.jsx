import React, { useState } from "react"
import { useNavigate } from "react-router-dom"



function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
      const navigate = useNavigate()

    const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        // Save JWT in localStorage (or sessionStorage)
        localStorage.setItem("token", data.token)
        window.alert("Login successful!")

        localStorage.setItem("user",JSON.stringify(data.user))


        navigate("/dashboard")
      } else {
        alert(`${data.error || "Login failed"}`)
      }
    } catch (error) {
      alert("Server error, try again later")
    }
  }


    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
                    Welcome Back!
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        Log In
                    </button>
                </form>

                {/* Don’t have an account */}
                <p className="text-sm text-gray-600 text-center mt-6">
                    Don’t have an account?{" "}
                    <a href="/signUp" className="text-red-500 hover:underline font-medium">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    )
}

export default Login
