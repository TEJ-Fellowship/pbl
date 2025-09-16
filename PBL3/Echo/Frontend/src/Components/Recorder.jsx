import React, { useState, useRef } from "react";
import uploadClip from "../api/clipApi";

const Recorder = ({ setClips, showUpload, caption, setCaption, setUpload }) => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

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
      };
      mediaRecorderRef.current.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.log("Mic access denied :", error);
    }
  };

  const stopRecording = async () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const handleUpload = async () => {
    if (!audioBlob) return alert("No recording yet!");
    try {
      const token = localStorage.getItem("token");
      const newClip = await uploadClip(audioBlob, token, caption);
      alert("Audio Uploaded");
      const clipWithOwnerFlag = { ...newClip, isOwner: true };
      setClips((prevClips) => [clipWithOwnerFlag, ...prevClips]);
      setAudioBlob(null);
      setCaption("");
      setAudioURL(null);
      setSeconds(0);
      setUpload(false);
    } catch (err) {
      console.error(err);
      alert("Failed to upload clip");
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setSeconds(0);
  };

  return (
    <div>
      <h2>Record your confession</h2>
      {recording && <p className="text-sm text-gray-600">Recording: {seconds}</p>}
      <div className="flex gap-2 mb-4">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Stop Recording
          </button>
        )}
      </div>
      {audioURL && (
        <div className="flex flex-col gap-2">
          <audio controls src={audioURL}></audio>
          {showUpload && (
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Upload
            </button>
          )}
          <button
            onClick={resetRecording}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg"
          >
            Re-record
          </button>
        </div>
      )}
    </div>
  );
};

export default Recorder;
