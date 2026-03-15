import React, { useState, useRef, useEffect } from "react";
import { FiMic, FiStopCircle, FiUpload, FiRefreshCw } from "react-icons/fi";
import uploadClip from "../api/clipApi";

const Recorder = ({ onSave, roomId }) => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const animationRef = useRef(null);

  // Waveform animation state
  const [waveformBars, setWaveformBars] = useState(
    Array.from({ length: 12 }, () => Math.random() * 0.5 + 0.2)
  );

  // Animate waveform during recording
  useEffect(() => {
    if (recording) {
      const animateWaveform = () => {
        setWaveformBars((prev) => prev.map(() => Math.random() * 0.8 + 0.2));
        animationRef.current = requestAnimationFrame(animateWaveform);
      };
      animateWaveform();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setWaveformBars(Array.from({ length: 12 }, () => 0.2));
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [recording]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      alert("Please allow microphone access.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleUpload = async () => {
    if (!audioBlob) return alert("No recording yet!");

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 150);

    try {
      const token = localStorage.getItem("token");
      const newClip = await uploadClip(audioBlob, token, roomId);

      setUploadProgress(100);
      setTimeout(() => {
        if (onSave) onSave(newClip);
        resetRecording();
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      alert("Upload failed");
      console.error(err);
      setIsUploading(false);
      setUploadProgress(0);
    }

    clearInterval(progressInterval);
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setSeconds(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      clearInterval(timerRef.current);
    } catch (e) {}
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const recordProgress = seconds > 0 ? (seconds / 300) * 100 : 0; // Max 5 mins

  return (
    <div
      className="w-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 
                  backdrop-blur-sm rounded-2xl border border-white/10 
                  shadow-xl p-4 flex flex-col items-center gap-4"
    >
      {/* Header */}
      <div className="text-center mb-8 mt-10">
        <h2 className="flex items-center justify-center text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          <FiMic className="mr-3 text-4xl text-indigo-400" />
          Confess Live
        </h2>
        <p className="text-gray-400 text-sm">Share your thoughts anonymously</p>
      </div>

      {/* Recording Status */}
      {recording && (
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center relative overflow-hidden">
              {/* Pulsing rings */}
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
              <div className="absolute inset-2 rounded-full bg-red-500/20 animate-ping animation-delay-300"></div>

              {/* Circular progress */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 45 * (1 - recordProgress / 100)
                  }`}
                  className="transition-all duration-1000"
                />
              </svg>

              <FiMic className="text-white text-2xl z-10 animate-pulse" />
            </div>

            <div className="mt-4">
              <div className="text-2xl font-mono font-bold text-red-400 mb-1">
                {formatTime(seconds)}
              </div>
              <div className="text-sm text-red-300">Recording...</div>
            </div>
          </div>
        </div>
      )}

      {/* Waveform Visualization */}
      <div className="flex items-end justify-center gap-1 h-20 mb-8 px-4">
        {waveformBars.map((height, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-150"
            style={{
              height: `${height * 60}px`,
              opacity: recording ? 0.8 : 0.3,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center mb-8">
        {!recording ? (
          <button
            onClick={startRecording}
            className="group relative w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center"
          >
            <FiMic className="text-white text-3xl group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-110 transition-transform duration-300"></div>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="group relative w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-full shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center"
          >
            <FiStopCircle className="text-white text-3xl group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-110 transition-transform duration-300"></div>
          </button>
        )}
      </div>

      {/* Audio Playback */}
      {audioURL && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
          <audio
            ref={audioRef}
            src={audioURL}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={togglePlayback}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-white rounded-full"></div>
                  <div className="w-1 h-4 bg-white rounded-full"></div>
                </div>
              ) : (
                <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
              )}
            </button>

            <div className="flex-1">
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 flex items-center justify-center gap-3 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{Math.round(uploadProgress)}%</span>
                </>
              ) : (
                <>
                  <FiUpload className="text-lg" />
                  <span>Upload</span>
                </>
              )}
            </button>

            <button
              onClick={resetRecording}
              disabled={isUploading}
              className="flex items-center justify-center gap-3 py-3 px-6 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl font-medium transition-all duration-300 hover:scale-105 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className="text-lg" />
              <span>Re-record</span>
            </button>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mt-4">
              <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Particles Effect */}
      {recording && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-indigo-400 rounded-full opacity-30 animate-ping"
              style={{
                left: `${20 + i * 12}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 300}ms`,
                animationDuration: "2s",
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes animation-delay-300 {
          0%,
          70% {
            opacity: 0;
            transform: scale(1);
          }
          100% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
};

export default Recorder;
