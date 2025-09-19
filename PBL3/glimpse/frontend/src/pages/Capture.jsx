import { Video, Play, Upload } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import clipService from "../services/clip";

const Capture = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [recordedFile, setRecordedFile] = useState(null);
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [debugInfo, setDebugInfo] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  const [viewMode, setViewMode] = useState("live"); // 'live' for camera, 'recorded' for recorded video

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [stream, recordingTimer]);

  // Handle view mode changes
  useEffect(() => {
    if (videoRef.current) {
      if (viewMode === "live" && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = "";
        videoRef.current.play();
      } else if (viewMode === "recorded" && recordedVideo) {
        videoRef.current.srcObject = null;
        videoRef.current.src = recordedVideo;
      }
    }
  }, [viewMode, stream, recordedVideo]);

  const showStatus = (message, type = "info") => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: "", type: "" }), 5000);
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const testCamera = async () => {
    try {
      showStatus("Testing camera access...", "info");
      setDebugInfo(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser");
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const debugData = {
        totalDevices: devices.length,
        videoDevices: videoDevices.length,
        hasCamera: videoDevices.length > 0,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
      };
      setDebugInfo(debugData);
      if (videoDevices.length === 0) {
        throw new Error("No camera devices found");
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
      setStream(newStream);
      showStatus("Camera access successful! 📹", "success");
    } catch (error) {
      console.error("Camera test failed:", error);
      showStatus(`Camera access failed: ${error.message}`, "error");
      let solutions = [];
      if (error.name === "NotAllowedError") {
        solutions.push(
          "Camera permission denied. Please allow camera access and try again."
        );
      } else if (error.name === "NotFoundError") {
        solutions.push("No camera found. Please connect a camera device.");
      } else if (!window.isSecureContext) {
        solutions.push(
          "Camera requires HTTPS or localhost. Try using https:// or run on localhost."
        );
      } else if (error.name === "NotReadableError") {
        solutions.push("Camera is already in use by another application.");
      }
      if (solutions.length > 0) {
        setDebugInfo({ error: error.message, solutions });
      }
    }
  };

  const startRecording = async () => {
    try {
      showStatus("Starting recording...", "info");

      // Get media stream (camera access handled here)
      let currentStream = stream;
      if (!currentStream) {
        // Test camera access first
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("getUserMedia is not supported in this browser");
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );

        if (videoDevices.length === 0) {
          throw new Error("No camera devices found");
        }

        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          await videoRef.current.play();
        }
        setStream(currentStream);
      }

      // Start recording timer
      setRecordingTime(0);
      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setRecordingTimer(timer);

      chunksRef.current = [];
      let mimeType = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm";
        }
      }
      mediaRecorderRef.current = new MediaRecorder(currentStream, { mimeType });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideo(videoUrl);
        showStatus(
          `Recording complete! Duration: ${formatRecordingTime(
            recordingTime
          )} - File size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
          "success"
        );
        // Save file for upload
        const file = new File([blob], "recorded.webm", { type: mimeType });
        setRecordedFile(file);

        // Automatically switch to recorded video view
        setViewMode("recorded");

        // Clear timer
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      showStatus("Recording started! 🔴", "success");
    } catch (error) {
      console.error("Recording failed:", error);
      showStatus(`Camera/Recording failed: ${error.message}`, "error");
      setIsRecording(false);

      // Clear timer if error occurs
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      // Show error solutions
      let solutions = [];
      if (error.name === "NotAllowedError") {
        solutions.push(
          "Camera permission denied. Please allow camera access and try again."
        );
      } else if (error.name === "NotFoundError") {
        solutions.push("No camera found. Please connect a camera device.");
      } else if (!window.isSecureContext) {
        solutions.push(
          "Camera requires HTTPS or localhost. Try using https:// or run on localhost."
        );
      } else if (error.name === "NotReadableError") {
        solutions.push("Camera is already in use by another application.");
      }

      if (solutions.length > 0) {
        setDebugInfo({ error: error.message, solutions });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      showStatus("Stopping recording...", "info");

      // Clear timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      showStatus("Uploading video...", "info");

      // Upload using your backend service
      const result = await clipService.uploadFile(file);

      if (result.success) {
        showStatus("Video uploaded successfully! ✅", "success");
        console.log("Upload result:", result);

        // Wait a moment to show success message, then reload page
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showStatus(
          `Upload failed: ${result.error || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Upload failed:", error);
      showStatus(`Upload failed: ${error.message}`, "error");
    }
  };

  const StatusComponent = ({ status }) => {
    if (!status.message) return null;
    const baseClasses = "mt-4 p-3 rounded-lg text-center font-medium";
    const typeClasses = {
      success: "bg-green-50 text-green-700 border border-green-200",
      error: "bg-red-50 text-red-700 border border-red-200",
      info: "bg-blue-50 text-blue-700 border border-blue-200",
    };
    return (
      <div
        className={`${baseClasses} ${
          typeClasses[status.type] || typeClasses.info
        }`}
      >
        {status.message}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar - Full height */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Recording Content */}
        <main className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div className="w-full max-w-4xl">
            {/* Hero Section */}
            <div className="text-center mb-2">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Capture Today's Glimpse
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Share your one-second moment today!
              </p>
            </div>

            {/* Video Preview Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="relative mb-6">
                <video
                  ref={videoRef}
                  className="w-full h-80 bg-gray-900 rounded-xl object-cover"
                  muted={viewMode === "live"}
                  playsInline
                  controls={
                    viewMode === "recorded" ||
                    (!!recordedVideo && !isRecording && viewMode === "live")
                  }
                  src={
                    viewMode === "recorded" && recordedVideo
                      ? recordedVideo
                      : undefined
                  }
                />
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    REC {formatRecordingTime(recordingTime)}
                  </div>
                )}
                {viewMode === "recorded" && (
                  <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Recorded Video
                  </div>
                )}
                {!stream && !recordedVideo && !isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-xl">
                    <div className="text-center text-gray-400">
                      <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">
                        Click "Start Recording" to begin
                      </p>
                      <p className="text-sm mt-2 opacity-75">
                        Camera access will be requested
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* View Toggle Buttons - only show if we have a recorded video */}
              {recordedVideo && (
                <div className="flex justify-center gap-2 mb-4">
                  <button
                    onClick={() => setViewMode("live")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ${
                      viewMode === "live"
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    📹 Live Camera
                  </button>
                  <button
                    onClick={() => setViewMode("recorded")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ${
                      viewMode === "recorded"
                        ? "bg-purple-500 text-white shadow-md"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    🎬 Recorded Video
                  </button>
                </div>
              )}

              {/* Main Action Buttons */}
              <div className="flex justify-center gap-4 mb-6">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition duration-300 flex items-center gap-3 shadow-lg"
                  >
                    <Play className="w-5 h-5" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-8 rounded-xl transition duration-300 flex items-center gap-3 shadow-lg"
                  >
                    ⏹️ Stop Recording
                  </button>
                )}

                {recordedFile && (
                  <>
                    <button
                      onClick={() => uploadToCloudinary(recordedFile)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-8 rounded-xl transition duration-300 flex items-center gap-3 shadow-lg"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Video
                    </button>
                    <a
                      href={recordedVideo}
                      download="glimpse-recording.webm"
                      className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-xl transition duration-300 flex items-center gap-3 shadow-lg"
                    >
                      📥 Download
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Status Messages */}
            <StatusComponent status={status} />

            {/* Debug Info (only show when there's an error) */}
            {debugInfo && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mt-6">
                <h3 className="font-semibold text-red-800 mb-3">
                  Troubleshooting Information:
                </h3>
                {debugInfo.solutions && (
                  <div className="mb-4">
                    <p className="text-red-700 font-medium mb-2">
                      Possible solutions:
                    </p>
                    <ul className="list-disc list-inside text-red-600 space-y-1">
                      {debugInfo.solutions.map((solution, index) => (
                        <li key={index} className="text-sm">
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <details className="mt-4">
                  <summary className="text-red-700 font-medium cursor-pointer">
                    Technical Details
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 overflow-x-auto bg-red-100 p-3 rounded-lg">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Debug Info (only show when there's an error) */}
            {debugInfo && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Debug Information:
                </h3>
                <pre className="text-sm text-gray-600 overflow-x-auto bg-gray-50 p-4 rounded-lg">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Capture;
