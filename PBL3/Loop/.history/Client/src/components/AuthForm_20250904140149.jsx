import React from "react"
import { Lock, User} from "lucide-react";

export default function AuthForm() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <div className="w-full max-w-sm p-6 bg-[#1a1a1a] border-0 rounded-2xl shadow-lg">
            {/* Logo/Icon */}
            <div className="flex justify-center items-center w-12 h-12 bg-green-500 rounded-full mb-4 mx-auto">
          <span className="text-white text-lg font-bold">✏️</span>
        </div>
         {/* Title */}
        <h2 className="text-white text-xl font-semibold text-center mb-2">
          Doodle Together
        </h2>
        </div>
        </div>
    )
}