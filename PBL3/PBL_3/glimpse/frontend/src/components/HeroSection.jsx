import { RotateCcw, Video, Play, User, Upload, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import clipService from "../services/clip";

const HeroSection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [status, setStatus] = useState({ message: "", type: "" });
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const showStatus = (message, type = "info", duration = 5000) => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: "", type: "" }), duration);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      const videoUrl = URL.createObjectURL(file);
      setSelectedVideo(videoUrl);
      setUploadSuccess(false);
      showStatus("Video selected! Choose to upload or cancel.", "info");
    } else {
      showStatus("Please select a valid video file.", "error");
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    setSelectedVideo(null);
    setUploadSuccess(false);
    setStatus({ message: "", type: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadToCloudinary = async () => {
    if (!selectedFile || isUploading) return;

    try {
      setIsUploading(true);
      showStatus("Uploading video... ⏳", "info");

      // Use the service to upload
      const result = await clipService.uploadFile(selectedFile);

      console.log("Upload successful:", result);
      setUploadSuccess(true);
      showStatus("🎉 Video uploaded successfully!", "success", 8000);

      // Reset after successful upload
      setTimeout(() => {
        cancelSelection();
      }, 3000);
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message;
      showStatus(`❌ Upload failed: ${errorMessage}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Status Component
  const StatusComponent = ({ status }) => {
    if (!status.message) return null;
    const baseClasses =
      "mt-4 p-3 rounded-lg text-center font-medium transition-all duration-300";
    const typeClasses = {
      success: "bg-green-900/30 text-green-300 border-2 border-green-500/50",
      error: "bg-red-900/30 text-red-300 border-2 border-red-500/50",
      info: "bg-blue-900/30 text-blue-300 border-2 border-blue-500/50",
    };
    return (
      <div
        className={`${baseClasses} ${
          typeClasses[status.type] || typeClasses.info
        }`}
      >
        <span className="text-lg">{status.message}</span>
      </div>
    );
  };

  return (
<div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 rounded-3xl p-8 text-white relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Video size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">
          Capture Today's Glimpse
        </h2>
        <p className="text-center text-violet-100 mb-6">
          Share your one-second moment today!
        </p>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="video/*"
          className="hidden"
        />

        {/* Show selected video preview if available */}
        {selectedVideo && (
          <div className="mb-6 bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm border border-slate-600/50">
            <video
              src={selectedVideo}
              className="w-full h-80 md:h-96 lg:h-[500px] xl:h-[600px] object-contain rounded-lg mb-4 bg-slate-900"
              controls
            />
            <div className="flex justify-center gap-3">
              {!uploadSuccess ? (
                <>
                  <button
                    onClick={uploadToCloudinary}
                    disabled={isUploading}
                    className={`${
                      isUploading
                        ? "bg-slate-600 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    } text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Upload Video</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={cancelSelection}
                    disabled={isUploading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-green-300 font-semibold mb-2">
                    ✅ Upload Successful!
                  </div>
                  <button
                    onClick={cancelSelection}
                    className="bg-slate-700/70 hover:bg-slate-600/70 text-white px-4 py-2 rounded-lg text-sm border border-slate-500/50"
                  >
                    Upload Another
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!selectedVideo && (
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate("/capture")}
              className="bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2 border border-slate-600/50"
            >
              <Play size={18} />
              <span>Go to Capture</span>
            </button>
            <button
              onClick={openFileSelector}
              className="bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2 border border-slate-600/50"
            >
              <Upload size={18} />
              <span>Upload Video</span>
            </button>
          </div>
        )}

        {/* Status Messages */}
        <StatusComponent status={status} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
    </div>
  );
};

export default HeroSection;