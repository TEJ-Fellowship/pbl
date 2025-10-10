import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Film,
  Download,
  Share2,
  Calendar,
  Play,
} from "lucide-react";

function StaticMontage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-[#0f0b1a] via-[#1a0f2e] to-[#0f0b1a] min-h-screen text-white">
      <div className="container mx-auto px-6 py-8 mt-12 pt-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Monthly Montages
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your daily moments into cinematic highlights. Generate,
            preview, and share your monthly video compilations.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Select Month
              </h3>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />

              <button
                onClick={() => navigate("/login")}
                className="w-full mt-4 flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text- font-semibold py-4 rounded-xl transition duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg"
              >
                <Film className="w-5 h-5" />
                Generate Montage
              </button>
            </div>
            <div className="space-y-3">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Download MP4
              </a>
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition"
              >
                <Share2 className="w-4 h-4" />
                Share Montage
              </button>
            </div>
          </div>
          {/* right Panel */}
          <div className="lg:w-[55%]">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 h-[250px] mt-8">
              <h3 className="text-2xl font-semibold mb-6 text-center">
                Your Montage Will Appear Here
              </h3>
              <Play className="mx-auto" size={52} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaticMontage;
