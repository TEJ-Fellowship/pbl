import React from "react";

import { Lock, User } from "lucide-react";

export default function AuthForm() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
      <Card className="w-full max-w-sm p-6 bg-[#1a1a1a] border-0 rounded-2xl shadow-lg">
        <CardContent className="flex flex-col items-center">
          {/* Logo/Icon */}
          <div className="flex justify-center items-center w-12 h-12 bg-green-500 rounded-full mb-4">
            <span className="text-white text-lg font-bold">✏️</span>
          </div>

          {/* Title */}
          <h2 className="text-white text-xl font-semibold mb-2">
            Doodle Together
          </h2>
          <p className="text-gray-400 text-sm mb-6 text-center">
            Join the creative canvas and draw with friends.
          </p>

          {/* Username/Email */}
          <div className="w-full mb-3 relative">
            <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Username or Email"
              className="pl-10 bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Password */}
          <div className="w-full mb-4 relative">
            <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <Input
              type="password"
              placeholder="Password"
              className="pl-10 bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Buttons */}
          <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-medium mb-3">
            Login
          </Button>
          <Button className="w-full bg-[#2a2a2a] hover:bg-[#333] text-white font-medium">
            Signup
          </Button>

          {/* Forgot password */}
          <p className="text-gray-500 text-xs mt-4 cursor-pointer hover:underline">
            Forgot Password?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

