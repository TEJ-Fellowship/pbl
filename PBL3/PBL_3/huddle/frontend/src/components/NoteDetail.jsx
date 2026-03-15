import { useState, useRef } from "react";
import { transcribeVoiceNote } from "../api/voiceNotes";
import {
  CirclePause,
  CirclePlay,
  FastForward,
  SkipBack,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";
import cover from "../assets/cover.jpg";

const NoteDetail = ({ note, onClose, onDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState(note.transcript || "");
  const [error, setError] = useState("");
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const seek = (sec) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      duration,
      Math.max(0, audioRef.current.currentTime + sec)
    );
  };

  const transcribe = async () => {
    try {
      setIsTranscribing(true);
      setError("");
      const res = await transcribeVoiceNote(note._id);
      setTranscript(res.transcript);
    } catch (err) {
      setError(err.message || "Failed to transcribe");
    } finally {
      setIsTranscribing(false);
    }
  };

  const userName = note.userName || "User";
  const createdDate = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString()
    : "";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 z-50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{note.title}</h2>
            <p className="text-sm text-gray-500">
              • {userName} {createdDate && `| ${createdDate}`}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onDelete(note._id)}>
              <Trash2 className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
            <button onClick={onClose}>
              <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        </div>
        <div
          className="w-full aspect-video bg-cover bg-center rounded-lg mb-6"
          style={{ backgroundImage: `url(${note.coverImage || cover})` }}
        />
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <audio
            ref={audioRef}
            src={note.fileUrl}
            preload="metadata"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
          />

          <div className="flex items-center gap-3 mb-4">
            <button onClick={togglePlay}>
              {isPlaying ? (
                <CirclePause
                  strokeWidth={1.2}
                  className="w-10 h-10 text-gray-700"
                />
              ) : (
                <CirclePlay
                  strokeWidth={1.2}
                  className="w-10 h-10 text-gray-700"
                />
              )}
            </button>
            <div className="flex-1 bg-gray-300 h-2 rounded">
              <div
                className="bg-indigo-500 h-2 rounded"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {formatTime(currentTime)}
            </span>
          </div>

          <div className="flex justify-center gap-6">
            <button onClick={() => seek(-5)}>
              <FastForward
                strokeWidth={2}
                className="w-6 h-6 -scale-x-100 text-gray-600"
              />
            </button>
            <button onClick={() => seek(-10)}>
              <SkipBack strokeWidth={2} className="w-6 h-6 text-gray-600" />
            </button>
            <button onClick={() => seek(10)}>
              <SkipForward strokeWidth={2} className="w-6 h-6 text-gray-600" />
            </button>
            <button onClick={() => seek(5)}>
              <FastForward strokeWidth={2} className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Tags</h3>
          <div className="flex gap-2 flex-wrap">
            {note.tags?.length ? (
              note.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-sm bg-indigo-100 text-indigo-600 rounded"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No tags</span>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Transcription</h3>
            {!transcript && !isTranscribing && (
              <button
                onClick={transcribe}
                className="px-3 py-1 text-sm bg-teal-500 text-white rounded hover:bg-teal-600"
              >
                Generate Transcript
              </button>
            )}
          </div>

          {isTranscribing && (
            <p className="text-gray-500 text-sm">Transcribing audio...</p>
          )}
          {error && <p className="text-red-500 text-sm mb-2">Error: {error}</p>}
          {transcript ? (
            <div className="bg-gray-50 p-3 rounded border text-sm whitespace-pre-wrap max-h-24 overflow-y-auto">
              {transcript}
            </div>
          ) : (
            !isTranscribing &&
            !error && (
              <p className="text-gray-500 text-sm border border-dashed p-4 rounded text-center">
                No transcription available
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;
