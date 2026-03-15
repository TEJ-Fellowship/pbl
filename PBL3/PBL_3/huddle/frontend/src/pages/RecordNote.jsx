import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { uploadVoiceNote } from "../api/voiceNotes";
import { AudioLines, Disc, Mic, Pause, Play, Square, X } from "lucide-react";

const RecordNote = ({ onClose, onSave }) => {
  const [recordingStatus, setRecordingStatus] = useState("ready");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const maxDuration = 60;

  // Start recording function
  const startRecording = async () => {
    setRecordingTime(0);
    setRecordingStatus("recording");
    setIsRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        // const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingStatus("recording");

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsedSeconds);

        if (elapsedSeconds >= maxDuration) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  // Pause recording function
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setRecordingStatus("recording");
        const currentTime = recordingTime;
        const resumeTime = Date.now();
        timerRef.current = setInterval(() => {
          const newTime =
            currentTime + Math.floor((Date.now() - resumeTime) / 1000);
          setRecordingTime(newTime);

          if (newTime >= maxDuration) {
            stopRecording();
          }
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setRecordingStatus("paused");
        clearInterval(timerRef.current);
      }

      setIsPaused(!isPaused);
    }
  };

  // Stop recording function
  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      clearInterval(timerRef.current);

      setIsRecording(false);
      setIsPaused(false);
      setRecordingStatus("stopped");
    }
  };

  // Handle adding a new tag
  const handleAddTag = (e) => {
    if ((e.key === "Enter" || e.key === " ") && tagInput.trim() !== "") {
      e.preventDefault();
      const newTag = tagInput.trim().startsWith("#")
        ? tagInput.trim()
        : `#${tagInput.trim()}`;

      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (audioBlob) {
      let savingStatus;
      try {
        savingStatus = toast.loading("Voice note saving...");

        const result = await uploadVoiceNote(
          audioBlob,
          noteTitle || "Untitled Voice Note",
          tags,
          recordingTime
        );

        toast.update(savingStatus, {
          render: "Voice note saved successfully!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });

        if (onSave) {
          onSave(result.voiceNote);
        }

        if (onClose) {
          onClose();
        }
      } catch (error) {
        if (savingStatus) toast.dismiss(savingStatus);
        console.error("Error saving voice note:", error);
        toast.error(error.message || "Failed to save voice note");
      }
    }
  };

  const handleDiscard = () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      clearInterval(timerRef.current);
    }

    setAudioBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    setRecordingStatus("ready");

    if (onClose) {
      onClose();
    } else {
      toast.info("Recording discarded");
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Get message based on recording status
  const getStatusMessage = () => {
    switch (recordingStatus) {
      case "recording":
        return "Your audio note is in progress.";
      case "paused":
        return "Your audio note is paused.";
      case "stopped":
        return "Your audio note is ready.";
      default:
        return "Your audio note is ready.";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Sambaad</h2>
          </div>
          <button
            onClick={handleDiscard}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold">Recording</h3>
          <p className="text-gray-500 text-sm">{getStatusMessage()}</p>
        </div>

        {/* Controls Area */}
        {(recordingStatus === "recording" || recordingStatus === "paused") && (
          <div className="mb-8">
            <div className="h-16 flex items-center justify-center">
              <AudioLines
                className={`h-16 w-32 text-red-500 ${
                  recordingStatus === "recording" ? "animate-pulse" : ""
                }`}
                strokeWidth={1.5}
              />
            </div>
          </div>
        )}

        <div className="flex justify-center items-center space-x-12 mb-10">
          {/* Pause Button */}
          <button
            className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors focus:outline-none"
            onClick={pauseRecording}
            disabled={!isRecording || recordingStatus === "stopped"}
          >
            {isPaused ? <Pause /> : <Play />}
          </button>

          {/* Main Record/Stop Button */}
          <button
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
              recordingStatus === "recording"
                ? "bg-red-500 ring-3 ring-red-200"
                : "bg-red-500"
            } transition-all duration-200 focus:outline-none`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <Square className="h-5 w-5" />
            ) : (
              <Disc className="h-6 w-6 text-white" />
            )}
          </button>

          {/* Square button */}
          <button
            className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors focus:outline-none"
            disabled={!isRecording || recordingStatus === "stopped"}
          >
            <Square className="h-5 w-5" />
          </button>
        </div>

        {/* Timer */}
        <div className="text-center mb-10">
          <div className="text-5xl font-bold tracking-wider">
            {formatTime(recordingTime)}
          </div>
          <div className="text-gray-400 text-sm mt-1">
            / {formatTime(maxDuration)}
          </div>
        </div>

        {/* Note Title Input - always shown */}
        <div className="mb-5">
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Enter Note Title"
            className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-red-500"
            disabled={recordingStatus === "recording"}
          />
        </div>

        {/* Tags Input - always shown */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <div
                key={index}
                className="bg-pink-100 text-pink-800 rounded-full px-3 py-1 text-sm flex items-center"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-pink-600 hover:text-pink-800"
                  disabled={recordingStatus === "recording"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add Tags (e.g., #idea, #thought)"
            className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-red-500"
            disabled={recordingStatus === "recording"}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            className="px-10 py-3.5 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none"
            onClick={handleDiscard}
          >
            Cancel
          </button>

          <button
            className={`px-10 py-3.5 rounded-full text-white font-medium transition-colors ${
              recordingStatus === "stopped" || audioBlob
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-300"
            } focus:outline-none`}
            onClick={handleSave}
            disabled={!(recordingStatus === "stopped" || audioBlob)}
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordNote;
