import React from "react";
import { useState, useEffect, useRef } from "react";
import uploadClip from "../api/clipApi";
// import uploadClip from "../"
const Recorder = () => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); //asking for permission to use microphone
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
    } catch (error) {
      console.log("Mic access denied :", error);
    }
  };
  const stopRecording = async () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };
  const handleUpload = async () => {
    if (!audioBlob) return alert("No recording yet!");
    await uploadClip(audioBlob);
    alert("Audio Uploaded");
    setAudioBlob(null);
    setAudioURL(null);
  };
  return (
    <div>
      <h2>Record your confession</h2>
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
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Upload Recording
          </button>
        </div>
      )}
    </div>
  );
};

export default Recorder;
